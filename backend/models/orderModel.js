import mongoose from "mongoose";

// ─── Order Item Sub-Schema ────────────────────────────────────────────────────
// Represents a single product variant line inside a seller's sub-order
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // Snapshot of variant details at time of purchase
    // (product data can change later, order must stay accurate)
    variantSnapshot: {
      sku: { type: String, required: true },
      color: { type: String },
      size: { type: String },
      price: { type: Number, required: true }, // price at time of order
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    itemTotal: {
      type: Number,
      required: true, // variantSnapshot.price * quantity
    },
  },
  { _id: false },
);

// ─── Seller Order Sub-Schema ──────────────────────────────────────────────────
// One entry per seller within a single customer order
const sellerOrderSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "Seller order must have at least one item",
      },
    },
    subTotal: {
      type: Number,
      required: true, // sum of all itemTotals for this seller
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled",
            "returned",
          ],
        },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    // Tracking info filled in when seller marks as shipped
    trackingInfo: {
      courier: { type: String },
      trackingNumber: { type: String },
      estimatedDelivery: { type: Date },
    },
  },
  { _id: true }, // keep _id so seller can reference their specific sub-order
);

// ─── Payment Sub-Schema ───────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cod", "online", "upi"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    // Populated after successful online/UPI payment
    transactionId: { type: String }, // gateway transaction ID
    gatewayOrderId: { type: String }, // Razorpay/Stripe order ID
    gatewayPaymentId: { type: String }, // Razorpay payment ID
    paidAt: { type: Date },
  },
  { _id: false },
);

// ─── Main Order Schema ────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Snapshot of address at time of order
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },

    // One entry per seller — core of multi-seller architecture
    sellerOrders: {
      type: [sellerOrderSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "Order must have at least one seller order",
      },
    },

    // Grand total across all sellers
    grandTotal: {
      type: Number,
      required: true,
    },

    payment: {
      type: paymentSchema,
      required: true,
    },

    // Overall order-level status (derived from sellerOrders statuses)
    // Useful for customer-facing order tracking
    overallStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "partially_shipped",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },

    // Soft delete / archival
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt = order placed time
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
orderSchema.index({ "sellerOrders.seller": 1 }); // fast seller order lookup
orderSchema.index({ createdAt: -1 }); // latest orders first
orderSchema.index({ overallStatus: 1 });

// ─── Instance Method: Recalculate overallStatus ───────────────────────────────
// Call this after updating any sellerOrder status to keep overallStatus in sync
orderSchema.methods.syncOverallStatus = function () {
  const statuses = this.sellerOrders.map((so) => so.status);
  const unique = [...new Set(statuses)];

  if (unique.every((s) => s === "delivered")) this.overallStatus = "delivered";
  else if (unique.every((s) => s === "cancelled"))
    this.overallStatus = "cancelled";
  else if (unique.every((s) => s === "returned"))
    this.overallStatus = "returned";
  else if (unique.includes("shipped") && unique.length > 1)
    this.overallStatus = "partially_shipped";
  else if (unique.includes("shipped")) this.overallStatus = "shipped";
  else if (unique.includes("confirmed")) this.overallStatus = "confirmed";
  else this.overallStatus = "pending";
};

const Order = mongoose.model("Order", orderSchema);
export default Order;
