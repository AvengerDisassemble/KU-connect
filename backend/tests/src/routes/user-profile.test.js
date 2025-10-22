// DEPRECATED: This test suite is deprecated and will be skipped.
// Keep for reference only.

const request = require('supertest')
const app = require('../../../src/app')
const { PrismaClient } = require('../../../src/generated/prisma')
const jwt = require('jsonwebtoken')
const { cleanupDatabase } = require('../utils/testHelpers')

// const prisma = new PrismaClient()

describe.skip('User Profile Authorization Example (DEPRECATED)', () => {
  let studentUser, professorUser, employerUser, adminUser
  let studentToken, professorToken, employerToken, adminToken
  let degreeTypeId

  beforeAll(async () => {
    await cleanupDatabase(prisma)
    
//     // Create a degree type for testing
//     const degreeType = await prisma.degreeType.create({
//       data: { name: 'Test Computer Science Profile' }
//     })
//     degreeTypeId = degreeType.id

//     // Create test users for each role
//     const testPassword = 'TestPass123'
//     const timestamp = Date.now()
    
//     // Create Student
//     const studentData = await request(app)
//       .post('/api/register/alumni')
//       .send({
//         name: 'Test',
//         surname: 'Student',
//         email: `student.profile.test.${timestamp}@test.edu`,
//         password: testPassword,
//         degreeTypeId: degreeTypeId,
//         address: 'Test Address 123'
//       })
    
//     if (studentData.body.success) {
//       studentUser = studentData.body.data.user
//     } else {
//       throw new Error(`Failed to create student: ${studentData.body.message}`)
//     }

//     // Create Professor
//     const professorData = await request(app)
//       .post('/api/register/staff')
//       .send({
//         name: 'Test',
//         surname: 'Professor',
//         email: `professor.profile.test.${timestamp}@test.edu`,
//         password: testPassword,
//         department: 'Computer Science'
//       })
    
//     if (professorData.body.success) {
//       professorUser = professorData.body.data.user
//     } else {
//       throw new Error(`Failed to create professor: ${professorData.body.message}`)
//     }

//     // Create Employer
//     const employerData = await request(app)
//       .post('/api/register/enterprise')
//       .send({
//         name: 'Test',
//         surname: 'Employer',
//         email: `employer.profile.test.${timestamp}@test.edu`,
//         password: testPassword,
//         companyName: 'Test Company',
//         address: 'Test Company Address'
//       })
    
//     if (employerData.body.success) {
//       employerUser = employerData.body.data.user
//     } else {
//       throw new Error(`Failed to create employer: ${employerData.body.message}`)
//     }

//     // Create Admin
//     const adminData = await request(app)
//       .post('/api/register/admin')
//       .send({
//         name: 'Test',
//         surname: 'Admin',
//         email: `admin.profile.test.${timestamp}@test.edu`,
//         password: testPassword
//       })
    
//     if (adminData.body.success) {
//       adminUser = adminData.body.data.user
//     } else {
//       throw new Error(`Failed to create admin: ${adminData.body.message}`)
//     }

//     // Wait a moment to ensure all database transactions are committed
//     await new Promise(resolve => setTimeout(resolve, 100))

//     // Login each user to get real authentication tokens
//     const studentLogin = await request(app)
//       .post('/api/login')
//       .send({
//         email: studentUser.email,
//         password: testPassword
//       })
    
//     if (!studentLogin.body.success) {
//       throw new Error(`Student login failed: ${studentLogin.body.message}`)
//     }
    
//     const professorLogin = await request(app)
//       .post('/api/login')
//       .send({
//         email: professorUser.email,
//         password: testPassword
//       })
    
//     if (!professorLogin.body.success) {
//       throw new Error(`Professor login failed: ${professorLogin.body.message}`)
//     }
    
//     const employerLogin = await request(app)
//       .post('/api/login')
//       .send({
//         email: employerUser.email,
//         password: testPassword
//       })
    
//     if (!employerLogin.body.success) {
//       throw new Error(`Employer login failed: ${employerLogin.body.message}`)
//     }
    
//     const adminLogin = await request(app)
//       .post('/api/login')
//       .send({
//         email: adminUser.email,
//         password: testPassword
//       })
    
//     if (!adminLogin.body.success) {
//       throw new Error(`Admin login failed: ${adminLogin.body.message}`)
//     }

//     // Extract tokens from cookies
//     studentToken = extractTokenFromCookies(studentLogin.headers['set-cookie'])
//     professorToken = extractTokenFromCookies(professorLogin.headers['set-cookie'])
//     employerToken = extractTokenFromCookies(employerLogin.headers['set-cookie'])
//     adminToken = extractTokenFromCookies(adminLogin.headers['set-cookie'])
    
//     if (!studentToken || !professorToken || !employerToken || !adminToken) {
//       throw new Error('Failed to extract authentication tokens from login responses')
//     }
//   })

//   // Helper function to extract access token from cookies
//   function extractTokenFromCookies(cookies) {
//     if (!cookies) return null
//     const accessTokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='))
//     if (accessTokenCookie) {
//       return accessTokenCookie.split(';')[0].replace('accessToken=', '')
//     }
//     return null
//   }

  afterAll(async () => {
    // Clean up test data using shared cleanup function
    await cleanupDatabase(prisma)
    await prisma.$disconnect()
  })

//   describe('GET /api/user-profile/me', () => {
//     it('should return student profile with role-specific data', async () => {
//       const response = await request(app)
//         .get('/api/user-profile/me')
//         .set('Cookie', `accessToken=${studentToken}`)
//         .expect(200)

//       expect(response.body.success).toBe(true)
//       expect(response.body.data.user.role).toBe('STUDENT')
//       expect(response.body.data.userType.role).toBe('STUDENT')
//       expect(response.body.data.capabilities).toContain('view_jobs')
//       expect(response.body.data.capabilities).toContain('apply_to_jobs')
//       expect(response.body.data.recommendedDashboard).toBe('/student/dashboard')
//       expect(response.body.data.roleData).toHaveProperty('studentId')
//     })

//     it('should return professor profile with role-specific data', async () => {
//       const response = await request(app)
//         .get('/api/user-profile/me')
//         .set('Cookie', `accessToken=${professorToken}`)
//         .expect(200)

//       expect(response.body.success).toBe(true)
//       expect(response.body.data.user.role).toBe('PROFESSOR')
//       expect(response.body.data.userType.role).toBe('PROFESSOR')
//       expect(response.body.data.capabilities).toContain('view_student_profiles')
//       expect(response.body.data.capabilities).toContain('access_reports')
//       expect(response.body.data.recommendedDashboard).toBe('/professor/dashboard')
//       expect(response.body.data.roleData).toHaveProperty('department')
//       expect(response.body.data.roleData.department).toBe('Computer Science')
//     })

//     it('should return employer profile with role-specific data', async () => {
//       const response = await request(app)
//         .get('/api/user-profile/me')
//         .set('Cookie', `accessToken=${employerToken}`)
//         .expect(200)

//       expect(response.body.success).toBe(true)
//       expect(response.body.data.user.role).toBe('EMPLOYER')
//       expect(response.body.data.userType.role).toBe('EMPLOYER')
//       expect(response.body.data.capabilities).toContain('post_jobs')
//       expect(response.body.data.capabilities).toContain('manage_job_postings')
//       expect(response.body.data.recommendedDashboard).toBe('/employer/dashboard')
//       expect(response.body.data.roleData).toHaveProperty('companyName')
//       expect(response.body.data.roleData.companyName).toBe('Test Company')
//     })

//     it('should return admin profile with role-specific data', async () => {
//       const response = await request(app)
//         .get('/api/user-profile/me')
//         .set('Cookie', `accessToken=${adminToken}`)
//         .expect(200)

//       expect(response.body.success).toBe(true)
//       expect(response.body.data.user.role).toBe('ADMIN')
//       expect(response.body.data.userType.role).toBe('ADMIN')
//       expect(response.body.data.capabilities).toContain('manage_all_users')
//       expect(response.body.data.capabilities).toContain('system_configuration')
//       expect(response.body.data.recommendedDashboard).toBe('/admin/dashboard')
//       expect(response.body.data.roleData).toHaveProperty('systemStats')
//       expect(response.body.data.userType.permissions).toEqual(['*'])
//     })

//     it('should reject request without authentication token', async () => {
//       const response = await request(app)
//         .get('/api/user-profile/me')
//         .expect(401)

//       expect(response.body.success).toBe(false)
//     })
//   })

//   describe('GET /api/user-profile/dashboard', () => {
//     it('should return student dashboard data', async () => {
//       const response = await request(app)
//         .get('/api/user-profile/dashboard')
//         .set('Cookie', `accessToken=${studentToken}`)
//         .expect(200)

//       expect(response.body.success).toBe(true)
//       expect(response.body.data.userRole).toBe('STUDENT')
//       expect(response.body.data.dashboard).toHaveProperty('recentJobs')
//       expect(response.body.data.dashboard).toHaveProperty('myApplications')
//       expect(response.body.data.dashboard.quickActions).toContain('Browse Jobs')
//     })

//     it('should return employer dashboard data', async () => {
//       const response = await request(app)
//         .get('/api/user-profile/dashboard')
//         .set('Cookie', `accessToken=${employerToken}`)
//         .expect(200)

//       expect(response.body.success).toBe(true)
//       expect(response.body.data.userRole).toBe('EMPLOYER')
//       expect(response.body.data.dashboard).toHaveProperty('myJobPostings')
//       expect(response.body.data.dashboard.quickActions).toContain('Post New Job')
//     })

//     it('should return admin dashboard data', async () => {
//       const response = await request(app)
//         .get('/api/user-profile/dashboard')
//         .set('Cookie', `accessToken=${adminToken}`)
//         .expect(200)

//       expect(response.body.success).toBe(true)
//       expect(response.body.data.userRole).toBe('ADMIN')
//       expect(response.body.data.dashboard).toHaveProperty('systemStats')
//       expect(response.body.data.dashboard.quickActions).toContain('Manage Users')
//     })
//   })

//   describe('Role-based Access Control', () => {
//     describe('GET /api/user-profile/admin-only', () => {
//       it('should allow admin access', async () => {
//         const response = await request(app)
//           .get('/api/user-profile/admin-only')
//           .set('Cookie', `accessToken=${adminToken}`)
//           .expect(200)

//         expect(response.body.success).toBe(true)
//         expect(response.body.data.userRole).toBe('ADMIN')
//         expect(response.body.data.adminPrivileges).toContain('System Configuration')
//       })

//       it('should deny student access', async () => {
//         const response = await request(app)
//           .get('/api/user-profile/admin-only')
//           .set('Cookie', `accessToken=${studentToken}`)
//           .expect(403)

//         expect(response.body.success).toBe(false)
//         expect(response.body.message).toContain('Access denied')
//       })

//       it('should deny employer access', async () => {
//         const response = await request(app)
//           .get('/api/user-profile/admin-only')
//           .set('Cookie', `accessToken=${employerToken}`)
//           .expect(403)

//         expect(response.body.success).toBe(false)
//       })

//       it('should deny professor access', async () => {
//         const response = await request(app)
//           .get('/api/user-profile/admin-only')
//           .set('Cookie', `accessToken=${professorToken}`)
//           .expect(403)

//         expect(response.body.success).toBe(false)
//       })
//     })

//     describe('GET /api/user-profile/employer-only', () => {
//       it('should allow employer access', async () => {
//         const response = await request(app)
//           .get('/api/user-profile/employer-only')
//           .set('Cookie', `accessToken=${employerToken}`)
//           .expect(200)

//         expect(response.body.success).toBe(true)
//         expect(response.body.data.userRole).toBe('EMPLOYER')
//         expect(response.body.data.employerPrivileges).toContain('Job Posting')
//       })

//       it('should deny student access', async () => {
//         const response = await request(app)
//           .get('/api/user-profile/employer-only')
//           .set('Cookie', `accessToken=${studentToken}`)
//           .expect(403)

//         expect(response.body.success).toBe(false)
//       })

//       it('should deny admin access to employer-only endpoint', async () => {
//         const response = await request(app)
//           .get('/api/user-profile/employer-only')
//           .set('Cookie', `accessToken=${adminToken}`)
//           .expect(403)

//         expect(response.body.success).toBe(false)
//       })
//     })
//   })

//   describe('Authentication Requirements', () => {
//     it('should reject all endpoints without authentication', async () => {
//       const endpoints = [
//         '/api/user-profile/me',
//         '/api/user-profile/dashboard',
//         '/api/user-profile/admin-only',
//         '/api/user-profile/employer-only'
//       ]

//       for (const endpoint of endpoints) {
//         const response = await request(app)
//           .get(endpoint)
//           .expect(401)

//         expect(response.body.success).toBe(false)
//       }
//     })

//     it('should reject requests with invalid tokens', async () => {
//       const invalidToken = 'invalid.jwt.token'
      
//       const response = await request(app)
//         .get('/api/user-profile/me')
//         .set('Cookie', `accessToken=${invalidToken}`)
//         .expect(401)

//       expect(response.body.success).toBe(false)
//     })
//   })
// })