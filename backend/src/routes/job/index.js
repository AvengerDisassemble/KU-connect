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
const { strictLimiter, writeLimiter, searchLimiter } = require('../../middlewares/rateLimitMiddleware')

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
// Rate limited: Filter operations can be expensive with multiple tags
router.get('/filter', searchLimiter, jobController.filterJobs)

// GET /api/job/my-applications → Student checks their application statuses
// MUST COME BEFORE /search/:query and /:id routes
// Rate limited: Expensive query with multiple joins
router.get(
  '/my-applications',
  strictLimiter,
  roleMiddleware(['STUDENT']),
  jobController.getMyApplications
)

// POST /api/job/list - List jobs with filters (accepts sensitive data in body)
// SECURITY: Changed from GET to POST to prevent sensitive filter data (minSalary, maxSalary)
// from being exposed in URLs, logs, browser history, and referrer headers
// Rate limited: Filtering operations can be expensive with multiple conditions
router.post('/list', strictLimiter, jobController.listJobs)

// GET /api/job/search/:query
// Rate limited: Search operations can be expensive
router.get('/search/:query', searchLimiter, jobController.searchJobs)

// GET /api/job/:id
router.get('/:id', jobController.getJobById)

// ===================== HR ACCESS =====================

// POST /api/job → HR creates job
// Rate limited: Write operation
router.post(
  '/',
  writeLimiter,
  roleMiddleware(['EMPLOYER']),
  validate(createJobSchema),
  jobController.createJob
)

// PATCH /api/job/:id → HR updates their own job
// Rate limited: Write operation with complex transaction
router.patch(
  '/:id',
  writeLimiter,
  roleMiddleware(['EMPLOYER']),
  validate(updateJobSchema),
  jobController.updateJob
)

// GET /api/job/:id/applyer → HR views applicants
// Rate limited: Expensive query with multiple joins
router.get(
  '/:id/applyer',
  strictLimiter,
  roleMiddleware(['EMPLOYER']),
  jobController.getApplicants
)

// POST /api/job/:id/applyer → HR accepts/rejects an applicant
// Rate limited: Write operation
router.post(
  '/:id/applyer',
  writeLimiter,
  roleMiddleware(['EMPLOYER']),
  validate(manageApplicationSchema),
  jobController.manageApplication
)

// DELETE /api/job/:id → Delete a job (Admin or HR owner)
// Rate limited: Write operation with cascading deletes
router.delete(
  '/:id',
  writeLimiter,
  roleMiddleware(['ADMIN', 'EMPLOYER']), 
  jobController.deleteJob
)


// ===================== STUDENT ACCESS =====================

// POST /api/job/:id → Student applies for a job
// Rate limited: Write operation with resume creation
router.post(
  '/:id',
  writeLimiter,
  roleMiddleware(['STUDENT']),
  validate(applyJobSchema),
  jobController.applyToJob
)

module.exports = router
