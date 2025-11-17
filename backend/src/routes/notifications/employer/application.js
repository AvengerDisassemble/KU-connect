/**
 * @module routes/notifications/employer/application
 * @description Internal trigger endpoint for employer application notifications
 */

const express = require('express')
const router = express.Router()
const notificationController = require('../../../controllers/notificationController')
const { employerApplicationSchema } = require('../../../validators/notificationValidator')
const { authMiddleware } = require('../../../middlewares/authMiddleware')
const { roleMiddleware } = require('../../../middlewares/roleMiddleware')
const { validate } = require('../../../middlewares/validate')
const { writeLimiter } = require('../../../middlewares/rateLimitMiddleware')

/**
 * POST /api/notifications/employer/application
 * Internal trigger to notify employer of new application
 * @access Admin only (for system-level triggers)
 */
router.post(
  '/',
  authMiddleware,
  writeLimiter,
  roleMiddleware(['ADMIN']),
  validate(employerApplicationSchema),
  notificationController.notifyEmployerOfApplication
)

module.exports = router
