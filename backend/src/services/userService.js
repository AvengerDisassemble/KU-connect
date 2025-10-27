/**
 * @file src/services/userService.js
 * @description User management service for admin operations
 */

const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient()

/**
 * Get all pending users
 * @returns {Promise<Array>} List of users with PENDING status
 */
async function listPendingUsers () {
  const users = await prisma.user.findMany({
    where: {
      status: 'PENDING'
    },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      student: {
        select: {
          degreeType: { select: { name: true } },
          address: true
        }
      },
      hr: {
        select: {
          companyName: true,
          industry: true
        }
      },
      professor: {
        select: {
          department: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  return users
}

/**
 * Update user status
 * @param {string} userId - User ID
 * @param {string} status - New status (APPROVED, REJECTED, SUSPENDED)
 * @returns {Promise<Object>} Updated user
 */
async function updateUserStatus (userId, status) {
  // Validate status
  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true
    }
  })

  return user
}

/**
 * Suspend a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Suspended user
 */
async function suspendUser (userId) {
  return await updateUserStatus(userId, 'SUSPENDED')
}

/**
 * Activate/Approve a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Activated user
 */
async function activateUser (userId) {
  return await updateUserStatus(userId, 'APPROVED')
}

/**
 * Get aggregate statistics for dashboard
 * @returns {Promise<Object>} Dashboard statistics
 */
async function getDashboardStats () {
  // Run all queries in parallel for better performance
  const [
    totalUsers,
    pendingUsers,
    approvedUsers,
    suspendedUsers,
    activeJobs,
    reports
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { status: 'APPROVED' } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
    prisma.job.count(),
    prisma.jobReport.count()
  ])

  return {
    totalUsers,
    pendingUsers,
    approvedUsers,
    suspendedUsers,
    activeJobs,
    reports
  }
}

/**
 * Get all users with optional filtering
 * @param {Object} filters - Optional filters (role, status)
 * @returns {Promise<Array>} List of users
 */
async function getAllUsers (filters = {}) {
  const where = {}

  if (filters.role) {
    where.role = filters.role
  }

  if (filters.status) {
    where.status = filters.status
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      status: true,
      verified: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return users
}

module.exports = {
  listPendingUsers,
  updateUserStatus,
  suspendUser,
  activateUser,
  getDashboardStats,
  getAllUsers
}
