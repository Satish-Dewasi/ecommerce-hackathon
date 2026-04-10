import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ─────────────────────────────────────────
//  Address Sub-Schema
// ─────────────────────────────────────────
const addressSchema = new mongoose.Schema({
  label: { type: String, enum: ["home", "work", "other"], default: "home" },
  fullName: { type: String },
  phone: { type: String },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: "India" },
  isDefault: { type: Boolean, default: false },
});

//  Main User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, unique: true, sparse: true },
    avatar: { type: String }, // profile picture URL
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not"] },

    password: {
      type: String,
      minLength: [6, "Password must have at least 6 characters"],
      select: false,
    },

    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    // Email verification
    emailVerifyToken: { type: String },
    emailVerifyTokenExpiry: { type: Date },

    // Password reset
    passwordResetToken: { type: String },
    passwordResetTokenExpiry: { type: Date },

    // JWT refresh token
    refreshToken: { type: String },

    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },

    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    bannedAt: { type: Date },

    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },

    addresses: [addressSchema],

    wishlist: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        variantSku: { type: String }, // identifies exact size + color combo
        quantity: { type: Number, default: 1, min: 1 },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // Only populated when role === "seller"
    sellerProfile: {
      storeName: { type: String },
      storeDescription: { type: String },
      storeLogo: { type: String },
      gstNumber: { type: String },
      panNumber: { type: String },
      isVerified: { type: Boolean, default: false }, // admin verifies seller docs
      rating: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
    },

    preferences: {
      currency: { type: String, default: "INR" },
      language: { type: String, default: "en" },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },

    // ── 11. Soft Delete ───────────────────
    deletedAt: { type: Date, default: null }, // null = not deleted
  },
  { timestamps: true }, // auto createdAt + updatedAt
);

userSchema.pre("save", async function () {
  // only hash if password field was modified (or is new)
  if (!this.isModified("password")) return;

  // password can be empty for OAuth users (Google login)
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate short-lived access token (1h)
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role }, // include role in payload
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" },
  );
};

// Generate long-lived refresh token (7d)
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

userSchema.virtual("defaultAddress").get(function () {
  return (
    this.addresses?.find((addr) => addr.isDefault) ||
    this.addresses?.[0] ||
    null
  );
});

export default mongoose.model("User", userSchema);
