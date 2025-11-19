/**
 * @module routes/notifications
 * @description Unified notification routes for all notification types
 */

const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notificationController')
const { authMiddleware, verifiedUserMiddleware } = require('../middlewares/authMiddleware')
const { generalLimiter, writeLimiter } = require('../middlewares/rateLimitMiddleware')

/**
 * GET /api/notifications
 * Get current user's notifications with optional filtering
 * Query params: type, unreadOnly, page, limit
 * @access Authenticated users
 */
router.get(
  '/',
  authMiddleware,
  verifiedUserMiddleware,
  generalLimiter,
  notificationController.getUserNotifications
)

/**
 * GET /api/notifications/unread/count
 * Get unread notification count for current user
 * Query params: type (optional)
 * @access Authenticated users
 */
router.get(
  '/unread/count',
  authMiddleware,
  verifiedUserMiddleware,
  generalLimiter,
  notificationController.getUnreadCount
)

/**
 * GET /api/notifications/stats
 * Get notification statistics for current user
 * @access Authenticated users
 */
router.get(
  '/stats',
  authMiddleware,
  verifiedUserMiddleware,
  generalLimiter,
  notificationController.getNotificationStats
)

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for current user
 * Query params: type (optional - mark only specific type as read)
 * @access Authenticated users
 */
router.patch(
  '/read-all',
  authMiddleware,
  verifiedUserMiddleware,
  writeLimiter,
  notificationController.markAllAsRead
)

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 * @access Authenticated users (must be notification recipient)
 */
router.patch(
  '/:id/read',
  authMiddleware,
  verifiedUserMiddleware,
  writeLimiter,
  notificationController.markAsRead
)

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 * @access Authenticated users (must be notification recipient)
 */
router.delete(
  '/:id',
  authMiddleware,
  verifiedUserMiddleware,
  writeLimiter,
  notificationController.deleteNotification
)

module.exports = router
