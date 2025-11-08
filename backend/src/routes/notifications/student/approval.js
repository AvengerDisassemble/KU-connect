/**
 * @module routes/notifications/student/approval
 * @description Internal trigger endpoint for student application status notifications
 */

const express = require('express')
const router = express.Router()
const notificationController = require('../../../controllers/notificationController')
const { studentApprovalSchema } = require('../../../validators/notificationValidator')
const { authMiddleware } = require('../../../middlewares/authMiddleware')
const { roleMiddleware } = require('../../../middlewares/roleMiddleware')
const { validate } = require('../../../middlewares/validate')
const { writeLimiter } = require('../../../middlewares/rateLimitMiddleware')

/**
 * POST /api/notifications/student/approval
 * Internal trigger to notify student of application status update
 * @access Admin only (for system-level triggers)
 */
router.post(
  '/',
  authMiddleware,
  writeLimiter,
  roleMiddleware(['ADMIN']),
  validate(studentApprovalSchema),
  notificationController.notifyStudentOfApproval
)

module.exports = router
