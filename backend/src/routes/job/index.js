/**
 * @module routes/job/index
 * @description Job Posting feature routes with authentication and role-based access
 */

const express = require('express')
const router = express.Router()
const jobController = require('../../controllers/jobController')
const jobReportController = require('../../controllers/jobReportController')
const { createJobSchema, updateJobSchema, applyJobSchema, manageApplicationSchema } = require('../../validators/jobValidator')
const { authMiddleware } = require('../../middlewares/authMiddleware')
const { roleMiddleware } = require('../../middlewares/roleMiddleware')
const { validate } = require('../../middlewares/validate')

// ===================== AUTH REQUIRED FOR ALL JOB ROUTES =====================
router.use(authMiddleware)

// ===================== JOB REPORT ROUTES (MUST COME BEFORE GENERIC :id ROUTES) =====================

// GET /api/job/reports → List all reports (Admin only)
router.get(
  '/reports',
  roleMiddleware(['ADMIN']),
  jobReportController.listReports
)

// DELETE /api/job/reports/:reportId → Delete a report (Admin only)
router.delete(
  '/reports/:reportId',
  roleMiddleware(['ADMIN']),
  jobReportController.deleteReport
)

// POST /api/job/:id/report → Create a report for a job (any authenticated user)
router.post(
  '/:id/report',
  jobReportController.createReport
)

// ===================== PUBLIC ACCESS (ALL ROLES) =====================

// GET /api/job/filter - Filter jobs by tags, title, company
router.get('/filter', jobController.filterJobs)

// GET /api/job/my-applications → Student checks their application statuses
// MUST COME BEFORE /search/:query and /:id routes
router.get(
  '/my-applications',
  roleMiddleware(['STUDENT']),
  jobController.getMyApplications
)

// GET /api/jobs?page=1&limit=5
router.get('/', jobController.listJobs)

// GET /api/job/search/:query
router.get('/search/:query', jobController.searchJobs)

// GET /api/job/:id
router.get('/:id', jobController.getJobById)

// ===================== HR ACCESS =====================

// POST /api/job → HR creates job
router.post(
  '/',
  roleMiddleware(['EMPLOYER']),
  validate(createJobSchema),
  jobController.createJob
)

// PATCH /api/job/:id → HR updates their own job
router.patch(
  '/:id',
  roleMiddleware(['EMPLOYER']),
  validate(updateJobSchema),
  jobController.updateJob
)

// GET /api/job/:id/applyer → HR views applicants
router.get(
  '/:id/applyer',
  roleMiddleware(['EMPLOYER']),
  jobController.getApplicants
)

// POST /api/job/:id/applyer → HR accepts/rejects an applicant
router.post(
  '/:id/applyer',
  roleMiddleware(['EMPLOYER']),
  validate(manageApplicationSchema),
  jobController.manageApplication
)

// DELETE /api/job/:id → Delete a job (Admin or HR owner)
router.delete(
  '/:id', 
  roleMiddleware(['ADMIN', 'EMPLOYER']), 
  jobController.deleteJob
)


// ===================== STUDENT ACCESS =====================

// POST /api/job/:id → Student applies for a job
router.post(
  '/:id',
  roleMiddleware(['STUDENT']),
  validate(applyJobSchema),
  jobController.applyToJob
)

module.exports = router
