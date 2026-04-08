import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

//  PLACE ORDER  —  POST /orders/checkout
export const placeOrder = async (req, res) => {
  // Start a session so stock deduction + order creation are atomic
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customerId = req.user._id;

    const { addressId, cartItemIds } = req.body;

    if (!addressId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "addressId is required" });
    }

    //Fetch customer (need addresses + cart)
    const customer = await User.findById(customerId).session(session);

    // Validate address
    const address = customer.addresses.id(addressId);
    if (!address) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Address not found. Please add a valid saved address.",
      });
    }

    // Snapshot address (cart may change later, order must stay accurate)
    const shippingAddress = {
      fullName: address.fullName || customer.name,
      phone: address.phone || customer.phone,
      street: address.line1 + (address.line2 ? `, ${address.line2}` : ""),
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    };

    // Resolve cart items to checkout
    if (!customer.cart || customer.cart.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty" });
    }

    // If specific cartItemIds provided, filter to those only
    const cartToCheckout =
      cartItemIds && cartItemIds.length > 0
        ? customer.cart.filter((item) =>
            cartItemIds.includes(item._id.toString()),
          )
        : customer.cart;

    if (cartToCheckout.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "No valid cart items to checkout" });
    }

    //Fetch all products in one query
    const productIds = [...new Set(cartToCheckout.map((i) => i.product))];
    const products = await Product.find({
      _id: { $in: productIds },
      isDeleted: { $ne: true },
    }).session(session);

    const productMap = Object.fromEntries(
      products.map((p) => [p._id.toString(), p]),
    );

    // Validate stock + build seller buckets
    const sellerBuckets = {}; // { sellerId: { seller, items[], subTotal } }

    for (const cartItem of cartToCheckout) {
      const product = productMap[cartItem.product.toString()];

      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: `Product not found for cart item`,
        });
      }

      // Find the exact variant by SKU
      const variant = product.variants.find(
        (v) => v.sku === cartItem.variantSku,
      );
      if (!variant) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: `Variant '${cartItem.variantSku}' not found in product '${product.name}'`,
        });
      }

      // Stock check
      if (variant.stock < cartItem.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}' (${variant.color} / ${variant.size}). Available: ${variant.stock}, Requested: ${cartItem.quantity}`,
        });
      }

      const sellerId = product.seller.toString();
      const price = variant.price ?? product.salePrice ?? product.basePrice;
      const itemTotal = price * cartItem.quantity;

      // Group by seller
      if (!sellerBuckets[sellerId]) {
        sellerBuckets[sellerId] = {
          seller: product.seller,
          items: [],
          subTotal: 0,
        };
      }

      sellerBuckets[sellerId].items.push({
        product: product._id,
        variantSnapshot: {
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          price,
        },
        quantity: cartItem.quantity,
        itemTotal,
      });

      sellerBuckets[sellerId].subTotal += itemTotal;
    }

    //Deduct stock atomically per variant
    for (const cartItem of cartToCheckout) {
      await Product.updateOne(
        {
          _id: cartItem.product,
          "variants.sku": cartItem.variantSku,
        },
        {
          $inc: { "variants.$.stock": -cartItem.quantity },
        },
        { session },
      );
    }

    // Build sellerOrders array
    const sellerOrders = Object.values(sellerBuckets).map((bucket) => ({
      seller: bucket.seller,
      items: bucket.items,
      subTotal: bucket.subTotal,
      status: "pending",
      statusHistory: [{ status: "pending", note: "Order placed" }],
    }));

    const grandTotal = sellerOrders.reduce((sum, so) => sum + so.subTotal, 0);

    // Create Order
    const [order] = await Order.create(
      [
        {
          customer: customerId,
          shippingAddress,
          sellerOrders,
          grandTotal,
          payment: {
            method: "cod",
            status: "pending",
          },
          overallStatus: "pending",
        },
      ],
      { session },
    );

    // Remove checked-out items from cart
    const checkedOutIds = new Set(cartToCheckout.map((i) => i._id.toString()));
    customer.cart = customer.cart.filter(
      (item) => !checkedOutIds.has(item._id.toString()),
    );
    await customer.save({ session, validateBeforeSave: false });

    // Commit
    await session.commitTransaction();
    session.endSession();

    logger.logEvent("info", "Order placed successfully", {
      orderId: order._id,
    });
    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.logEvent("error", "Failed to place order", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
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
