import express from "express";
import {
  // Products
  getMyProducts,
  getMyProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  // Variants
  addVariant,
  updateVariant,
  deleteVariant,
  // Orders
  getMyOrders,
  getMyOrderById,
  updateOrderStatus,
  // Insights
  getSalesInsights,
} from "../controllers/sellerController.js";

import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// ── All seller routes require authentication + seller role ──
router.use(isAuthenticated, authorizeRoles("seller"));

// GET    /seller/products              list my products (paginated, searchable)
// POST   /seller/products              create a new product
// GET    /seller/products/:productId   get one of my products
// PATCH  /seller/products/:productId   update top-level product fields
// DELETE /seller/products/:productId   soft delete a product

router.route("/products").get(getMyProducts).post(createProduct);

router
  .route("/products/:productId")
  .get(getMyProductById)
  .patch(updateProduct)
  .delete(deleteProduct);

//  VARIANT ROUTES
// POST   /seller/products/:productId/variants        add a variant
// PATCH  /seller/products/:productId/variants/:sku   update a variant by SKU
// DELETE /seller/products/:productId/variants/:sku   remove a variant by SKU

router.post("/products/:productId/variants", addVariant);

router
  .route("/products/:productId/variants/:sku")
  .patch(updateVariant)
  .delete(deleteVariant);

//  ORDER ROUTES
// GET   /seller/orders                       list my orders (filterable by status)
// GET   /seller/orders/:orderId              get one order (my slice only)
// PATCH /seller/orders/:orderId/status       update fulfillment status

router.route("/seller/orders").get(getMyOrders);

router.route("/seller/orders/:orderId").get(getMyOrderById);

router.patch("/seller/orders/:orderId/status", updateOrderStatus);

//  INSIGHTS ROUTES
// GET /seller/insights

router.get("/insights", getSalesInsights);

export default router;
