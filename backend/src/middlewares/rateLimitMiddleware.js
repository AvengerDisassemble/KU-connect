/**
 * @module middlewares/rateLimitMiddleware
 * @description Rate limiting middleware to prevent DoS attacks on expensive database operations
 * 
 * Security: HTTP request handlers should not perform expensive operations without rate limiting
 * Otherwise, the application becomes vulnerable to denial-of-service attacks
 */

let rateLimit
try {
  rateLimit = require('express-rate-limit')
} catch (err) {
  // Provide stub that returns middleware passthroughs in test environments
  rateLimit = () => (opts) => {
    return (req, res, next) => next()
  }
}

/**
 * General API rate limiter - Applied to all routes
 * Why: Prevents basic DoS attacks across the entire API
 * Limits: 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for requests from test environment
  skip: (req) => process.env.NODE_ENV === 'test'
})

/**
 * Strict rate limiter for expensive database operations
 * Why: Protects against DoS on routes that perform multiple database queries
 * Limits: 30 requests per 15 minutes per IP
 * 
 * Use on routes that:
 * - Perform multiple database joins
 * - Aggregate large datasets
 * - Execute complex queries
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests to this resource. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
})

/**
 * Authentication rate limiter - For login/register endpoints
 * Why: Prevents brute force attacks on authentication
 * Limits: 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req) => process.env.NODE_ENV === 'test'
})

/**
 * Write operation rate limiter - For POST/PATCH/DELETE
 * Why: Prevents spam and resource exhaustion from write operations
 * Limits: 20 requests per 15 minutes per IP
 */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 write operations per windowMs
  message: {
    success: false,
    message: 'Too many write operations. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
})

/**
 * Search/Filter rate limiter - For search and filter operations
 * Why: Search operations can be expensive, especially with wildcards
 * Limits: 50 requests per 15 minutes per IP
 */
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 search requests per windowMs
  message: {
    success: false,
    message: 'Too many search requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
})

module.exports = {
  generalLimiter,
  strictLimiter,
  authLimiter,
  writeLimiter,
  searchLimiter
}
