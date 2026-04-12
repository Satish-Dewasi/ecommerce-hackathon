import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { buildAndPlaceOrder } from "../utils/buildAndPlaceOrder.js";

//  PLACE ORDER  —  POST /orders/checkout
export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { addressId, shippingMethod = "standard" } = req.body;

    if (!addressId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "addressId is required" });
    }

    const order = await buildAndPlaceOrder({
      customerId: req.user._id,
      addressId,
      shippingMethod,
      paymentData: { method: "cod", status: "pending" },
      session,
    });

    await session.commitTransaction();
    session.endSession();

    logger.logEvent("info", "COD order placed successfully", {
      orderId: order._id,
    });
    res
      .status(201)
      .json({ success: true, message: "Order placed successfully", order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.logEvent("error", "Failed to place COD order", {
      error: err.message,
    });
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Failed to place order",
    });
  }
};

//  GET MY ORDERS  —  GET /orders/my
export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {
      customer: req.user._id,
      isDeleted: { $ne: true },
      ...(status && { overallStatus: status }),
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select("-sellerOrders.statusHistory -__v") // keep response lean
        .populate("sellerOrders.items.product", "name images"),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

//  GET ORDER DETAIL  —  GET /orders/my/:orderId
export const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      customer: req.user._id,
      isDeleted: { $ne: true },
    })
      .populate(
        "sellerOrders.seller",
        "name sellerProfile.storeName sellerProfile.storeLogo",
      )
      .populate("sellerOrders.items.product", "name images");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

//  CANCEL ORDER  —  PATCH /orders/my/:orderId/cancel
export const cancelMyOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      customer: req.user._id,
      isDeleted: { $ne: true },
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Block cancellation if any slice is shipped/delivered
    const nonCancellable = order.sellerOrders.some((so) =>
      ["shipped", "delivered"].includes(so.status),
    );

    if (nonCancellable) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message:
          "Order cannot be cancelled — one or more items have already been shipped or delivered",
      });
    }

    // Cancel all seller slices + restore stock
    for (const sellerOrder of order.sellerOrders) {
      if (["cancelled", "returned"].includes(sellerOrder.status)) continue;

      // Restore stock for each item
      for (const item of sellerOrder.items) {
        await Product.updateOne(
          {
            _id: item.product,
            "variants.sku": item.variantSnapshot.sku,
          },
          {
            $inc: { "variants.$.stock": item.quantity },
          },
          { session },
        );
      }

      sellerOrder.status = "cancelled";
      sellerOrder.statusHistory.push({
        status: "cancelled",
        note: req.body.reason || "Cancelled by customer",
      });
    }

    order.syncOverallStatus();
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    logger.logEvent("info", "Order cancelled successfully", {
      orderId: order._id,
    });
    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};
