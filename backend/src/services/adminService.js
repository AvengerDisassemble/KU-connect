const { PrismaClient } = require('../generated/prisma')
const { hashPassword, generateSecurePassword } = require('../utils/passwordUtils')
const { sendProfessorWelcomeEmail } = require('../utils/emailUtils')

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

/**
 * Create a professor user by admin
 * Professor is auto-approved and can login immediately
 * 
 * @param {Object} data - Professor creation data
 * @param {string} data.name - First name (required)
 * @param {string} data.surname - Last name (required)
 * @param {string} data.email - Email address (required, unique)
 * @param {string} data.department - Department (required)
 * @param {string} [data.password] - Custom password (optional, will auto-generate if not provided)
 * @param {string} [data.phoneNumber] - Phone number (optional)
 * @param {string} [data.officeLocation] - Office location (optional)
 * @param {string} [data.title] - Academic title (optional)
 * @param {boolean} [data.sendWelcomeEmail=true] - Send welcome email (optional, default: true)
 * @param {string} data.createdBy - Admin user ID who created this account
 * @returns {Promise<Object>} Created user with credentials
 * @throws {Error} If email already exists
 * 
 * @example
 * const result = await createProfessorUser({
 *   name: 'John',
 *   surname: 'Smith',
 *   email: 'john.smith@ku.ac.th',
 *   department: 'Computer Science',
 *   title: 'Assistant Professor',
 *   createdBy: 'admin-id'
 * })
 */
async function createProfessorUser (data) {
  const {
    name,
    surname,
    email,
    department,
    password: customPassword,
    phoneNumber,
    officeLocation,
    title,
    sendWelcomeEmail = true
  } = data

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    const error = new Error('Email already registered')
    error.statusCode = 409
    throw error
  }

  // Generate password if not provided
  const isPasswordGenerated = !customPassword
  const plainPassword = customPassword || generateSecurePassword()
  
  // Hash password
  const hashedPassword = await hashPassword(plainPassword)

  // Create user and professor in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user with APPROVED status and verified=true
    const user = await tx.user.create({
      data: {
        name,
        surname,
        email,
        password: hashedPassword,
        role: 'PROFESSOR',
        status: 'APPROVED',
        verified: true
      }
    })

    // Create professor profile
    const professor = await tx.professor.create({
      data: {
        userId: user.id,
        department,
        phoneNumber: phoneNumber || null,
        officeLocation: officeLocation || null,
        title: title || null
      }
    })

    return { user, professor }
  })

  // Prepare response data
  const responseData = {
    user: {
      id: result.user.id,
      name: result.user.name,
      surname: result.user.surname,
      email: result.user.email,
      role: result.user.role,
      status: result.user.status,
      verified: result.user.verified,
      createdAt: result.user.createdAt
    },
    professor: {
      id: result.professor.id,
      userId: result.professor.userId,
      department: result.professor.department,
      phoneNumber: result.professor.phoneNumber,
      officeLocation: result.professor.officeLocation,
      title: result.professor.title,
      createdAt: result.professor.createdAt,
      updatedAt: result.professor.updatedAt
    }
  }

  // Add temporary password to response only if it was auto-generated
  if (isPasswordGenerated) {
    responseData.credentials = {
      temporaryPassword: plainPassword
    }
  }

  // Send welcome email (non-blocking)
  let emailSent = false
  if (sendWelcomeEmail) {
    try {
      emailSent = await sendProfessorWelcomeEmail({
        name,
        surname,
        email,
        department,
        temporaryPassword: isPasswordGenerated ? plainPassword : undefined
      })
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to send welcome email:', error.message)
    }
  }

  responseData.emailSent = emailSent

  return responseData
}

module.exports = {
  approveUser,
  rejectUser,
  suspendUser,
  activateUser,
  listUsers,
  getDashboardStats,
  createProfessorUser
}
