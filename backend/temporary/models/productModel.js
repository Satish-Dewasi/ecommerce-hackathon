import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    // Basic Info
    name: { type: String, required: true },
    description: { type: String },

    // Categorization
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    brand: { type: String },

    // Pricing
    basePrice: { type: Number, required: true },
    salePrice: { type: Number },

    // Variants
    variants: [{
        sku: { type: String, required: true },

        color: String,
        size: String,

        stock: { type: Number, default: 0 },
        price: Number,

        images: [{
            url: String,
            altText: String
        }]
    }],

    // Main Images
    images: [{
   url: String,
   altText: String
 }],

 // Seller
 seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

 // Ratings
 averageRating: { type: Number, default: 0 },
 totalReviews: { type: Number, default: 0 }

}, { timestamps: true });


const Product = mongoose.model("Product", productSchema);
export default Product;