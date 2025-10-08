/**
 * @module routes/jobRoutes
 * @description Routes for Job Posting feature
 */

const express = require('express')
const router = express.Router()

// const auth = require('../middlewares/authMiddleware')
// const role = require('../middlewares/roleMiddleware')
const validate = require('../../middlewares/validate')

const jobController = require('../../controllers/jobController')
const {
  createJobSchema,
  updateJobSchema,
  applyJobSchema,
  manageApplicationSchema
} = require('../../validators/job.validator')

// // Public for all authenticated roles
// router.get('/', auth.requireAuth, jobController.listJobs)
// router.get('/search/:query', auth.requireAuth, jobController.searchJobs)
// router.get('/:id', auth.requireAuth, jobController.getJobById)

// // HR only
// router.get('/:id/applyer', auth.requireAuth, role('HR'), jobController.getApplicants)
// router.post('/', auth.requireAuth, role('HR'), validate(createJobSchema), jobController.createJob)
// router.patch('/:id', auth.requireAuth, role('HR'), validate(updateJobSchema), jobController.updateJob)
// router.post('/:id/applyer', auth.requireAuth, role('HR'), validate(manageApplicationSchema), jobController.manageApplication)

// // Student only
// router.post('/:id', auth.requireAuth, role('STUDENT'), validate(applyJobSchema), jobController.applyToJob)

// Public for all authenticated roles
router.get('/', jobController.listJobs)
router.get('/search/:query', jobController.searchJobs)
router.get('/:id', jobController.getJobById)

// HR only
router.get('/:id/applyer', jobController.getApplicants)
router.post('/', validate(createJobSchema), jobController.createJob)
router.patch('/:id', validate(updateJobSchema), jobController.updateJob)
router.post('/:id/applyer', validate(manageApplicationSchema), jobController.manageApplication)

// Student only
router.post('/:id', validate(applyJobSchema), jobController.applyToJob)

module.exports = router
