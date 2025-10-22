const express = require('express')
const { refreshToken, logout, getProfile } = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authLimiter } = require('../middlewares/rateLimitMiddleware')

const router = express.Router()


/**
 * @route POST /auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 * Rate limited to 5 requests per 15 minutes to prevent token abuse
 */
router.post('/refresh', authLimiter, refreshToken)

/**
 * @route POST /auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Public
 * Rate limited to 5 requests per 15 minutes to prevent abuse
 */
router.post('/logout', authLimiter, logout)

/**
 * @route GET /auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authMiddleware, getProfile)

module.exports = router