import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    
    name: { type: String, required: true },
    description: { type: String },

    
    category:{ 
        type :String,
        enum : ["men", "women", "kids"]

    },
    brand: { type: String },

    
    basePrice: { type: Number, required: true },
    salePrice: { type: Number },

    
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
    
    images: [{
        url: String,
        altText: String
    }],

    
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }

    }, { timestamps: true });


const Product = mongoose.model("Product", productSchema);
export default Product;