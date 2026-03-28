import express from "express";
import {
  addProduct,
  getAllProducts,
  getProductById,
  getProductByCategory,
} from "../controllers/productController.js";
import Product from "../models/productModel.js";

const router = express.Router();

router.route("/add-product").post(addProduct);
router.route("/products").get(getAllProducts);
router.route("/products/:product_id").get(getProductById);
router.route("/products/:category/:category").get(getProductByCategory);

export default router;
