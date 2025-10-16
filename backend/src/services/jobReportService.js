/**
 * @module services/jobReportService
 * @description Service layer for job report management
 */

const prisma = require('../models/prisma')

/**
 * Checks if a job belongs to the given HR
 * @param {string} jobId - Job ID
 * @param {string} hrId - HR ID
 * @returns {Promise<boolean>} True if job is owned by HR, else false
 */
async function isJobOwnedByHr(jobId, hrId) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { hrId: true }
  })
  return job && job.hrId === hrId
}

/**
 * Creates a job report if not already reported by user
 * @param {string} userId - Reporter user ID
 * @param {string} jobId - Job ID
 * @param {string} reason - Report reason
 * @returns {Promise<Object>} Created report
 * @throws {Error} If job not found, duplicate report, or user is job owner
 */
async function createReport(userId, jobId, reason) {
  // Check if job exists and get job details
  const job = await prisma.job.findUnique({ 
    where: { id: jobId },
    include: {
      hr: {
        select: {
          userId: true
        }
      }
    }
  })
  
  if (!job) {
    const err = new Error('Job not found')
    err.code = 'JOB_NOT_FOUND'
    throw err
  }

  // Prevent user from reporting their own job (additional safety check)
  if (job.hr && job.hr.userId === userId) {
    const err = new Error('Cannot report your own job')
    err.code = 'OWNER_REPORT'
    throw err
  }

  // Check for duplicate report
  const existing = await prisma.jobReport.findFirst({
    where: { jobId, userId }
  })
  if (existing) {
    const err = new Error('Duplicate report')
    err.code = 'DUPLICATE_REPORT'
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
 * @param {string} reportId - Report ID
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
