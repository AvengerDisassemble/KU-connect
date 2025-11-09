/**
 * Service for saved jobs feature
 */
const prisma = require('../utils/prisma')

class DomainError extends Error {}

/**
 * List saved jobs for a user with pagination
 * @param {number|string} userId - user id (string for UUIDs)
 * @param {Object} opts
 * @param {number} opts.page
 * @param {number} opts.pageSize
 */
async function listSavedJobs (userId, { page = 1, pageSize = 20 } = {}) {
  // Why: Provide paginated list to avoid returning huge result sets
  const skip = (page - 1) * pageSize
  const [items, total] = await Promise.all([
    prisma.savedJob.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.savedJob.count({ where: { userId } })
  ])

  return {
    items: items.map(i => ({ job: i.job, createdAt: i.createdAt })),
    page,
    pageSize,
    total
  }
}

/**
 * Add a saved job
 * Throws Error with message codes: ALREADY_SAVED, NOT_FOUND
 */
async function addSavedJob (userId, jobId) {
  try {
    const saved = await prisma.savedJob.create({
      data: {
        userId,
        jobId
      }
    })
    return saved
  } catch (err) {
    // Map Prisma unique constraint -> already saved
    if (err.code === 'P2002') {
      const e = new DomainError('ALREADY_SAVED')
      e.code = 'ALREADY_SAVED'
      throw e
    }
    if (err.code === 'P2025') {
      const e = new DomainError('NOT_FOUND')
      e.code = 'NOT_FOUND'
      throw e
    }
    throw err
  }
}

/**
 * Remove a saved job
 * Throws NOT_FOUND if there is no saved record
 */
async function removeSavedJob (userId, jobId) {
  try {
    await prisma.savedJob.delete({
      where: { userId_jobId: { userId, jobId } }
    })
  } catch (err) {
    if (err.code === 'P2025') {
      const e = new DomainError('NOT_FOUND')
      e.code = 'NOT_FOUND'
      throw e
    }
    throw err
  }
}

module.exports = {
  listSavedJobs,
  addSavedJob,
  removeSavedJob,
  DomainError
}
