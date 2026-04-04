import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import mongoose from "mongoose";

// ═══════════════════════════════════════════════════════════
//  HELPER
// ═══════════════════════════════════════════════════════════

// Confirm a product belongs to the requesting seller
const assertOwnership = async (productId, sellerId) => {
  const product = await Product.findOne({
    _id: productId,
    seller: sellerId, // clean direct match now
    isDeleted: { $ne: true }, // keep this — products have no isDeleted field yet
  });
  if (!product) return null;
  return product;
};

// ═══════════════════════════════════════════════════════════
//  PRODUCT MANAGEMENT
// ═══════════════════════════════════════════════════════════

// ── GET /seller/products ─────────────────────────────────
// List all products owned by the logged-in seller
export const getMyProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const sellerId = req.user._id;

    const filter = {
      seller: sellerId, // clean — both are ObjectId now
      isDeleted: { $ne: true },
      ...(search && { name: { $regex: search, $options: "i" } }),
    };

    const sortOrder = order === "asc" ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select("-__v"),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// ── GET /seller/products/:productId ─────────────────────
// Get a single product — must be seller's own
export const getMyProductById = async (req, res) => {
  try {
    const product = await assertOwnership(req.params.productId, req.user._id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// ── POST /seller/products ────────────────────────────────
// Create a new product — seller is stamped from JWT
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      seller: req.user._id, // always from token, never from body
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A variant SKU already exists",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// ── PATCH /seller/products/:productId ───────────────────
// Update top-level product fields (name, description, category, etc.)
// Does NOT touch variants — use dedicated variant routes for that
export const updateProduct = async (req, res) => {
  try {
    const product = await assertOwnership(req.params.productId, req.user._id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }

    // Prevent seller from overriding ownership fields via body
    const { seller, isDeleted, ...safeUpdates } = req.body;

    Object.assign(product, safeUpdates);
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// ── DELETE /seller/products/:productId ──────────────────
// Soft delete — sets isDeleted: true
export const deleteProduct = async (req, res) => {
  try {
    const product = await assertOwnership(req.params.productId, req.user._id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }

    product.isDeleted = true;
    await product.save();

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════
//  VARIANT MANAGEMENT
// ═══════════════════════════════════════════════════════════

// ── POST /seller/products/:productId/variants ────────────
// Add a new variant to an existing product
export const addVariant = async (req, res) => {
  try {
    const product = await assertOwnership(req.params.productId, req.user._id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }

    product.variants.push(req.body);
    await product.save();

    const newVariant = product.variants[product.variants.length - 1];
    res.status(201).json({
      success: true,
      message: "Variant added successfully",
      variant: newVariant,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "SKU already exists" });
    }
    res.status(500).json({
      success: false,
      message: "Failed to add variant",
      error: error.message,
    });
  }
};

// ── PATCH /seller/products/:productId/variants/:sku ─────
// Update a specific variant (price, stock, color, size)
export const updateVariant = async (req, res) => {
  try {
    const product = await assertOwnership(req.params.productId, req.user._id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }

    const variant = product.variants.find((v) => v.sku === req.params.sku);
    if (!variant) {
      return res
        .status(404)
        .json({ success: false, message: "Variant not found" });
    }

    // Prevent changing the SKU identifier itself
    const { sku, ...safeUpdates } = req.body;
    Object.assign(variant, safeUpdates);
    await product.save();

    res.status(200).json({
      success: true,
      message: "Variant updated successfully",
      variant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update variant",
      error: error.message,
    });
  }
};

// ── DELETE /seller/products/:productId/variants/:sku ────
// Remove a variant from a product
export const deleteVariant = async (req, res) => {
  try {
    const product = await assertOwnership(req.params.productId, req.user._id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }

    const variantIndex = product.variants.findIndex(
      (v) => v.sku === req.params.sku,
    );
    if (variantIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Variant not found" });
    }

    product.variants.splice(variantIndex, 1);
    await product.save();

    res
      .status(200)
      .json({ success: true, message: "Variant removed successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete variant",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════
//  ORDER MANAGEMENT
// ═══════════════════════════════════════════════════════════

// ── GET /seller/orders ───────────────────────────────────
// List all orders that contain this seller's products
// Filters down to only the seller's own sellerOrder slice
export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const sellerId = req.user._id;

    const matchStage = {
      "sellerOrders.seller": new mongoose.Types.ObjectId(sellerId),
    };
    if (status) matchStage["sellerOrders.status"] = status;

    const orders = await Order.find(matchStage)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("customer", "fullName email phone")
      .lean();

    // Strip other sellers' data — seller only sees their own slice
    const sanitized = orders.map((order) => ({
      _id: order._id,
      customer: order.customer,
      shippingAddress: order.shippingAddress,
      payment: {
        method: order.payment.method,
        status: order.payment.status,
      },
      createdAt: order.createdAt,
      sellerOrder: order.sellerOrders.find(
        (so) => so.seller.toString() === sellerId.toString(),
      ),
    }));

    const total = await Order.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      orders: sanitized,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// ── GET /seller/orders/:orderId ──────────────────────────
// Get full detail of one order — only the seller's sellerOrder slice
export const getMyOrderById = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const order = await Order.findOne({
      _id: req.params.orderId,
      "sellerOrders.seller": sellerId,
    })
      .populate("customer", "fullName email phone")
      .populate("sellerOrders.items.product", "name images")
      .lean();

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found or access denied" });
    }

    const sellerOrder = order.sellerOrders.find(
      (so) => so.seller.toString() === sellerId.toString(),
    );

    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        payment: { method: order.payment.method, status: order.payment.status },
        createdAt: order.createdAt,
        sellerOrder,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// ── PATCH /seller/orders/:orderId/status ─────────────────
// Update fulfillment status on this seller's sellerOrder slice
// Valid transitions: pending → confirmed → shipped → delivered
//                   any     → cancelled / returned
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note, trackingInfo } = req.body;
    const sellerId = req.user._id;

    const VALID_STATUSES = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];
    if (!VALID_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      "sellerOrders.seller": sellerId,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found or access denied" });
    }

    const sellerOrder = order.sellerOrders.find(
      (so) => so.seller.toString() === sellerId.toString(),
    );

    // Append to history before changing
    sellerOrder.statusHistory.push({ status, note });
    sellerOrder.status = status;

    // Attach tracking info if seller is marking as shipped
    if (status === "shipped" && trackingInfo) {
      sellerOrder.trackingInfo = trackingInfo;
    }

    // Keep top-level overallStatus in sync
    order.syncOverallStatus();
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'`,
      sellerOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════
//  SALES INSIGHTS
// ═══════════════════════════════════════════════════════════

// ── GET /seller/insights ─────────────────────────────────
// Sales summary: revenue, units sold, order count, top products
// Optional query params: from, to (ISO date strings)
export const getSalesInsights = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth(); // 0-indexed

    // ── Year start → now ──────────────────────────────────
    const yearStart = new Date(thisYear, 0, 1);

    // ── Monthly breakdown pipeline ────────────────────────
    const monthlyPipeline = [
      {
        $match: {
          "sellerOrders.seller": sellerId,
          createdAt: { $gte: yearStart, $lte: now },
          "sellerOrders.status": { $nin: ["cancelled", "returned"] },
        },
      },
      { $unwind: "$sellerOrders" },
      {
        $match: {
          "sellerOrders.seller": sellerId,
          "sellerOrders.status": { $nin: ["cancelled", "returned"] },
        },
      },
      { $unwind: "$sellerOrders.items" },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } }, // 1-indexed
          revenue: { $sum: "$sellerOrders.items.itemTotal" },
          orderIds: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          revenue: 1,
          totalOrders: { $size: "$orderIds" },
        },
      },
      { $sort: { month: 1 } },
    ];

    const monthlyData = await Order.aggregate(monthlyPipeline);

    // ── Build 12-month array (fill missing months with 0) ──
    const months = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyData.find((d) => d.month === i + 1);
      return {
        month: i + 1,
        label: new Date(thisYear, i, 1).toLocaleString("en-IN", {
          month: "short",
        }),
        revenue: found?.revenue || 0,
        totalOrders: found?.totalOrders || 0,
      };
    });

    // ── Derive summary values ──────────────────────────────
    const thisMonthData = months[thisMonth];
    const lastMonthData = months[thisMonth - 1] || {
      revenue: 0,
      totalOrders: 0,
    };

    const thisMonthRevenue = thisMonthData.revenue;
    const lastMonthRevenue = lastMonthData.revenue;

    const monthChange =
      lastMonthRevenue > 0
        ? (
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(1)
        : null; // null = no previous data to compare

    const totalYearRevenue = months.reduce((s, m) => s + m.revenue, 0);
    const totalYearOrders = months.reduce((s, m) => s + m.totalOrders, 0);
    const avgOrderValue =
      totalYearOrders > 0 ? Math.round(totalYearRevenue / totalYearOrders) : 0;

    res.status(200).json({
      success: true,
      summary: {
        thisMonthRevenue,
        lastMonthRevenue,
        monthChangePercent: monthChange, // e.g. "12.5" or "-8.3" or null
        totalYearRevenue,
        totalYearOrders,
        avgOrderValue,
      },
      monthlyBreakdown: months, // array of 12 months with revenue + orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch insights",
      error: error.message,
    });
  }
};
