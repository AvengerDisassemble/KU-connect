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

  // Determine preferred location (from preference or student address)
  const preferredLocation = student.preference?.desiredLocation || student.address

  // Build where clause for job query
  const where = {
    application_deadline: {
      gt: new Date() // Only active jobs
    }
  }

  // Add location filter if available
  if (preferredLocation) {
    where.location = {
      contains: preferredLocation,
      mode: 'insensitive'
    }
  }

  // Query jobs with filters
  const jobs = await prisma.job.findMany({
    where,
    take: limit,
    orderBy: {
      id: 'desc'
    },
    select: {
      id: true,
      title: true,
      location: true,
      application_deadline: true,
      hr: {
        select: {
          companyName: true
        }
      }
    }
  })

  return jobs
}

module.exports = {
  getRecommendedJobsForStudent
}
