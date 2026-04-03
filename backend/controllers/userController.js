import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import User from "../models/userModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { generateAccessAndRefreshToken } from "../utils/generateAccessAndRefreshToken.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// ─────────────────────────────────────────
//  Register User
// ─────────────────────────────────────────
export const registerController = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("Email is already registered", 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || undefined, // undefined so sparse unique index is not triggered
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
  });
});

// ─────────────────────────────────────────
//  Login User
// ─────────────────────────────────────────
export const loginController = catchAsyncErrors(async (req, res, next) => {
  console.log("login attempt");

  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email & password", 400));
  }

  // find user and explicitly select password (select: false in schema)
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("User not found with this email", 404));
  }

  // Block banned users from logging in
  if (user.isBanned) {
    return next(
      new ErrorHandler(
        `Account banned: ${user.banReason || "Contact support"}`,
        403,
      ),
    );
  }

  // Block deactivated accounts
  if (!user.isActive) {
    return next(
      new ErrorHandler("Account is deactivated. Contact support.", 403),
    );
  }

  // Google OAuth users may not have a password
  if (!user.password) {
    return next(
      new ErrorHandler(
        "This account uses Google login. Please sign in with Google.",
        400,
      ),
    );
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  // Update last login info
  await User.findByIdAndUpdate(user._id, {
    lastLoginAt: new Date(),
    lastLoginIp: req.ip,
  });

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  res.status(200).cookie("refreshToken", refreshToken, cookieOptions).json({
    success: true,
    message: "Logged in successfully",
    accessToken,
  });
});

// ─────────────────────────────────────────
//  Logout User
// ─────────────────────────────────────────
export const logoutController = catchAsyncErrors(async (req, res, next) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

  res.cookie("refreshToken", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// ─────────────────────────────────────────
//  Get My Profile  (GET /me)
// ─────────────────────────────────────────
export const userProfile = catchAsyncErrors(async (req, res, next) => {
  // req.user is set by auth middleware
  const user = await User.findById(req.user._id)
    .populate("wishlist.product", "name thumbnail basePrice") // populate wishlist product details
    .populate("cart.product", "name thumbnail basePrice variants");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// ─────────────────────────────────────────
//  Update Profile  (PUT /me/update)
// ─────────────────────────────────────────
export const updateProfileController = catchAsyncErrors(
  async (req, res, next) => {
    const { name, phone, dateOfBirth, gender, preferences } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(gender && { gender }),
        ...(preferences && { preferences }),
      },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  },
);

// ─────────────────────────────────────────
//  Addresses — Add New Address  (POST /me/address)
// ─────────────────────────────────────────
export const addAddressController = catchAsyncErrors(async (req, res, next) => {
  const {
    label,
    fullName,
    phone,
    line1,
    line2,
    city,
    state,
    pincode,
    country,
    isDefault,
  } = req.body;

  const user = await User.findById(req.user._id);

  const newAddress = {
    label,
    fullName: fullName || user.name, // ← use provided or fall back to profile
    phone: phone || user.phone, // ← use provided or fall back to profile
    line1,
    line2,
    city,
    state,
    pincode,
    country,
    isDefault,
  };

  // If this is marked default, unset all others first
  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(newAddress);
  await user.save({ validateBeforeSave: false });

  res.status(201).json({ success: true, addresses: user.addresses });
});

// ─────────────────────────────────────────
//  Addresses — Update Address  (PUT /me/address/:addressId)
// ─────────────────────────────────────────
export const updateAddressController = catchAsyncErrors(
  async (req, res, next) => {
    const { addressId } = req.params;
    const updates = req.body;

    const user = await User.findById(req.user._id);

    const address = user.addresses.id(addressId); // ← mongoose subdocument lookup
    if (!address) {
      return next(new ErrorHandler("Address not found", 404));
    }

    // Only update fields that were actually sent
    Object.assign(address, updates);

    await user.save({ validateBeforeSave: false }); // ← skip validation

    res.status(200).json({ success: true, addresses: user.addresses });
  },
);

// ─────────────────────────────────────────
//  Addresses — Delete Address  (DELETE /me/address/:addressId)
// ─────────────────────────────────────────
export const deleteAddressController = catchAsyncErrors(
  async (req, res, next) => {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);

    if (!address) {
      return next(new ErrorHandler("Address not found", 404));
    }

    address.deleteOne();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  },
);

// ─────────────────────────────────────────
//  Wishlist — Add / Remove Toggle  (POST /me/wishlist)
// ─────────────────────────────────────────
export const toggleWishlistController = catchAsyncErrors(
  async (req, res, next) => {
    const { productId } = req.body;

    if (!productId) {
      return next(new ErrorHandler("Product ID is required", 400));
    }

    // Validate it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ErrorHandler("Invalid product ID", 400));
    }

    const user = await User.findById(req.user._id);

    const existingIndex = user.wishlist.findIndex(
      (item) => item?.product?.toString() === productId,
    );

    if (existingIndex !== -1) {
      user.wishlist.splice(existingIndex, 1);
      await user.save({ validateBeforeSave: false });
      return res
        .status(200)
        .json({ success: true, message: "Removed from wishlist" });
    }

    user.wishlist.push({ product: productId });
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: "Added to wishlist" });
  },
);

// ─────────────────────────────────────────
//  Cart — Add / Update Item  (POST /me/cart)
// ─────────────────────────────────────────
export const addToCartController = catchAsyncErrors(async (req, res, next) => {
  const { productId, variantSku, quantity = 1 } = req.body;

  if (!productId) {
    return next(new ErrorHandler("Product ID is required", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new ErrorHandler("Invalid product ID", 400));
  }

  if (quantity < 1) {
    return next(new ErrorHandler("Quantity must be at least 1", 400));
  }

  const user = await User.findById(req.user._id);

  const existingItem = user.cart.find(
    (item) =>
      item?.product?.toString() === productId && item.variantSku === variantSku, // ← optional chaining
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    user.cart.push({ product: productId, variantSku, quantity });
  }

  await user.save({ validateBeforeSave: false }); // ← fix validation error

  res.status(200).json({
    success: true,
    message: "Cart updated",
    cart: user.cart,
  });
});

// ─────────────────────────────────────────
//  Cart — Remove Item  (DELETE /me/cart/:itemId)
// ─────────────────────────────────────────
export const removeFromCartController = catchAsyncErrors(
  async (req, res, next) => {
    const { itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return next(new ErrorHandler("Invalid item ID", 400));
    }

    const user = await User.findById(req.user._id);
    const cartItem = user.cart.id(itemId);

    if (!cartItem) {
      return next(new ErrorHandler("Cart item not found", 404));
    }

    cartItem.deleteOne();
    await user.save({ validateBeforeSave: false }); // ← only change needed

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart: user.cart,
    });
  },
);

// ─────────────────────────────────────────
//  Cart — Clear Cart  (DELETE /me/cart)
// ─────────────────────────────────────────
export const clearCartController = catchAsyncErrors(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { cart: [] });

  res.status(200).json({
    success: true,
    message: "Cart cleared",
  });
});

// ─────────────────────────────────────────
//  Refresh Token  (POST /refresh-token)
// ─────────────────────────────────────────
export const refreshTokenEndpoint = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ message: err?.message || "Invalid refresh token" });
      }

      try {
        const user = await User.findById(decoded.id);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Token rotation check — stored token must match
        if (refreshToken !== user.refreshToken) {
          return res.status(403).json({ message: "Invalid or reused token" });
        }

        const accessToken = user.generateAccessToken();

        return res.status(200).json({ success: true, accessToken });
      } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );
};

// ─────────────────────────────────────────
//  ADMIN — Get All Users  (GET /admin/users)
// ─────────────────────────────────────────
export const getAllUserController = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ deletedAt: null }); // exclude soft-deleted users

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

// ─────────────────────────────────────────
//  ADMIN — Ban / Unban User  (PUT /admin/users/:id/ban)
// ─────────────────────────────────────────
export const banUserController = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { isBanned, banReason } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    {
      isBanned,
      banReason: isBanned ? banReason : null,
      bannedAt: isBanned ? new Date() : null,
    },
    { new: true },
  );

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: isBanned
      ? "User banned successfully"
      : "User unbanned successfully",
    user,
  });
});

// ─────────────────────────────────────────
//  ADMIN — Soft Delete User  (DELETE /admin/users/:id)
// ─────────────────────────────────────────
export const deleteUserController = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { deletedAt: new Date(), isActive: false },
    { new: true },
  );

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
