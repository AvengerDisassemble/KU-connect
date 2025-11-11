/**
 * @fileoverview NFR Test Setup Helpers
 * @description Provides authentication and database setup utilities for NFR tests
 * @module tests/nfr-helpers/setup
 */

const prisma = require('../../src/models/prisma')
const { generateAccessToken } = require('../../src/utils/tokenUtils')
const { hashPassword } = require('../../src/utils/passwordUtils')

/**
 * NFR Test Users - Pre-configured test users for NFR testing
 * These users are created once at the start of NFR tests
 */
const NFR_TEST_USERS = {
  STUDENT: {
    name: 'NFR',
    surname: 'Student',
    email: 'nfr-student@test.com',
    password: 'NFRTest123!',
    role: 'STUDENT',
    status: 'APPROVED'
  },
  EMPLOYER: {
    name: 'NFR',
    surname: 'Employer',
    email: 'nfr-employer@test.com',
    password: 'NFRTest123!',
    role: 'EMPLOYER',
    status: 'APPROVED'
  },
  ADMIN: {
    name: 'NFR',
    surname: 'Admin',
    email: 'nfr-admin@test.com',
    password: 'NFRTest123!',
    role: 'ADMIN',
    status: 'APPROVED'
  },
  PROFESSOR: {
    name: 'NFR',
    surname: 'Professor',
    email: 'nfr-professor@test.com',
    password: 'NFRTest123!',
    role: 'PROFESSOR',
    status: 'APPROVED'
  }
}

/**
 * Create test users in database for NFR testing
 * Creates users with all required relationships (Student, HR, Admin, Professor)
 * 
 * @returns {Promise<Object>} Object containing created users with their IDs and tokens
 * @throws {Error} If user creation fails
 * 
 * @example
 * const { student, employer, admin, tokens } = await createNFRTestUsers()
 * // Use tokens.student in your tests
 * await request(app)
 *   .get('/api/job/list')
 *   .set('Authorization', tokens.student)
 */
async function createNFRTestUsers() {
  const users = {}
  const tokens = {}

  try {
    // Ensure we have a degree type
    const degreeType = await prisma.degreeType.upsert({
      where: { name: 'Computer Science' },
      update: {},
      create: { name: 'Computer Science' }
    })

    // Create Student
    const hashedPassword = await hashPassword(NFR_TEST_USERS.STUDENT.password)
    const studentUser = await prisma.user.create({
      data: {
        name: NFR_TEST_USERS.STUDENT.name,
        surname: NFR_TEST_USERS.STUDENT.surname,
        email: NFR_TEST_USERS.STUDENT.email,
        password: hashedPassword,
        role: 'STUDENT',
        status: 'APPROVED',
        verified: true,
        student: {
          create: {
            degreeTypeId: degreeType.id,
            address: 'NFR Test Address',
            gpa: 3.5,
            expectedGraduationYear: 2026
          }
        }
      },
      include: {
        student: true
      }
    })
    users.student = studentUser
    tokens.student = generateAccessToken({ id: studentUser.id, role: 'STUDENT' })

    // Create Employer (HR)
    const employerUser = await prisma.user.create({
      data: {
        name: NFR_TEST_USERS.EMPLOYER.name,
        surname: NFR_TEST_USERS.EMPLOYER.surname,
        email: NFR_TEST_USERS.EMPLOYER.email,
        password: hashedPassword,
        role: 'EMPLOYER',
        status: 'APPROVED',
        verified: true,
        hr: {
          create: {
            companyName: 'NFR Test Corp',
            address: 'Bangkok, Thailand',
            industry: 'IT_SOFTWARE',
            companySize: 'ELEVEN_TO_FIFTY',
            phoneNumber: '+66-999-9999'
          }
        }
      },
      include: {
        hr: true
      }
    })
    users.employer = employerUser
    tokens.employer = generateAccessToken({ 
      id: employerUser.id, 
      role: 'EMPLOYER',
      hr: { id: employerUser.hr.id }
    })

    // Create Admin
    const adminUser = await prisma.user.create({
      data: {
        name: NFR_TEST_USERS.ADMIN.name,
        surname: NFR_TEST_USERS.ADMIN.surname,
        email: NFR_TEST_USERS.ADMIN.email,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'APPROVED',
        verified: true,
        admin: {
          create: {}
        }
      },
      include: {
        admin: true
      }
    })
    users.admin = adminUser
    tokens.admin = generateAccessToken({ id: adminUser.id, role: 'ADMIN' })

    // Create Professor
    const professorUser = await prisma.user.create({
      data: {
        name: NFR_TEST_USERS.PROFESSOR.name,
        surname: NFR_TEST_USERS.PROFESSOR.surname,
        email: NFR_TEST_USERS.PROFESSOR.email,
        password: hashedPassword,
        role: 'PROFESSOR',
        status: 'APPROVED',
        verified: true,
        professor: {
          create: {
            department: 'Computer Engineering',
            phoneNumber: '+66-888-8888'
          }
        }
      },
      include: {
        professor: true
      }
    })
    users.professor = professorUser
    tokens.professor = generateAccessToken({ id: professorUser.id, role: 'PROFESSOR' })

    // Create some test jobs for the employer
    const testJob = await prisma.job.create({
      data: {
        title: 'NFR Test Job',
        description: 'This is a test job for NFR testing',
        location: 'Bangkok',
        jobType: 'full-time',
        workArrangement: 'hybrid',
        duration: '1-year',
        minSalary: 40000,
        maxSalary: 60000,
        application_deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        phone_number: '+66-999-9999',
        hrId: employerUser.hr.id,
        companyName: 'NFR Test Corp'
      }
    })

    return {
      users,
      tokens: {
        student: `Bearer ${tokens.student}`,
        employer: `Bearer ${tokens.employer}`,
        admin: `Bearer ${tokens.admin}`,
        professor: `Bearer ${tokens.professor}`
      },
      rawTokens: tokens, // Tokens without Bearer prefix (for cookies)
      testJob,
      degreeType
    }
  } catch (error) {
    console.error('Failed to create NFR test users:', error)
    throw error
  }
}

/**
 * Clean up NFR test users and related data
 * Removes all NFR-prefixed test data from database
 * 
 * @returns {Promise<void>}
 */
async function cleanupNFRTestUsers() {
  try {
    // Delete in proper order to respect foreign key constraints
    await prisma.application.deleteMany({
      where: {
        student: {
          user: {
            email: {
              contains: 'nfr-'
            }
          }
        }
      }
    })

    await prisma.job.deleteMany({
      where: {
        companyName: 'NFR Test Corp'
      }
    })

    await prisma.student.deleteMany({
      where: {
        user: {
          email: {
            contains: 'nfr-'
          }
        }
      }
    })

    await prisma.hR.deleteMany({
      where: {
        user: {
          email: {
            contains: 'nfr-'
          }
        }
      }
    })

    await prisma.admin.deleteMany({
      where: {
        user: {
          email: {
            contains: 'nfr-'
          }
        }
      }
    })

    await prisma.professor.deleteMany({
      where: {
        user: {
          email: {
            contains: 'nfr-'
          }
        }
      }
    })

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'nfr-'
        }
      }
    })
  } catch (error) {
    console.error('Cleanup NFR test users error:', error)
    // Don't throw - cleanup should be best-effort
  }
}

/**
 * Generate a valid access token for testing
 * Uses the actual tokenUtils to ensure consistency with production
 * 
 * @param {Object} payload - Token payload
 * @param {string} payload.id - User ID
 * @param {string} payload.role - User role
 * @param {Object} payload.hr - (Optional) HR data for EMPLOYER role
 * @param {boolean} includeBearer - Whether to prepend 'Bearer ' (default: true)
 * @returns {string} JWT token
 * 
 * @example
 * const token = generateTestToken({ id: 'user-123', role: 'STUDENT' })
 * // Returns: "Bearer eyJhbGc..."
 */
function generateTestToken(payload, includeBearer = true) {
  const token = generateAccessToken(payload)
  return includeBearer ? `Bearer ${token}` : token
}

/**
 * Create a temporary test user for specific test scenarios
 * Useful when you need a user that doesn't exist in the standard NFR users
 * 
 * @param {Object} userData - User data
 * @param {string} userData.role - User role (STUDENT, EMPLOYER, ADMIN, PROFESSOR)
 * @param {string} userData.email - User email (should be unique)
 * @param {string} userData.status - User status (default: APPROVED)
 * @returns {Promise<Object>} Created user with token
 * 
 * @example
 * const tempUser = await createTempTestUser({
 *   role: 'STUDENT',
 *   email: 'temp-test@test.com',
 *   status: 'PENDING'
 * })
 */
async function createTempTestUser(userData) {
  const hashedPassword = await hashPassword('TempTest123!')
  
  const baseData = {
    name: 'Temp',
    surname: 'User',
    email: userData.email,
    password: hashedPassword,
    role: userData.role,
    status: userData.status || 'APPROVED',
    verified: true
  }

  let user

  switch (userData.role) {
    case 'STUDENT': {
      const degreeType = await prisma.degreeType.findFirst()
      user = await prisma.user.create({
        data: {
          ...baseData,
          student: {
            create: {
              degreeTypeId: degreeType.id,
              address: 'Temp Address'
            }
          }
        },
        include: { student: true }
      })
      break
    }
    case 'EMPLOYER':
      user = await prisma.user.create({
        data: {
          ...baseData,
          hr: {
            create: {
              companyName: 'Temp Company',
              address: 'Bangkok',
              industry: 'IT_SOFTWARE',
              companySize: 'ELEVEN_TO_FIFTY',
              phoneNumber: '+66-000-0000'
            }
          }
        },
        include: { hr: true }
      })
      break
    case 'ADMIN':
      user = await prisma.user.create({
        data: {
          ...baseData,
          admin: { create: {} }
        },
        include: { admin: true }
      })
      break
    case 'PROFESSOR':
      user = await prisma.user.create({
        data: {
          ...baseData,
          professor: {
            create: {
              department: 'Temp Department',
              phoneNumber: '+66-000-0001'
            }
          }
        },
        include: { professor: true }
      })
      break
    default:
      throw new Error(`Unsupported role: ${userData.role}`)
  }

  const payload = { id: user.id, role: user.role }
  if (user.hr) {
    payload.hr = { id: user.hr.id }
  }

  return {
    user,
    token: `Bearer ${generateAccessToken(payload)}`,
    rawToken: generateAccessToken(payload)
  }
}

module.exports = {
  NFR_TEST_USERS,
  createNFRTestUsers,
  cleanupNFRTestUsers,
  generateTestToken,
  createTempTestUser
}
