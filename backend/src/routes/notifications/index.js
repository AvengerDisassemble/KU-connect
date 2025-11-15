/**
 * @file src/routes/notifications/index.js
 * @description Routes for user notification retrieval and management
 */

const express = require('express')
const router = express.Router()

const { authMiddleware } = require('../../middlewares/authMiddleware')
const {
  getUserNotificationsHandler,
  markNotificationReadHandler
} = require('../../controllers/announcementController')

// All notification routes require authentication
router.use(authMiddleware)

/**
 * GET /api/notifications
 * Fetch notifications for the authenticated user
 */
router.get('/', getUserNotificationsHandler)

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', markNotificationReadHandler)

module.exports = router
