/**
 * @file src/routes/announcement/index.js
 * @description Public announcement routes (user-facing)
 */

const express = require('express')
const router = express.Router()

const { optionalAuthMiddleware } = require('../../middlewares/authMiddleware')
const { getAnnouncementsForUserHandler } = require('../../controllers/announcementController')

/**
 * GET /api/announcements
 * Get announcements relevant to current user (filtered by role)
 * Works with or without authentication
 */
router.get('/', optionalAuthMiddleware, getAnnouncementsForUserHandler)

module.exports = router
