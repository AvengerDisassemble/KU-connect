/**
 * Shared test utilities and helper functions
 */

const jwt = require('jsonwebtoken')

/**
 * Test Constants - Shared across all test files
 * These ensure consistency and make it easy to update test data globally
 */

// Degree types
const TEST_DEGREE_TYPES = {
  BACHELOR: 'Bachelor',
  MASTER: 'Master',
  DIPLOMA: 'Diploma'
}

// User roles
const TEST_ROLES = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
  EMPLOYER: 'EMPLOYER',
  PROFESSOR: 'PROFESSOR'
}

// Job statuses
const JOB_STATUSES = {
  PENDING: 'PENDING',
  QUALIFIED: 'QUALIFIED',
  REJECTED: 'REJECTED'
}

// Application statuses
const APPLICATION_STATUSES = {
  PENDING: 'PENDING',
  QUALIFIED: 'QUALIFIED',
  REJECTED: 'REJECTED'
}

// Job types
const JOB_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  INTERNSHIP: 'internship',
  CONTRACT: 'contract'
}

// Work arrangements
const WORK_ARRANGEMENTS = {
  ON_SITE: 'on-site',
  REMOTE: 'remote',
  HYBRID: 'hybrid'
}

// Test user emails (with unique prefixes to avoid conflicts)
const TEST_EMAILS = {
  ADMIN: 'admin@test.com',
  STUDENT: 'student@test.com',
  STUDENT_2: 'student2@test.com',
  STUDENT_3: 'student3@test.com',
  STUDENT_PROFILE: 'student-profile@test.com',
  STUDENT_MYAPP: 'student-myapp@test.com',
  STUDENT2_MYAPP: 'student2-myapp@test.com',
  PROFESSOR: 'professor@test.com',
  HR: 'hr@test.com',
  HR_MYAPP: 'hr-myapp@test.com',
  HR_2: 'hr2@test.com'
}

// Test company info
const TEST_COMPANY_INFO = {
  NAME: 'TestCorp',
  ADDRESS: 'Bangkok',
  INDUSTRY: 'IT_SOFTWARE',
  SIZE: 'ELEVEN_TO_FIFTY'
}

/**
 * Create a JWT token for testing
 * Supports various payload types with flexible options
 *
 * @param {Object} payload - Token payload (should contain id and role at minimum)
 * @param {string} userId - User ID (added to payload as 'id')
 * @param {string} role - User role (STUDENT, ADMIN, EMPLOYER, etc.)
 * @param {Object} options - Optional configuration
 * @param {string} options.secret - Token secret (defaults to ACCESS_TOKEN_SECRET env var or 'testsecret')
 * @param {boolean} options.includeBearer - Whether to prepend 'Bearer ' (default: true)
 * @param {string} options.algorithm - JWT algorithm (default: 'HS256')
 * @param {Object} options.additionalPayload - Extra payload fields to include
 * @returns {string} JWT token with optional Bearer prefix
 *
 * @example
 * // Simple token
 * const token = createTestToken({ id: user.id, role: 'STUDENT' })
 *
 * @example
 * // Token with Bearer prefix
 * const token = createTestToken({ id: user.id, role: 'EMPLOYER', hr: { id: hr.id } })
 *
 * @example
 * // Token without Bearer prefix (for cookie-based auth)
 * const token = createTestToken(
 *   { id: user.id, role: 'ADMIN' },
 *   { includeBearer: false }
 * )
 */
function createTestToken(payload, options = {}) {
  const {
    secret = process.env.ACCESS_TOKEN_SECRET || 'testsecret',
    includeBearer = true,
    algorithm = 'HS256'
  } = options

  const token = jwt.sign(payload, secret, { algorithm })

  return includeBearer ? `Bearer ${token}` : token
}

/**
 * Create multiple test tokens for different user roles at once
 * Useful for test setup where multiple roles are needed
 *
 * @param {Object} users - Object with user data keyed by role
 * @param {Object} options - Optional configuration (same as createTestToken)
 * @returns {Object} Object with tokens keyed by role
 *
 * @example
 * const tokens = createTestTokens({
 *   ADMIN: { id: admin.id },
 *   STUDENT: { id: student.id },
 *   EMPLOYER: { id: hr.id, hr: { id: hr.hr.id } }
 * })
 * // Returns: { ADMIN: 'Bearer ...', STUDENT: 'Bearer ...', EMPLOYER: 'Bearer ...' }
 */
function createTestTokens(users, options = {}) {
  const tokens = {}

  for (const [role, userData] of Object.entries(users)) {
    const payload = {
      ...userData,
      role
    }
    tokens[role] = createTestToken(payload, options)
  }

  return tokens
}

/**
 * Cleanup database with proper foreign key constraint order
 * Call this in beforeAll and afterAll to maintain consistent database state
 *
 * Deletion order:
 * 1. Applications (depend on jobs and students)
 * 2. Job-related records (StudentInterest, JobReport, Requirements, etc.)
 * 3. Jobs (depend on HR)
 * 4. Resumes (depend on students)
 * 5. RefreshTokens (depend on users)
 * 6. Role-specific records (Student, Professor, Admin, HR)
 * 7. Users
 * 8. Tags
 * 9. DegreeTypes
 *
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Object} options - Optional configuration
 * @param {boolean} options.logSuccess - Whether to log success message (default: true)
 * @throws {Error} If cleanup fails
 */
async function cleanupDatabase(prisma, options = {}) {
  const { logSuccess = true } = options

  try {
    // 1. Delete applications first (they depend on jobs and students)
    await prisma.application.deleteMany()

    // 2. Delete job-related records (they depend on jobs)
    await prisma.studentInterest.deleteMany()
    await prisma.jobReport.deleteMany()
    await prisma.requirement.deleteMany()
    await prisma.qualification.deleteMany()
    await prisma.responsibility.deleteMany()
    await prisma.benefit.deleteMany()

    // 3. Delete jobs (they depend on HR)
    await prisma.job.deleteMany()

    // 4. Delete resume records (they depend on students)
    await prisma.resume.deleteMany()

    // 5. Delete refresh tokens (they depend on users)
    await prisma.refreshToken.deleteMany()

    // 6. Delete role-specific records (they depend on users)
    await prisma.student.deleteMany()
    await prisma.professor.deleteMany()
    await prisma.admin.deleteMany()
    await prisma.hR.deleteMany()

    // 7. Delete users
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    })

    // 8. Delete tags
    await prisma.tag.deleteMany()

    // 9. Delete degree types
    await prisma.degreeType.deleteMany()

    if (logSuccess) {
      console.log('Complete database cleanup completed successfully')
    }
  } catch (error) {
    console.log('Database cleanup error:', error.message)
    throw error
  }
}

module.exports = {
  // Constants
  TEST_DEGREE_TYPES,
  TEST_ROLES,
  JOB_STATUSES,
  APPLICATION_STATUSES,
  JOB_TYPES,
  WORK_ARRANGEMENTS,
  TEST_EMAILS,
  TEST_COMPANY_INFO,
  // Functions
  createTestToken,
  createTestTokens,
  cleanupDatabase
}
