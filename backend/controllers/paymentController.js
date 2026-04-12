import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import {
  buildAndPlaceOrder,
  SHIPPING_COSTS,
} from "../utils/buildAndPlaceOrder.js";
import logger from "../utils/logger.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /v1/payment/create-order ─────────────────────────────────────────────
// Computes total server-side from cart + shipping, creates Razorpay order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { addressId, shippingMethod = "standard" } = req.body;

    if (!addressId)
      return res
        .status(400)
        .json({ success: false, message: "addressId is required" });

    const shippingCost = SHIPPING_COSTS[shippingMethod] ?? 99;

    // Compute cart subtotal server-side (never trust client-sent amount for payment)
    const customer = await User.findById(req.user._id);
    if (!customer.cart || customer.cart.length === 0)
      return res.status(400).json({ success: false, message: "Cart is empty" });

    const productIds = [...new Set(customer.cart.map((i) => i.product))];
    const products = await Product.find({
      _id: { $in: productIds },
      isDeleted: { $ne: true },
    });
    const productMap = Object.fromEntries(
      products.map((p) => [p._id.toString(), p]),
    );

    let itemsTotal = 0;
    for (const cartItem of customer.cart) {
      const product = productMap[cartItem.product.toString()];
      if (!product)
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });

      const variant = product.variants.find(
        (v) => v.sku === cartItem.variantSku,
      );
      if (!variant)
        return res.status(404).json({
          success: false,
          message: `Variant '${cartItem.variantSku}' not found`,
        });

      const price = variant.price ?? product.salePrice ?? product.basePrice;
      itemsTotal += price * cartItem.quantity;
    }

    const grandTotal = itemsTotal + shippingCost;

    // Razorpay expects amount in paise (₹1 = 100 paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: grandTotal * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    logger.logEvent("error", "Failed to create Razorpay order", {
      error: err.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to initiate payment",
      error: err.message,
    });
  }
};

// ── POST /v1/payment/verify ───────────────────────────────────────────────────
// 1. Verify HMAC signature  2. Deduct stock + create Order in a transaction
export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      addressId,
      shippingMethod = "standard",
    } = req.body;

    // ── Step 1: Verify signature ──────────────────────────────────────────────
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // ── Step 2: Place order with stock deduction ──────────────────────────────
    const order = await buildAndPlaceOrder({
      customerId: req.user._id,
      addressId,
      shippingMethod,
      paymentData: {
        method: "razorpay",
        status: "paid",
        gatewayOrderId: razorpayOrderId,
        gatewayPaymentId: razorpayPaymentId,
        transactionId: razorpayPaymentId,
        paidAt: new Date(),
      },
      session,
    });

    await session.commitTransaction();
    session.endSession();

    logger.logEvent("info", "Razorpay payment verified and order placed", {
      orderId: order._id,
    });
    res.status(201).json({
      success: true,
      message: "Payment verified. Order placed successfully.",
      order,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.logEvent("error", "Payment verification failed", {
      error: err.message,
    });
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Payment verification failed",
    });
  }
};
