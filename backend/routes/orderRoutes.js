import express from "express";

// Customer order controller
import {
  placeOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
} from "../controllers/orderController.js";

// Seller order functions (already built in sellerController)
import {
  getMyOrders as getSellerOrders,
  getMyOrderById as getSellerOrderById,
  updateOrderStatus,
} from "../controllers/sellerController.js";

import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════════
//  CUSTOMER ORDER ROUTES  (role: customer)
// ═══════════════════════════════════════════════════════════

// POST  /orders/checkout              → place order from cart
// GET   /orders/my                    → list my orders (filterable by status)
// GET   /orders/my/:orderId           → single order detail
// PATCH /orders/my/:orderId/cancel    → cancel order (pre-shipment only)

router.post(
  "/checkout",
  isAuthenticated,
  authorizeRoles("customer"),
  placeOrder,
);

router.get("/my", isAuthenticated, authorizeRoles("customer"), getMyOrders);

router.get(
  "/my/:orderId",
  isAuthenticated,
  authorizeRoles("customer"),
  getMyOrderById,
);

router.patch(
  "/my/:orderId/cancel",
  isAuthenticated,
  authorizeRoles("customer"),
  cancelMyOrder,
);

// ═══════════════════════════════════════════════════════════
//  SELLER ORDER ROUTES  (role: seller)
// ═══════════════════════════════════════════════════════════

// GET   /orders/seller                        → list orders containing my products
// GET   /orders/seller/:orderId               → single order (my slice only)
// PATCH /orders/seller/:orderId/status        → update fulfillment status

router.get(
  "/seller",
  isAuthenticated,
  authorizeRoles("seller"),
  getSellerOrders,
);

router.get(
  "/seller/:orderId",
  isAuthenticated,
  authorizeRoles("seller"),
  getSellerOrderById,
);

router.patch(
  "/seller/:orderId/status",
  isAuthenticated,
  authorizeRoles("seller"),
  updateOrderStatus,
);

export default router;
