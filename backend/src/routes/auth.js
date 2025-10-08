const express = require('express')
const { refreshToken, logout, getProfile } = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/authMiddleware')

const router = express.Router()

/**
 * @route POST /auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', refreshToken)

/**
 * @route POST /auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Public
 */
router.post('/logout', logout)

/**
 * @route GET /auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authMiddleware, getProfile)

module.exports = router