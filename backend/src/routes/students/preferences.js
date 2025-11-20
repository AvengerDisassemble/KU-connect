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
const { validateStudentPreferenceUpdate } = require('../../validators/studentPreferenceValidator')

// All routes require authentication
router.use(auth.authMiddleware)

// Apply strict rate limiter to all preference routes
router.use(preferencesLimiter)

// GET /api/students/preferences
router.get('/', role.roleMiddleware(['STUDENT']), controller.getPreferences)

// PATCH /api/students/preferences
router.patch('/', role.roleMiddleware(['STUDENT']), validateStudentPreferenceUpdate, controller.upsertPreferences)

module.exports = router
