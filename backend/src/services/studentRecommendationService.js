/**
 * @module services/studentRecommendationService
 * @description Business logic for Student Job Recommendations
 */

const prisma = require('../models/prisma')

/**
 * Get recommended jobs for a student based on preferences
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of recommendations (default: 10)
 * @returns {Promise<Array>} Array of recommended jobs
 */
async function getRecommendedJobsForStudent(userId, limit = 10) {
  // Find student with preference
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      preference: true
    }
  })

  if (!student) {
    const error = new Error('Student profile not found')
    error.status = 404
    throw error
  }

  // Get preference data
  const preference = student.preference
  const preferredLocation = preference?.desiredLocation || student.address
  const minSalary = preference?.minSalary
  const preferredIndustry = preference?.industry
  const preferredJobType = preference?.jobType
  const remoteWork = preference?.remoteWork

  // Build where clause for job query
  const where = {
    application_deadline: {
      gt: new Date() // Only active jobs
    }
  }

  // Add location filter if available
  if (preferredLocation) {
    where.location = {
      contains: preferredLocation
    }
  }

  // Add minimum salary filter if specified
  if (minSalary !== null && minSalary !== undefined) {
    where.minSalary = {
      gte: minSalary
    }
  }

  // Add industry filter if specified (filter by HR company industry)
  if (preferredIndustry) {
    where.hr = {
      industry: preferredIndustry
    }
  }

  // Add job type filter if specified
  if (preferredJobType) {
    where.jobType = preferredJobType
  }

  // Query all matching jobs first
  let jobs = await prisma.job.findMany({
    where,
    orderBy: {
      id: 'desc'
    },
    select: {
      id: true,
      title: true,
      location: true,
      jobType: true,
      workArrangement: true,
      minSalary: true,
      maxSalary: true,
      application_deadline: true,
      hr: {
        select: {
          companyName: true,
          industry: true
        }
      }
    }
  })

  // Filter by remote work preference if specified (case-insensitive match)
  if (remoteWork) {
    const remoteWorkLower = remoteWork.toLowerCase()
    jobs = jobs.filter(job => {
      const workArrangement = job.workArrangement?.toLowerCase()
      return workArrangement === remoteWorkLower
    })
  }

  // Return limited results
  return jobs.slice(0, limit).map(job => ({
    id: job.id,
    title: job.title,
    location: job.location,
    jobType: job.jobType,
    workArrangement: job.workArrangement,
    minSalary: job.minSalary,
    maxSalary: job.maxSalary,
    application_deadline: job.application_deadline,
    companyName: job.hr.companyName,
    industry: job.hr.industry
  }))
}

module.exports = {
  getRecommendedJobsForStudent
}
