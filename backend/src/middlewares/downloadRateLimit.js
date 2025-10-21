/**
 * @module middlewares/downloadRateLimit
 * @description Rate limiting for document download endpoints
 */

// Simple in-memory rate limiter (use Redis in production)
const downloadAttempts = new Map()

/**
 * Rate limit configuration
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_DOWNLOADS_PER_WINDOW = 60 // 60 downloads per minute

/**
 * Clean up old entries periodically
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, data] of downloadAttempts.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      downloadAttempts.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW_MS)

// Don't prevent Node.js from exiting in test environment
if (process.env.NODE_ENV === 'test') {
  cleanupInterval.unref()
}

/**
 * Rate limiting middleware for downloads
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function downloadRateLimit(req, res, next) {
  // Use combination of user ID and IP for rate limiting
  const identifier = `${req.user?.id || 'anonymous'}-${req.ip}`
  const now = Date.now()
  
  let userData = downloadAttempts.get(identifier)
  
  if (!userData || now - userData.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    userData = {
      windowStart: now,
      count: 0
    }
    downloadAttempts.set(identifier, userData)
  }
  
  userData.count++
  
  if (userData.count > MAX_DOWNLOADS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      message: 'Too many download requests. Please try again later.',
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - userData.windowStart)) / 1000)
    })
  }
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_DOWNLOADS_PER_WINDOW)
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_DOWNLOADS_PER_WINDOW - userData.count))
  res.setHeader('X-RateLimit-Reset', new Date(userData.windowStart + RATE_LIMIT_WINDOW_MS).toISOString())
  
  next()
}

/**
 * Cleanup function to clear interval (for testing)
 */
function cleanup() {
  clearInterval(cleanupInterval)
  downloadAttempts.clear()
}

module.exports = downloadRateLimit
module.exports.cleanup = cleanup
