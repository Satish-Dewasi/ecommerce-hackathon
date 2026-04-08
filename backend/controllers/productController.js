import Product from "../models/productModel.js";
import logger from "../utils/logger.js";
import { getCache, setCache } from "../utils/cache.js";

export const addProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const saved = await newProduct.save();

    logger.logEvent("info", "Product added", { productId: saved._id });
    res.status(201).json({
      success: true,
      message: "New Product Saved Successfully",
      data: saved,
    });
  } catch (e) {
    logger.logEvent("error", "Failed to add product", { error: e.message });
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: e.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      keyword,
      size,
      color,
      minPrice,
      maxPrice,
      category,
      minRating,
      inStock,
      tags,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    if (keyword) {
      query.name = { $regex: keyword, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.salePrice = {};
      if (minPrice) query.salePrice.$gte = Number(minPrice);
      if (maxPrice) query.salePrice.$lte = Number(maxPrice);
    }

    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }

    if (tags) {
      query.tags = { $in: tags.split(",") };
    }

    if (size || color || inStock) {
      query.variants = {
        $elemMatch: {},
      };

      if (size) {
        query.variants.$elemMatch.size = size;
      }

      if (color) {
        query.variants.$elemMatch.color = color;
      }

      if (inStock === "true") {
        query.variants.$elemMatch.stock = { $gt: 0 };
      }
    }

    let sortOption = {};

    switch (sort) {
      case "price_asc":
        sortOption.salePrice = 1;
        break;
      case "price_desc":
        sortOption.salePrice = -1;
        break;
      case "rating":
        sortOption.averageRating = -1;
        break;
      case "newest":
        sortOption.createdAt = -1;
        break;
      default:
        sortOption.createdAt = -1;
    }

    const cacheKey = "products:all";

    // 1. Check cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      logger.logEvent("info", "Products retrieved from cache", {
        query: req.query,
      });
      return res
        .status(200)
        .json({ success: true, fromCache: true, data: cached });
    }

    const products = await Product.find(query).sort(sortOption);
    const total = await Product.countDocuments(query);

    // ===== MINIMAL CHANGE HERE =====
    const formattedProducts = products.map((product) => {
      const variantWithImage = product.variants.find(
        (v) => v.images && v.images.length > 0,
      );

      const thumbnail = variantWithImage
        ? variantWithImage.images[0].url
        : null;

      const colors = [...new Set(product.variants.map((v) => v.color))];

      return {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        averageRating: product.averageRating,
        totalReviews: product.totalReviews,
        thumbnail,
        colors,
      };
    });

    logger.logEvent("info", "Products retrieved", {
      count: formattedProducts.length,
      query: req.query,
    });

    await setCache(cacheKey, formattedProducts, 60 * 5); // Cache for 5 minutes

    res.status(200).json({
      success: true,
      total,
      data: formattedProducts,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: e.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { product_id } = req.params;
    const cacheKey = `products:${id}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res
        .status(200)
        .json({ success: true, fromCache: true, data: cached });
    }
    const productData = await Product.findById(product_id); // ← findById, not find

    if (!productData) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const raw = productData.toObject();

    const colorImages = {};
    raw.variants.forEach((v) => {
      if (v.color && v.images?.length && !colorImages[v.color]) {
        colorImages[v.color] = v.images;
      }
    });

    const cleanVariants = raw.variants.map(({ images, ...rest }) => rest);

    const transformed = {
      ...raw,
      images: colorImages,
      variants: cleanVariants,
    };

    logger.logEvent("info", "Product retrieved", { productId: product_id });
    await setCache(cacheKey, transformed, 60 * 5);
    res.json({ success: true, count: 1, data: [transformed] });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: e.message });
  }
};

export const getProductByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const productData = await Product.find({ category: category });

    res.status(200).json({
      success: true,
      count: productData.length,
      data: productData,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: e,
    });
  }
};
