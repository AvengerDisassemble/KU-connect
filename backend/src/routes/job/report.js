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

// POST /api/job/:id/report - Authenticated, non-owner
router.post('/:id/report', auth.authMiddleware, validate(createReportSchema), jobReportController.createReport)

// GET /api/job/reports - Admin only
router.get('/reports', auth.authMiddleware, role.roleMiddleware(['ADMIN']), jobReportController.listReports)

// DELETE /api/job/reports/:reportId - Admin only
router.delete('/reports/:reportId', auth.authMiddleware, role.roleMiddleware(['ADMIN']), jobReportController.deleteReport)

module.exports = router
