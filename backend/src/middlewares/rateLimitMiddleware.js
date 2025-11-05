/**
 * @module middlewares/rateLimitMiddleware
 * @description Rate limiting middleware to prevent DoS attacks on expensive database operations
 * 
 * Security: HTTP request handlers should not perform expensive operations without rate limiting
 * Otherwise, the application becomes vulnerable to denial-of-service attacks
 */

// Use express-rate-limit with IPv6-safe key generator helper
const erl = require('express-rate-limit')
const rateLimit = erl
// In newer versions, ipKeyGenerator is exported; fall back to req.ip if unavailable
const ipKeyGenerator = erl.ipKeyGenerator || ((req) => req.ip)

/**
 * General API rate limiter - Applied to all routes
 * Why: Prevents basic DoS attacks across the entire API
 * Limits: 500 requests per 15 minutes per IP (scaled for 70+ concurrent users)
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs (100 → 500 for 70+ users)
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
 * Limits: 150 requests per 15 minutes per IP (scaled for 70+ concurrent users)
 * 
 * Use on routes that:
 * - Perform multiple database joins
 * - Aggregate large datasets
 * - Execute complex queries
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs (30 → 150 for 70+ users)
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
 * Limits: 20 attempts per 15 minutes per IP (scaled for 70+ concurrent users)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login attempts per windowMs (5 → 20 for 70+ users)
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
 * Limits: 100 requests per 15 minutes per IP (scaled for 70+ concurrent users)
 */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 write operations per windowMs (20 → 100 for 70+ users)
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
 * Limits: 250 requests per 15 minutes per IP (scaled for 70+ concurrent users)
 */
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // Limit each IP to 250 search requests per windowMs (50 → 250 for 70+ users)
  message: {
    success: false,
    message: 'Too many search requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
})

/**
 * Admin read operations rate limiter
 * Why: Admin dashboard and user listing can be expensive with large datasets
 * Limits: 300 requests per 15 minutes per user (scaled for 70+ concurrent users)
 */
const adminReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 read requests per 15 minutes (60 → 300 for 70+ users)
  message: {
    success: false,
    message: 'Too many admin read requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID instead of IP for authenticated admin requests
  keyGenerator: (req, res) => (req.user ? `admin_read_${req.user.id}` : ipKeyGenerator(req, res)),
  skip: (req) => process.env.NODE_ENV === 'test'
})

/**
 * Admin write operations rate limiter - For user status changes, announcements
 * Why: Prevent accidental or malicious mass operations on users
 * Limits: 150 write operations per 15 minutes per admin user (scaled for 70+ concurrent users)
 */
const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // 150 write operations per 15 minutes (30 → 150 for 70+ users)
  message: {
    success: false,
    message: 'Too many admin write operations. Please slow down and try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => (req.user ? `admin_write_${req.user.id}` : ipKeyGenerator(req, res)),
  skip: (req) => process.env.NODE_ENV === 'test'
})

/**
 * Admin critical operations rate limiter - For user approval/rejection/suspension
 * Why: These operations have significant impact and should be done thoughtfully
 * Limits: 100 critical operations per hour per admin user (scaled for 70+ concurrent users)
 */
const adminCriticalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 critical operations per hour (20 → 100 for 70+ users)
  message: {
    success: false,
    message: 'Too many critical admin operations. Please wait before performing more user status changes.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => (req.user ? `admin_critical_${req.user.id}` : ipKeyGenerator(req, res)),
  skip: (req) => process.env.NODE_ENV === 'test'
})

/**
 * Admin announcement creation rate limiter
 * Why: Prevent spam announcements and notification flooding
 * Limits: 50 announcements per hour per admin (scaled for 70+ concurrent users)
 */
const adminAnnouncementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 announcements per hour (10 → 50 for 70+ users)
  message: {
    success: false,
    message: 'Too many announcements created. Please wait before creating more.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => (req.user ? `admin_announcement_${req.user.id}` : ipKeyGenerator(req, res)),
  skip: (req) => process.env.NODE_ENV === 'test'
})

/**
 * Dashboard rate limiter - For dashboard data retrieval
 * Why: Dashboard queries aggregate multiple data sources but users access frequently
 * Limits: 1000 requests per 15 minutes per IP (scaled for 70+ concurrent users)
 */
const dashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 dashboard requests per windowMs (200 → 1000 for 70+ users)
  message: {
    success: false,
    message: 'Too many dashboard requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
})

/**
 * Preferences rate limiter - For student preference updates
 * Why: Prevent spam and abuse of preference modifications, but allow reasonable updates
 * Limits: 500 requests per 15 minutes per IP (scaled for 70+ concurrent users)
 */
const preferencesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 preference updates per windowMs (100 → 500 for 70+ users)
  message: {
    success: false,
    message: 'Too many preference update requests. Please try again later.',
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
  searchLimiter,
  adminReadLimiter,
  adminWriteLimiter,
  adminCriticalLimiter,
  adminAnnouncementLimiter,
  dashboardLimiter,
  preferencesLimiter
}
