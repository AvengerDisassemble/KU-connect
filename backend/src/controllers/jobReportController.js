/**
 * @module controllers/jobReportController
 * @description Express handlers for job report system
 */

const jobReportService = require('../services/jobReportService')

/**
 * Creates a job report (non-owner only)
 * @route POST /api/job/:id/report
 */
async function createReport(req, res) {
  try {
    const userId = req.user.id
    const jobId = Number(req.params.id)
    const { reason } = req.body

    // Basic input validation
    if (!jobId || isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      })
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason must be at least 10 characters long'
      })
    }

    // Prevent HR from reporting their own job
    if (req.user.role === 'EMPLOYER' && req.user.hr && req.user.hr.id) {
      const isOwner = await jobReportService.isJobOwnedByHr(jobId, req.user.hr.id)
      if (isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You cannot report your own job'
        })
      }
    }

    // Create report
    const report = await jobReportService.createReport(userId, jobId, reason)
    res.status(201).json({
      success: true,
      message: 'Job report submitted successfully',
      data: report
    })
  } catch (err) {
    console.error('❌ Create report error:', err)

    // Handle known custom errors from service
    if (err.code === 'DUPLICATE_REPORT') {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this job'
      })
    }

    if (err.code === 'JOB_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      })
    }

    // Generic fallback
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
}

/**
 * Lists all job reports (Admin only)
 * @route GET /api/job/reports
 */
async function listReports(req, res) {
  try {
    const reports = await jobReportService.listReports()
    if (!reports || reports.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No job reports found',
        data: []
      })
    }

    res.status(200).json({
      success: true,
      message: 'All job reports retrieved successfully',
      data: reports
    })
  } catch (err) {
    console.error('❌ List reports error:', err)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job reports',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
}

/**
 * Deletes a job report (Admin only)
 * @route DELETE /api/job/reports/:reportId
 */
async function deleteReport(req, res) {
  try {
    const reportId = Number(req.params.reportId)

    if (!reportId || isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      })
    }

    const deleted = await jobReportService.deleteReport(reportId)
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Job report deleted successfully',
      data: deleted
    })
  } catch (err) {
    console.error('❌ Delete report error:', err)
    res.status(500).json({
      success: false,
      message: 'Failed to delete job report',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
}

module.exports = {
  createReport,
  listReports,
  deleteReport
}
