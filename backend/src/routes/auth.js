const express = require('express')
const { refreshToken, logout, getProfile } = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/authMiddleware')
const passport = require('../utils/passport')
const { generateAccessToken, generateRefreshToken, generateJwtId, getRefreshTokenExpiry } = require('../utils/tokenUtils')
const { PrismaClient } = require('../generated/prisma')

const router = express.Router()
const prisma = new PrismaClient()

/**
 * @route GET /auth/google
 * @desc Initiate Google OAuth flow
 * @access Public
 */
router.get('/google', passport.authenticate('google', { session: false }))

/**
 * @route GET /auth/google/callback
 * @desc Google OAuth callback - issues JWT tokens
 * @access Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res, next) => {
    try {
      const user = req.user

      // Generate JWT tokens
      const jwtId = generateJwtId()
      const accessToken = generateAccessToken({
        id: user.id,
        role: user.role
      })
      const refreshToken = generateRefreshToken({
        id: user.id,
        jti: jwtId
      })

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: getRefreshTokenExpiry()
        }
      })

      // Return tokens as JSON
      res.json({
        user,
        accessToken,
        refreshToken
      })
    } catch (error) {
      next(error)
    }
  }
)

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