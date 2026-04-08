import rateLimit from "express-rate-limit";
import logger from "../utils/logger.js";

const onLimitReached = (req, res, options) => {
  logger.logEvent("warn", "Rate limit exceeded", {
    ip: req.ip,
    route: req.originalUrl,
    method: req.method,
  });
};

// For auth routes — login, register
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true, // sends RateLimit-* headers to client
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    onLimitReached(req, res, options);
    res.status(429).json(options.message);
  },
});

// For checkout — prevent order spamming
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    message: "Too many checkout attempts. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    onLimitReached(req, res, options);
    res.status(429).json(options.message);
  },
});

// For all other API routes — general protection
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    onLimitReached(req, res, options);
    res.status(429).json(options.message);
  },
});
