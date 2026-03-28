import express from "express";
import {
  // Auth
  registerController,
  loginController,
  logoutController,
  refreshTokenEndpoint,

  // Profile
  userProfile,
  updateProfileController,

  // Addresses
  addAddressController,
  updateAddressController,
  deleteAddressController,

  // Wishlist
  toggleWishlistController,

  // Cart
  addToCartController,
  removeFromCartController,
  clearCartController,

  // Admin
  getAllUserController,
  banUserController,
  deleteUserController,
} from "../controllers/userController.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// ─────────────────────────────────────────
//  Auth Routes (Public)
// ─────────────────────────────────────────
router.route("/register").post(registerController);
router.route("/login").post(loginController);
router.route("/refresh-token").post(refreshTokenEndpoint);

// ─────────────────────────────────────────
//  Auth Routes (Protected)
// ─────────────────────────────────────────
router.route("/logout").post(isAuthenticated, logoutController);

// ─────────────────────────────────────────
//  Profile Routes (Protected)
// ─────────────────────────────────────────
router.route("/me").get(isAuthenticated, userProfile);
router.route("/me/update").put(isAuthenticated, updateProfileController);

// ─────────────────────────────────────────
//  Address Routes (Protected)
// ─────────────────────────────────────────
router.route("/me/address").post(isAuthenticated, addAddressController);
router
  .route("/me/address/:addressId")
  .put(isAuthenticated, updateAddressController)
  .delete(isAuthenticated, deleteAddressController);

// ─────────────────────────────────────────
//  Wishlist Routes (Protected)
// ─────────────────────────────────────────
router.route("/me/wishlist").post(isAuthenticated, toggleWishlistController);

// ─────────────────────────────────────────
//  Cart Routes (Protected)
// ─────────────────────────────────────────
router
  .route("/me/cart")
  .post(isAuthenticated, addToCartController)
  .delete(isAuthenticated, clearCartController);

router
  .route("/me/cart/:itemId")
  .delete(isAuthenticated, removeFromCartController);

// ─────────────────────────────────────────
//  Admin Routes (Protected + Admin Only)
// ─────────────────────────────────────────
router
  .route("/admin/users")
  .get(isAuthenticated, authorizeRoles("admin"), getAllUserController);
router
  .route("/admin/users/:id/ban")
  .put(isAuthenticated, authorizeRoles("admin"), banUserController);
router
  .route("/admin/users/:id")
  .delete(isAuthenticated, authorizeRoles("admin"), deleteUserController);

export default router;
