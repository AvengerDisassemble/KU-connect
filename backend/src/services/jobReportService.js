/**
 * @module services/jobReportService
 * @description Service layer for job report management
 */

const prisma = require('../models/prisma')

/**
 * Checks if a job belongs to the given HR
 * @param {number} jobId - Job ID
 * @param {number} hrId - HR ID
 * @returns {Promise<boolean>} True if job is owned by HR, else false
 */
async function isJobOwnedByHr(jobId, hrId) {
  const job = await prisma.job.findUnique({
    where: { id: Number(jobId) },
    select: { hrId: true }
  })
  return job && job.hrId === hrId
}

/**
 * Creates a job report if not already reported by user
 * @param {string} userId - Reporter user ID
 * @param {number} jobId - Job ID
 * @param {string} reason - Report reason
 * @returns {Promise<Object>} Created report
 */
async function createReport(userId, jobId, reason) {
  const existing = await prisma.jobReport.findFirst({
    where: { jobId, userId }
  })
  if (existing) {
    const err = new Error('Duplicate report')
    err.code = 'DUPLICATE_REPORT'
    throw err
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) {
    const err = new Error('Job not found')
    err.code = 'JOB_NOT_FOUND'
    throw err
  }

  return prisma.jobReport.create({
    data: { userId, jobId, reason }
  })
}


/**
 * Lists all job reports with job and reporter info (Admin only)
 * @returns {Promise<Array>} Array of reports
 */
async function listReports() {
  return prisma.jobReport.findMany({
    include: {
      job: { include: { hr: true } },
      user: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Deletes a job report by ID (Admin only)
 * @param {number} reportId - Report ID
 * @returns {Promise<Object>} Deleted report
 */
async function deleteReport(reportId) {
  return prisma.jobReport.delete({
    where: { id: reportId },
    include: {
      job: { include: { hr: true } },
      user: true
    }
  })
}

module.exports = {
  isJobOwnedByHr,
  createReport,
  listReports,
  deleteReport
}
