import express from "express";

import {
  placeOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
} from "../controllers/orderController.js";

import {
  getMyOrders as getSellerOrders,
  getMyOrderById as getSellerOrderById,
  updateOrderStatus,
} from "../controllers/sellerController.js";
import { checkoutLimiter } from "../middlewares/rateLimiter.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.post(
  "/checkout",

  isAuthenticated,
  authorizeRoles("customer"),
  checkoutLimiter,
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
