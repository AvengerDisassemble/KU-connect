const { verifyAccessToken } = require('../utils/tokenUtils')
const { getUserById } = require('../services/authService')

/**
 * Middleware to authenticate requests using JWT tokens
 * Verifies the access token and attaches user info to req.user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function authMiddleware (req, res, next) {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies?.accessToken

    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    // Verify token
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token'
      })
    }

    // Get user info and attach to request
    const user = await getUserById(decoded.id)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

/**
 * Optional middleware for routes that can work with or without authentication
 * Attaches user info to req.user if token is valid, but doesn't block if invalid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function optionalAuthMiddleware (req, res, next) {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies?.accessToken

    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (token) {
      const decoded = verifyAccessToken(token)
      if (decoded) {
        const user = await getUserById(decoded.id)
        if (user) {
          req.user = user
        }
      }
    }

    next()
  } catch (error) {
    // Log error but don't block request
    console.error('Optional auth middleware error:', error)
    next()
  }
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
}