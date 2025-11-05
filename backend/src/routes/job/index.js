/**
 * @module routes/job/index
 * @description Job Posting feature routes with authentication and role-based access
 */

const express = require('express')
const router = express.Router()
const jobController = require('../../controllers/jobController')
const { createJobSchema, updateJobSchema, applyJobSchema, manageApplicationSchema } = require('../../validators/jobValidator')
const { authMiddleware, verifiedUserMiddleware } = require('../../middlewares/authMiddleware')
const { roleMiddleware } = require('../../middlewares/roleMiddleware')
const { validate } = require('../../middlewares/validate')
const { strictLimiter, writeLimiter } = require('../../middlewares/rateLimitMiddleware')
const reportRouter = require('./report')

// ===================== AUTH REQUIRED FOR ALL JOB ROUTES =====================
router.use(authMiddleware)


// ===================== PUBLIC ACCESS (ALL ROLES) =====================

// GET /api/job/my-applications → Student checks their application statuses
// MUST COME BEFORE /:id route
// Rate limited: Expensive query with multiple joins
// REQUIRES: APPROVED status (verifiedUserMiddleware)
router.get(
  '/my-applications',
  strictLimiter,
  verifiedUserMiddleware,
  roleMiddleware(['STUDENT']),
  jobController.getMyApplications
)

// POST /api/job/list - List jobs with filters (accepts sensitive data in body)
// SECURITY: Changed from GET to POST to prevent sensitive filter data (minSalary, maxSalary)
// from being exposed in URLs, logs, browser history, and referrer headers
// Rate limited: Filtering operations can be expensive with multiple conditions
router.post('/list', strictLimiter, jobController.listJobs)

// GET /api/job/:id
router.get('/:id', jobController.getJobById)

// ===================== HR ACCESS =====================

// POST /api/job → HR creates job
// Rate limited: Write operation
// REQUIRES: APPROVED status (verifiedUserMiddleware)
router.post(
  '/',
  writeLimiter,
  verifiedUserMiddleware,
  roleMiddleware(['EMPLOYER']),
  validate(createJobSchema),
  jobController.createJob
)

// PATCH /api/job/:id → HR updates their own job
// Rate limited: Write operation with complex transaction
// REQUIRES: APPROVED status (verifiedUserMiddleware)
router.patch(
  '/:id',
  writeLimiter,
  verifiedUserMiddleware,
  roleMiddleware(['EMPLOYER']),
  validate(updateJobSchema),
  jobController.updateJob
)

// GET /api/job/:id/applyer → HR views applicants
// Rate limited: Expensive query with multiple joins
// REQUIRES: APPROVED status (verifiedUserMiddleware)
router.get(
  '/:id/applyer',
  strictLimiter,
  verifiedUserMiddleware,
  roleMiddleware(['EMPLOYER']),
  jobController.getApplicants
)

// POST /api/job/:id/applyer → HR accepts/rejects an applicant
// Rate limited: Write operation
// REQUIRES: APPROVED status (verifiedUserMiddleware)
router.post(
  '/:id/applyer',
  writeLimiter,
  verifiedUserMiddleware,
  roleMiddleware(['EMPLOYER']),
  validate(manageApplicationSchema),
  jobController.manageApplication
)

// DELETE /api/job/:id → Delete a job (Admin or HR owner)
// Rate limited: Write operation with cascading deletes
// REQUIRES: APPROVED status (verifiedUserMiddleware)
router.delete(
  '/:id',
  writeLimiter,
  verifiedUserMiddleware,
  roleMiddleware(['ADMIN', 'EMPLOYER']), 
  jobController.deleteJob
)


// ===================== STUDENT ACCESS =====================

// POST /api/job/:id → Student applies for a job
// Rate limited: Write operation with resume creation
// REQUIRES: APPROVED status (verifiedUserMiddleware)
router.post(
  '/:id',
  writeLimiter,
  verifiedUserMiddleware,
  roleMiddleware(['STUDENT']),
  validate(applyJobSchema),
  jobController.applyToJob
)

// ===================== JOB REPORT ROUTES =====================
router.use('/', reportRouter)

module.exports = router
