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
        status: userData.role === 'ADMIN' ? 'APPROVED' : 'PENDING', // Admins auto-approved, others pending
        verified: userData.role === 'ADMIN' // Admins are pre-verified
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        status: true,
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
      status: true,
      verified: true
    }
  })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  // Block SUSPENDED users from logging in
  if (user.status === 'SUSPENDED') {
    throw new Error('Account suspended. Please contact administrator.')
  }

  // Check if user has a password (local auth)
  if (!user.password) {
    throw new Error('This account uses OAuth authentication. Please sign in with Google.')
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
      status: true,
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

/**
 * Find or create a user from Google OAuth profile
 * Implements the Identity/Account Segregation Pattern
 * @param {Object} googleProfile - Google profile data
 * @param {string} googleProfile.providerAccountId - Google account ID
 * @param {string} googleProfile.email - User's email
 * @param {string} googleProfile.name - User's first name
 * @param {string} googleProfile.surname - User's last name
 * @param {string} [googleProfile.accessToken] - Google access token
 * @param {string} [googleProfile.refreshToken] - Google refresh token
 * @returns {Promise<Object>} The user object
 */
async function findOrCreateGoogleUser (googleProfile) {
  const { providerAccountId, email, name, surname, accessToken, refreshToken, profile } = googleProfile

  // Try to find existing account by provider and providerAccountId
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          role: true,
          verified: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  })

  if (existingAccount) {
    // User already exists with this Google account
    return existingAccount.user
  }

  // Check if a user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    // User exists but hasn't linked Google account yet
    // Create a new Account linked to the existing User
    await prisma.account.create({
      data: {
        userId: existingUser.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        scope: 'profile email'
      }
    })

    return {
      id: existingUser.id,
      name: existingUser.name,
      surname: existingUser.surname,
      email: existingUser.email,
      role: existingUser.role,
      verified: existingUser.verified,
      createdAt: existingUser.createdAt,
      updatedAt: existingUser.updatedAt
    }
  }

  // Create new user, account, and student record in a transaction
  const newUser = await prisma.$transaction(async (tx) => {
    // Ensure at least one degree type exists, or create a default one
    let degreeType = await tx.degreeType.findFirst()
    if (!degreeType) {
      degreeType = await tx.degreeType.create({
        data: {
          name: 'Bachelor of Science'
        }
      })
    }

    // Create new user (no password for OAuth users)
    const user = await tx.user.create({
      data: {
        name,
        surname,
        email,
        password: null, // OAuth users don't have passwords
        role: 'STUDENT', // Default role
        verified: true // OAuth users are pre-verified
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Create associated Account
    await tx.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        scope: 'profile email'
      }
    })

    // Create associated Student record with placeholder data
    await tx.student.create({
      data: {
        userId: user.id,
        degreeTypeId: degreeType.id, // Use existing or newly created degree type
        address: 'To be updated', // Placeholder address
        gpa: null,
        expectedGraduationYear: null
      }
    })

    return user
  })

  return newUser
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById,
  findOrCreateGoogleUser
}