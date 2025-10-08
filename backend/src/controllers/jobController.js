/**
 * @module controllers/jobController
 * @description Express handlers for Job Posting feature
 */

const {
  listJobs,
  getJobById,
  searchJobs,
  createJob,
  updateJob,
  applyToJob,
  manageApplication,
  getApplicants
} = require('../services/jobService')

/**
 * Lists jobs with pagination
 */
async function listJobsController (req, res, next) {
  try {
    const data = await listJobs(req.query)
    return res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

/**
 * Searches jobs by keyword query param
 */
async function searchJobsController (req, res, next) {
  try {
    const data = await searchJobs(req.params.query)
    return res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

/**
 * Gets job detail by id
 */
async function getJobByIdController (req, res, next) {
  try {
    const data = await getJobById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Job not found' })
    return res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

/**
 * Creates a new job (HR only)
 */
async function createJobController (req, res, next) {
  try {
    const hrId = req.user.hrId || req.user.id
    const data = await createJob(hrId, req.body)
    return res.status(201).json({ data })
  } catch (err) {
    if (err.code === 'P2002') {
      const fields = err.meta && err.meta.target ? err.meta.target : []
      const fieldList = fields.length > 0 ? fields.join(', ') : 'A unique field'
      return res.status(409).json({ error: `${fieldList} already exists` })
    }
    next(err)
  }
}

/**
 * Updates a job (HR owner only)
 */
async function updateJobController (req, res, next) {
  try {
    const hrId = req.user.hrId || req.user.id
    const data = await updateJob(req.params.id, hrId, req.body)
    if (!data) return res.status(404).json({ error: 'Job not found' })
    return res.status(200).json({ data })
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: err.message })
    if (err.code === 'P2002') {
      const fields = err.meta && err.meta.target ? err.meta.target : []
      const fieldList = fields.length > 0 ? fields.join(', ') : 'A unique field'
      return res.status(409).json({ error: `${fieldList} already exists` })
    }
    next(err)
  }
}

/**
 * Student applies to a job
 */
async function applyToJobController (req, res, next) {
  try {
    const studentId = req.user.studentId || req.user.id
    const data = await applyToJob(req.params.id, studentId, req.body.resumeLink)
    return res.status(201).json({ data })
  } catch (err) {
    const status = err.status || 500
    const error = err.message || 'Internal Server Error'
    return res.status(status).json({ error })
  }
}

/**
 * HR fetches applicants for a job they own
 */
async function getApplicantsController (req, res, next) {
  try {
    const hrId = req.user.hrId || req.user.id
    const data = await getApplicants(req.params.id, hrId)
    if (data === null) return res.status(404).json({ error: 'Job not found' })
    return res.status(200).json({ data })
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({ error: err.message || 'Internal Server Error' })
  }
}

/**
 * HR manages a specific application (QUALIFIED/REJECTED)
 */
async function manageApplicationController (req, res, next) {
  try {
    const hrId = req.user.hrId || req.user.id
    const { applicationId } = req.body
    if (!applicationId) return res.status(400).json({ error: 'applicationId is required' })
    const data = await manageApplication(req.params.id, hrId, applicationId, req.body.status)
    if (!data) return res.status(404).json({ error: 'Job or application not found' })
    return res.status(200).json({ data })
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({ error: err.message || 'Internal Server Error' })
  }
}

module.exports = {
  listJobs: listJobsController,
  searchJobs: searchJobsController,
  getJobById: getJobByIdController,
  createJob: createJobController,
  updateJob: updateJobController,
  applyToJob: applyToJobController,
  getApplicants: getApplicantsController,
  manageApplication: manageApplicationController
}
