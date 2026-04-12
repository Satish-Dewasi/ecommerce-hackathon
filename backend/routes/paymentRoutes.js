import express from "express";
import {
  createRazorpayOrder,
  verifyPayment,
} from "../controllers/paymentController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/payment/create-order", isAuthenticated, createRazorpayOrder);
router.post("/payment/verify", isAuthenticated, verifyPayment);

export default router;
