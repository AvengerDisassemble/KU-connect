/**
 * @module routes/job/index
 * @description Job Posting feature routes with authentication and role-based access
 */

const express = require('express')
const router = express.Router()
const jobController = require('../../controllers/jobController')
const { createJobSchema, updateJobSchema, applyJobSchema, manageApplicationSchema } = require('../../validators/job.validator')
const { authMiddleware } = require('../../middlewares/authMiddleware')
const { roleMiddleware } = require('../../middlewares/roleMiddleware')
const validate = require('../../middlewares/validate')

// ===================== AUTH REQUIRED FOR ALL JOB ROUTES =====================
router.use(authMiddleware)

// ===================== PUBLIC ACCESS (ALL ROLES) =====================

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

// ===================== STUDENT ACCESS =====================

// POST /api/job/:id → Student applies for a job
router.post(
  '/:id',
  roleMiddleware(['STUDENT']),
  validate(applyJobSchema),
  jobController.applyToJob
)

module.exports = router
