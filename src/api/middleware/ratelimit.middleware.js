import rateLimit from "express-rate-limit";
import { env } from "../../config/index.js";

/**
 * Rate limiter for authentication endpoints (login, register, password reset)
 * Stricter limits to prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  skipFailedRequests: false, // Count failed requests
  // Custom key generator (optional) - use IP by default
  keyGenerator: (req) => {
    // You could also use req.body.username to limit per username
    return req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many authentication attempts. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000), // Unix timestamp
    });
  },
});

/**
 * General API rate limiter
 * Applied to all API routes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "production" ? 100 : 1000, // More lenient in dev
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests. Please slow down.",
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000),
    });
  },
});

/**
 * Strict rate limiter for sensitive operations
 * (e.g., password reset, email verification)
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    error: "Too many attempts. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many attempts. Please try again in 1 hour.",
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000),
    });
  },
});

/**
 * File upload rate limiter
 * Prevents abuse of upload endpoints
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  message: {
    success: false,
    error: "Too many upload requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Upload limit exceeded. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000),
    });
  },
});
