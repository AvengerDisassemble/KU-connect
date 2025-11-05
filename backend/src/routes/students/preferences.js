/**
 * Student preferences routes
 * @module routes/students/preferences
 */

const express = require('express')
const router = express.Router()
const controller = require('../../controllers/studentPreferencesController')
const auth = require('../../middlewares/authMiddleware')
const role = require('../../middlewares/roleMiddleware')
const { preferencesLimiter } = require('../../middlewares/rateLimitMiddleware')

// All routes require authentication
router.use(auth.authMiddleware)

// GET /api/students/preferences
router.get('/', role.roleMiddleware(['STUDENT']), controller.getPreferences)

// PUT /api/students/preferences
router.put('/', preferencesLimiter, role.roleMiddleware(['STUDENT']), controller.upsertPreferences)

module.exports = router
