/**
 * @module routes/job/report
 * @description Job report routes for KU Connect
 */

const express = require('express')
const router = express.Router()
const jobReportController = require('../../controllers/jobReportController')
const { validate } = require('../../middlewares/validate')
const auth = require('../../middlewares/authMiddleware')
const role = require('../../middlewares/roleMiddleware')
const { createReportSchema } = require('../../validators/reportValidator')
const { strictLimiter, writeLimiter } = require('../../middlewares/rateLimitMiddleware')

// POST /api/job/:id/report - Authenticated, non-owner
// Rate limited: Write operation to prevent spam reports
router.post('/:id/report', writeLimiter, auth.authMiddleware, validate(createReportSchema), jobReportController.createReport)

// GET /api/job/reports - Admin only
// Rate limited: Expensive query with joins
router.get('/reports', strictLimiter, auth.authMiddleware, role.roleMiddleware(['ADMIN']), jobReportController.listReports)

// DELETE /api/job/reports/:reportId - Admin only
// Rate limited: Write operation
router.delete('/reports/:reportId', writeLimiter, auth.authMiddleware, role.roleMiddleware(['ADMIN']), jobReportController.deleteReport)

module.exports = router
