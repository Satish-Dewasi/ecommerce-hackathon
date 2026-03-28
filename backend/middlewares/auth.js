import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsyncErrors from "./catchAsyncErrors.js";
import User from "../models/userModel.js";

// ─────────────────────────────────────────
//  isAuthenticated — Verify Access Token
// ─────────────────────────────────────────
export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const authHeader = req.header("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  if (!accessToken) {
    return next(new ErrorHandler("Please log in to access this resource", 401));
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    // Differentiate between expired and invalid token
    if (err.name === "TokenExpiredError") {
      return next(
        new ErrorHandler(
          "Access token expired. Please refresh your token",
          401,
        ),
      );
    }
    return next(new ErrorHandler("Invalid access token", 401));
  }

  // Find user — exclude sensitive fields
  const user = await User.findById(decoded.id).select(
    "-password -refreshToken -passwordResetToken -passwordResetTokenExpiry -emailVerifyToken -emailVerifyTokenExpiry",
  );

  if (!user) {
    return next(new ErrorHandler("User no longer exists", 404));
  }

  // Block banned users from accessing protected routes
  if (user.isBanned) {
    return next(
      new ErrorHandler(
        `Your account has been banned. Reason: ${user.banReason || "Contact support"}`,
        403,
      ),
    );
  }

  // Block deactivated accounts
  if (!user.isActive) {
    return next(
      new ErrorHandler(
        "Your account is deactivated. Please contact support",
        403,
      ),
    );
  }

  // Attach user to request — available in all downstream controllers
  req.user = user;
  next();
});

// ─────────────────────────────────────────
//  authorizeRoles — Role Based Access Control
// ─────────────────────────────────────────
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role '${req.user.role}' is not allowed to access this route`,
          403,
        ),
      );
    }
    next();
  };
};

// ─────────────────────────────────────────
//  authorizePermissions — Sub-Admin Permission Check
// ─────────────────────────────────────────
// Usage: authorizePermissions("manage_orders")
export const authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    // Full admins bypass permission check
    if (req.user.role === "admin") return next();

    const hasPermission = requiredPermissions.every((perm) =>
      req.user.permissions?.includes(perm),
    );

    if (!hasPermission) {
      return next(
        new ErrorHandler(
          "You do not have permission to perform this action",
          403,
        ),
      );
    }

    next();
  };
};
