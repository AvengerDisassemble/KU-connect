/**
 * @module routes/notifications/index
 * @description User notification routes (main listing and read operations)
 */

const express = require('express')
const router = express.Router()
const notificationController = require('../../controllers/notificationController')
const { authMiddleware, verifiedUserMiddleware } = require('../../middlewares/authMiddleware')
const { strictLimiter } = require('../../middlewares/rateLimitMiddleware')

// All notification routes require authentication
router.use(authMiddleware)

/**
 * GET /api/notifications
 * Get current user's notifications with pagination
 * @access Authenticated and verified users
 */
router.get(
  '/',
  strictLimiter,
  verifiedUserMiddleware,
  notificationController.getUserNotifications
)

/**
 * GET /api/notifications/unread/count
 * Get unread notification count for current user
 * MUST COME BEFORE /:id routes
 * @access Authenticated and verified users
 */
router.get(
  '/unread/count',
  verifiedUserMiddleware,
  notificationController.getUnreadCount
)

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 * @access Authenticated and verified users (recipient only)
 */
router.patch(
  '/:id/read',
  verifiedUserMiddleware,
  notificationController.markAsRead
)

module.exports = router
