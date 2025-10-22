const { PrismaClient } = require('../generated/prisma')
const { hashPassword, comparePassword } = require('../utils/passwordUtils')
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateJwtId, getRefreshTokenExpiry } = require('../utils/tokenUtils')

const prisma = new PrismaClient()

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's first name
 * @param {string} userData.surname - User's last name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} userData.role - User's role (STUDENT, PROFESSOR, EMPLOYER, ADMIN)
 * @param {Object} [roleSpecificData] - Additional data specific to the role
 * @returns {Promise<Object>} The created user (without password)
 */
async function registerUser (userData, roleSpecificData = {}) {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email }
  })

  if (existingUser) {
    throw new Error('Email already registered')
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password)

  // Create user with transaction to ensure consistency
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        verified: userData.role === 'ADMIN' // Admins are pre-verified
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true
      }
    })

    // Create role-specific data
    if (userData.role === 'STUDENT' && roleSpecificData.degreeTypeId && roleSpecificData.address) {
      await tx.student.create({
        data: {
          userId: newUser.id,
          degreeTypeId: roleSpecificData.degreeTypeId,
          address: roleSpecificData.address,
          gpa: roleSpecificData.gpa || null,
          expectedGraduationYear: roleSpecificData.expectedGraduationYear || null
        }
      })
    } else if (userData.role === 'PROFESSOR' && roleSpecificData.department) {
      await tx.professor.create({
        data: {
          userId: newUser.id,
          department: roleSpecificData.department
        }
      })
    } else if (userData.role === 'EMPLOYER' && roleSpecificData.companyName && roleSpecificData.address) {
      await tx.hR.create({
        data: {
          userId: newUser.id,
          companyName: roleSpecificData.companyName,
          address: roleSpecificData.address,
          industry: roleSpecificData.industry || 'OTHER',
          companySize: roleSpecificData.companySize || 'ONE_TO_TEN',
          website: roleSpecificData.website || null
        }
      })
    } else if (userData.role === 'ADMIN') {
      await tx.admin.create({
        data: {
          userId: newUser.id
        }
      })
    }

    return newUser
  })

  return user
}

/**
 * Authenticate user login
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} User data and tokens
 */
async function loginUser (email, password) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      password: true,
      role: true,
      verified: true
    }
  })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password)
  if (!isPasswordValid) {
    throw new Error('Invalid credentials')
  }

  // Generate tokens
  const jwtId = generateJwtId()
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role
  })
  const refreshToken = generateRefreshToken({
    id: user.id,
    jti: jwtId
  })

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry()
    }
  })

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<Object>} New access token and optionally new refresh token
 */
async function refreshAccessToken (refreshToken) {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken)
  if (!decoded) {
    throw new Error('Invalid refresh token')
  }

  // Check if refresh token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true }
  })

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new Error('Refresh token expired or invalid')
  }
  // Generate new access token
  const newAccessToken = generateAccessToken({
    id: storedToken.user.id,
    role: storedToken.user.role
  })

  return {
    accessToken: newAccessToken,
    user: {
      id: storedToken.user.id,
      name: storedToken.user.name,
      surname: storedToken.user.surname,
      email: storedToken.user.email,
      role: storedToken.user.role,
      verified: storedToken.user.verified
    }
  }
}

/**
 * Logout user by removing refresh token
 * @param {string} refreshToken - The refresh token to revoke
 * @returns {Promise<void>}
 */
async function logoutUser (refreshToken) {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken }
  })
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User data without password
 */
async function getUserById (userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      verified: true,
      createdAt: true,
      updatedAt: true,
      student: true, 
      professor: true,
      hr: true,
      admin: true
    }
  })
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById
}