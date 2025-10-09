/**
 * @module controllers/jobController
 * @description Controller for Job Posting feature (with authentication + role-based access)
 */

const prisma = require('../models/prisma')
const jobService = require('../services/jobService')

/**
 * List jobs with pagination (public)
 */
async function listJobs(req, res) {
  try {
    const filters = req.query
    const result = await jobService.listJobs(filters)
    res.status(200).json({
      success: true,
      message: 'Jobs retrieved successfully',
      data: result
    })
  } catch (error) {
    console.error('List jobs error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to list jobs'
    })
  }
}

/**
 * Search jobs by keyword (public)
 */
async function searchJobs(req, res) {
  try {
    const query = req.params.query
    const result = await jobService.searchJobs(query)
    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: result
    })
  } catch (error) {
    console.error('Search jobs error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to search jobs'
    })
  }
}

/**
 * Get job by ID (public)
 */
async function getJobById(req, res) {
  try {
    const jobId = req.params.id
    const job = await jobService.getJobById(jobId)
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Job retrieved successfully',
      data: job
    })
  } catch (error) {
    console.error('Get job by ID error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get job'
    })
  }
}

/**
 * Create job posting (HR only)
 */
async function createJob(req, res) {
  try {
    const userId = req.user.id

    // Find the HR profile linked to this user
    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true, companyName: true }
    })

    if (!hr) {
      return res.status(403).json({
        success: false,
        message: 'You must have an HR profile to post a job'
      })
    }

    const job = await jobService.createJob(hr.id, req.body)

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    })
  } catch (error) {
    console.error('Create job error:', error)
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create job'
    })
  }
}

/**
 * Update job posting (HR only, must own job)
 */
async function updateJob(req, res) {
  try {
    const userId = req.user.id
    const jobId = req.params.id

    // Resolve HR ID from userId
    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true }
    })
    if (!hr) {
      return res.status(403).json({
        success: false,
        message: 'Only HR users can update jobs'
      })
    }

    const updated = await jobService.updateJob(jobId, hr.id, req.body)
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or unauthorized'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: updated
    })
  } catch (error) {
    console.error('Update job error:', error)
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update job'
    })
  }
}

/**
 * Student applies to a job
 */
async function applyToJob(req, res) {
  try {
    const userId = req.user.id

    // Find student profile linked to this user
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!student) {
      return res.status(403).json({
        success: false,
        message: 'Only students can apply to jobs'
      })
    }

    const jobId = req.params.id
    const { resumeLink } = req.body

    const application = await jobService.applyToJob(jobId, student.id, resumeLink)

    res.status(201).json({
      success: true,
      message: 'Job application submitted successfully',
      data: application
    })
  } catch (error) {
    console.error('Apply to job error:', error)
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to apply for job'
    })
  }
}

/**
 * HR gets applicants for their job
 */
async function getApplicants(req, res) {
  try {
    const userId = req.user.id
    const jobId = req.params.id

    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true }
    })
    if (!hr) {
      return res.status(403).json({
        success: false,
        message: 'Only HR users can view applicants'
      })
    }

    const applicants = await jobService.getApplicants(jobId, hr.id)
    if (!applicants) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or unauthorized'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Applicants retrieved successfully',
      data: applicants
    })
  } catch (error) {
    console.error('Get applicants error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve applicants'
    })
  }
}

/**
 * HR manages application status (QUALIFIED / REJECTED)
 */
async function manageApplication(req, res) {
  try {
    const userId = req.user.id
    const jobId = req.params.id
    const { applicationId, status } = req.body

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      })
    }

    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true }
    })
    if (!hr) {
      return res.status(403).json({
        success: false,
        message: 'Only HR users can manage applications'
      })
    }

    const result = await jobService.manageApplication(jobId, hr.id, applicationId, status)
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized'
      })
    }

    res.status(200).json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      data: result
    })
  } catch (error) {
    console.error('Manage application error:', error)
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update application status'
    })
  }
}

module.exports = {
  listJobs,
  searchJobs,
  getJobById,
  createJob,
  updateJob,
  applyToJob,
  getApplicants,
  manageApplication
}
