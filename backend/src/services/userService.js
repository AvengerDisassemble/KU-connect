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

  // Get current user to validate status transition
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, email: true, role: true, name: true, surname: true }
  })

  if (!currentUser) {
    throw new Error('User not found')
  }

  // Check if user is already in the target status
  if (currentUser.status === status) {
    const statusMessages = {
      PENDING: 'User is already pending approval',
      APPROVED: 'User is already approved',
      REJECTED: 'User is already rejected',
      SUSPENDED: 'User is already suspended'
    }
    throw new Error(statusMessages[status])
  }

  // Business rule: Cannot reject already-approved users
  // Once approved, users can only be suspended, not rejected
  if (currentUser.status === 'APPROVED' && status === 'REJECTED') {
    throw new Error('Cannot reject an already-approved user. Use suspend instead.')
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
 * @param {string} adminId - Admin performing the action (optional, for self-suspension check)
 * @returns {Promise<Object>} Suspended user
 */
async function suspendUser (userId, adminId = null) {
  // Safety check: Prevent admins from suspending themselves
  if (adminId && userId === adminId) {
    throw new Error('Cannot suspend your own account. Please ask another admin.')
  }
  
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
  // Calculate date ranges for trending data
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)
  
  const startOfMonth = new Date(now)
  startOfMonth.setDate(now.getDate() - 30)

  // Run all queries in parallel for better performance
  const [
    // User counts
    totalUsers,
    usersByStatus,
    usersByRole,
    usersThisWeek,
    usersThisMonth,
    
    // Job counts
    totalJobs,
    activeJobs,
    jobsThisWeek,
    
    // Application counts
    totalApplications,
    applicationsByStatus,
    applicationsThisWeek,
    
    // Announcement counts
    totalAnnouncements,
    activeAnnouncements,
    
    // Report counts
    totalReports,
    
    // Trending jobs with application counts
    trendingJobs
  ] = await Promise.all([
    // User queries
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    }),
    prisma.user.count({
      where: { createdAt: { gte: startOfWeek } }
    }),
    prisma.user.count({
      where: { createdAt: { gte: startOfMonth } }
    }),
    
    // Job queries
    prisma.job.count(),
    prisma.job.count({
      where: { application_deadline: { gte: now } } // Jobs with future deadlines = active
    }),
    prisma.job.count({
      where: { createdAt: { gte: startOfWeek } }
    }),
    
    // Application queries
    prisma.application.count(),
    prisma.application.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.application.count({
      where: { createdAt: { gte: startOfWeek } }
    }),
    
    // Announcement queries
    prisma.announcement.count(),
    prisma.announcement.count({
      where: { isActive: true }
    }),
    
    // Report queries - all reports are unresolved (no resolvedAt field in schema)
    prisma.jobReport.count(),
    
    // Trending jobs - get applications from this week grouped by job
    prisma.application.groupBy({
      by: ['jobId'],
      where: { createdAt: { gte: startOfWeek } },
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    })
  ])

  // Fetch job details for trending jobs
  const trendingJobIds = trendingJobs.map(item => item.jobId)
  const trendingJobDetails = trendingJobIds.length > 0 
    ? await prisma.job.findMany({
        where: { id: { in: trendingJobIds } },
        select: { id: true, title: true }
      })
    : []
  
  // Map job details with application counts
  const trendingJobsMap = new Map(trendingJobDetails.map(job => [job.id, job]))
  const trending = trendingJobs
    .map(item => {
      const job = trendingJobsMap.get(item.jobId)
      return job ? {
        id: job.id,
        title: job.title,
        applicationsThisWeek: item._count.id
      } : null
    })
    .filter(Boolean)
  
  // Process user status counts
  const userStatusCounts = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    SUSPENDED: 0
  }
  usersByStatus.forEach(({ status, _count }) => {
    userStatusCounts[status] = _count.id
  })

  // Process user role counts
  const userRoleCounts = {
    STUDENT: 0,
    EMPLOYER: 0,
    ADMIN: 0,
    STAFF: 0
  }
  usersByRole.forEach(({ role, _count }) => {
    userRoleCounts[role] = _count.id
  })

  // Process application status counts
  const applicationStatusCounts = {
    PENDING: 0,
    QUALIFIED: 0,
    REJECTED: 0
  }
  applicationsByStatus.forEach(({ status, _count }) => {
    applicationStatusCounts[status] = _count.id
  })

  // Calculate percentages
  const calculatePercentage = (part, total) => {
    return total > 0 ? Math.round((part / total) * 100) : 0
  }

  return {
    // User Statistics
    users: {
      total: totalUsers,
      byStatus: {
        pending: userStatusCounts.PENDING,
        approved: userStatusCounts.APPROVED,
        rejected: userStatusCounts.REJECTED,
        suspended: userStatusCounts.SUSPENDED
      },
      byRole: {
        student: userRoleCounts.STUDENT,
        employer: userRoleCounts.EMPLOYER,
        admin: userRoleCounts.ADMIN,
        staff: userRoleCounts.STAFF
      },
      growth: {
        thisWeek: usersThisWeek,
        thisMonth: usersThisMonth
      },
      // Performance metrics with percentages
      metrics: {
        approvalRate: calculatePercentage(
          userStatusCounts.APPROVED,
          totalUsers
        ),
        pendingRate: calculatePercentage(
          userStatusCounts.PENDING,
          totalUsers
        ),
        rejectionRate: calculatePercentage(
          userStatusCounts.REJECTED,
          totalUsers
        )
      }
    },

    // Job Statistics
    jobs: {
      total: totalJobs,
      active: activeJobs,
      inactive: totalJobs - activeJobs,
      growth: {
        thisWeek: jobsThisWeek
      },
      metrics: {
        activeRate: calculatePercentage(activeJobs, totalJobs)
      }
    },

    // Application Statistics
    applications: {
      total: totalApplications,
      byStatus: {
        pending: applicationStatusCounts.PENDING,
        qualified: applicationStatusCounts.QUALIFIED,
        rejected: applicationStatusCounts.REJECTED
      },
      growth: {
        thisWeek: applicationsThisWeek
      },
      metrics: {
        qualificationRate: calculatePercentage(
          applicationStatusCounts.QUALIFIED,
          totalApplications
        ),
        rejectionRate: calculatePercentage(
          applicationStatusCounts.REJECTED,
          totalApplications
        ),
        averagePerJob: totalJobs > 0 
          ? Math.round((totalApplications / totalJobs) * 10) / 10 
          : 0
      }
    },

    // Announcement Statistics
    announcements: {
      total: totalAnnouncements,
      active: activeAnnouncements,
      inactive: totalAnnouncements - activeAnnouncements
    },

    // Report Statistics
    // Report Statistics (all reports are unresolved - no resolution tracking in schema)
    reports: {
      total: totalReports,
      unresolved: totalReports, // All reports are considered unresolved
      resolved: 0
    },

    // Trending Jobs
    trending: {
      jobs: trending
    },

    // Alerts/Action Items
    alerts: {
      pendingApprovals: userStatusCounts.PENDING,
      unresolvedReports: totalReports, // All reports need attention
      inactiveJobs: totalJobs - activeJobs
    }
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

/**
 * Search users with comprehensive filters and pagination
 * @param {Object} filters - Search filters
 * @returns {Promise<Object>} Users with pagination metadata
 */
async function searchUsers (filters = {}) {
  const {
    role,
    status,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 20
  } = filters

  const where = {}

  // Filter by role
  if (role) {
    where.role = role
  }

  // Filter by status
  if (status) {
    where.status = status
  }

  // Search by email
  if (search) {
    where.email = {
      contains: search,
      mode: 'insensitive'
    }
  }

  // Filter by date range
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

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
        verified: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.user.count({ where })
  ])

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

module.exports = {
  listPendingUsers,
  updateUserStatus,
  suspendUser,
  activateUser,
  getDashboardStats,
  getAllUsers,
  searchUsers
}
