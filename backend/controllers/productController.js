import Product from "../models/productModel.js";

export const addProduct = async (req, res) => {
    try {
        const newProduct = new Product(req.body)
        const saved = await newProduct.save()

        res.status(201).json({
            success: true,
            message: "New Product Saved Successfully",
            data: saved
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: e.message
        })
    }
}

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
            limit = 10
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
                $elemMatch: {}
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


        const products = await Product.find(query).sort(sortOption);

        const total = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            total,
            data: products
        });

    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: e.message
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        const {product_id} = req.params;
        const productData = await Product.find({_id:product_id})

        res.status(200).json({
            success: true,
            count: productData.length,
            data: productData
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: e
        })
    }
}

export const getProductByCategory = async (req, res) => {
    try {
        const {category} = req.params;
        const productData = await Product.find({category:category})

        res.status(200).json({
            success: true,
            count: productData.length,
            data: productData
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: e
        })
    }
}
