const { PrismaClient } = require('../generated/prisma')

const prisma = new PrismaClient()

/**
 * Approve a pending user
 * @param {string} userId - The ID of the user to approve
 * @returns {Promise<Object>} Updated user
 */
async function approveUser (userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, email: true }
  })

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  if (user.status === 'APPROVED') {
    const error = new Error('User is already approved')
    error.statusCode = 400
    throw error
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: 'APPROVED' },
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

  return updatedUser
}

/**
 * Reject a pending user
 * @param {string} userId - The ID of the user to reject
 * @returns {Promise<Object>} Updated user
 */
async function rejectUser (userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: 'REJECTED' },
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

  return updatedUser
}

/**
 * Suspend a user account
 * @param {string} userId - The ID of the user to suspend
 * @returns {Promise<Object>} Updated user
 */
async function suspendUser (userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true }
  })

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  if (user.role === 'ADMIN') {
    const error = new Error('Cannot suspend admin users')
    error.statusCode = 400
    throw error
  }

  if (user.status === 'SUSPENDED') {
    const error = new Error('User is already suspended')
    error.statusCode = 400
    throw error
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: 'SUSPENDED' },
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

  return updatedUser
}

/**
 * Activate (reapprove) a suspended or rejected user
 * @param {string} userId - The ID of the user to activate
 * @returns {Promise<Object>} Updated user
 */
async function activateUser (userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  if (user.status === 'APPROVED') {
    throw new Error('User is already active')
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: 'APPROVED' },
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

  return updatedUser
}

/**
 * List all users with optional filters
 * @param {Object} filters - Filter options
 * @param {string} [filters.status] - Filter by user status
 * @param {string} [filters.role] - Filter by user role
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.limit=20] - Results per page
 * @returns {Promise<Object>} Paginated users list
 */
async function listUsers (filters = {}) {
  const {
    status,
    role,
    page = 1,
    limit = 20
  } = filters

  const where = {}
  if (status) where.status = status
  if (role) where.role = role

  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            degreeType: { select: { name: true } }
          }
        },
        hr: {
          select: {
            companyName: true
          }
        },
        professor: {
          select: {
            department: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ])

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * Get dashboard statistics
 * @returns {Promise<Object>} Dashboard stats
 */
async function getDashboardStats () {
  const [
    totalUsers,
    pendingUsers,
    approvedUsers,
    suspendedUsers,
    rejectedUsers,
    totalJobs,
    totalApplications,
    usersByRole
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { status: 'APPROVED' } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
    prisma.user.count({ where: { status: 'REJECTED' } }),
    prisma.job.count(),
    prisma.application.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    })
  ])

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      status: true,
      createdAt: true
    }
  })

  return {
    totalUsers,
    usersByStatus: {
      pending: pendingUsers,
      approved: approvedUsers,
      suspended: suspendedUsers,
      rejected: rejectedUsers
    },
    usersByRole: usersByRole.reduce((acc, item) => {
      acc[item.role.toLowerCase()] = item._count
      return acc
    }, {}),
    totalJobs,
    totalApplications,
    recentUsers
  }
}

module.exports = {
  approveUser,
  rejectUser,
  suspendUser,
  activateUser,
  listUsers,
  getDashboardStats
}
