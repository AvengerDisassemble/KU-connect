/**
 * @fileoverview Integration tests for Admin User Management routes
 */

const request = require('supertest')
const prisma = require('../../../../src/models/prisma')
const app = require('../../../../src/app')
const { cleanupDatabase, createTestToken, TEST_DEGREE_TYPES } = require('../../utils/testHelpers')

jest.setTimeout(30000)

let degreeType
let adminUser, studentUser, pendingUser, suspendedUser
let adminToken, studentToken

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret'

  await cleanupDatabase(prisma, { logSuccess: false })

  // Create required DegreeType
  degreeType = await prisma.degreeType.create({
    data: {
      name: TEST_DEGREE_TYPES.BACHELOR
    }
  })

  // Create admin user
  adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      surname: 'User',
      email: 'admin@test.com',
      password: 'Pass',
      role: 'ADMIN',
      status: 'APPROVED',
      admin: { create: {} }
    }
  })
  adminToken = createTestToken({ id: adminUser.id, role: 'ADMIN' })

  // Create regular approved student
  studentUser = await prisma.user.create({
    data: {
      name: 'Student',
      surname: 'User',
      email: 'student@test.com',
      password: 'Pass',
      role: 'STUDENT',
      status: 'APPROVED',
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: 'Dorm',
          gpa: 3.4
        }
      }
    }
  })
  studentToken = createTestToken({ id: studentUser.id, role: 'STUDENT' })

  // Create pending user
  pendingUser = await prisma.user.create({
    data: {
      name: 'Pending',
      surname: 'User',
      email: 'pending@test.com',
      password: 'Pass',
      role: 'STUDENT',
      status: 'PENDING',
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: 'Dorm'
        }
      }
    }
  })

  // Create suspended user
  suspendedUser = await prisma.user.create({
    data: {
      name: 'Suspended',
      surname: 'User',
      email: 'suspended@test.com',
      password: 'Pass',
      role: 'STUDENT',
      status: 'SUSPENDED',
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: 'Dorm'
        }
      }
    }
  })
})

afterAll(async () => {
  await cleanupDatabase(prisma, { logSuccess: false })
  await prisma.$disconnect()
})

describe('Admin User Management Routes', () => {
  describe('GET /api/admin/users/pending', () => {
    it('should list all pending users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users/pending')
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/users/pending')
        .set('Authorization', studentToken)
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/users/pending')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/admin/users', () => {
    it('should list all users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should filter users by status', async () => {
      const response = await request(app)
        .get('/api/admin/users?status=PENDING')
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.every(u => u.status === 'PENDING')).toBe(true)
    })

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=STUDENT')
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.every(u => u.role === 'STUDENT')).toBe(true)
    })

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', studentToken)
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/admin/users/:userId/approve', () => {
    it('should approve a pending user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${pendingUser.id}/approve`)
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('APPROVED')

      // Verify in database
      const updatedUser = await prisma.user.findUnique({ where: { id: pendingUser.id } })
      expect(updatedUser.status).toBe('APPROVED')
    })

    it('should deny access to non-admin', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${pendingUser.id}/approve`)
        .set('Authorization', studentToken)
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/admin/users/:userId/reject', () => {
    it('should reject a user', async () => {
      // Create a fresh pending user
      const newUser = await prisma.user.create({
        data: {
          name: 'ToReject',
          surname: 'User',
          email: 'reject@test.com',
          password: 'Pass',
          role: 'STUDENT',
          status: 'PENDING',
          student: { create: { degreeTypeId: degreeType.id, address: 'Dorm' } }
        }
      })

      const response = await request(app)
        .post(`/api/admin/users/${newUser.id}/reject`)
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('REJECTED')
    })
  })

  describe('POST /api/admin/users/:userId/suspend', () => {
    it('should suspend an approved user', async () => {
      // Create a fresh approved user
      const newUser = await prisma.user.create({
        data: {
          name: 'ToSuspend',
          surname: 'User',
          email: 'suspend@test.com',
          password: 'Pass',
          role: 'STUDENT',
          status: 'APPROVED',
          student: { create: { degreeTypeId: degreeType.id, address: 'Dorm' } }
        }
      })

      const response = await request(app)
        .post(`/api/admin/users/${newUser.id}/suspend`)
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('SUSPENDED')
    })
  })

  describe('POST /api/admin/users/:userId/activate', () => {
    it('should activate a suspended user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${suspendedUser.id}/activate`)
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('APPROVED')

      // Verify in database
      const updatedUser = await prisma.user.findUnique({ where: { id: suspendedUser.id } })
      expect(updatedUser.status).toBe('APPROVED')
    })
  })

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('totalUsers')
      expect(response.body.data).toHaveProperty('pendingUsers')
      expect(response.body.data).toHaveProperty('approvedUsers')
      expect(response.body.data).toHaveProperty('suspendedUsers')
      expect(response.body.data).toHaveProperty('activeJobs')
      expect(response.body.data).toHaveProperty('reports')
      expect(response.body.data.totalUsers).toBeGreaterThan(0)
    })

    it('should deny access to non-admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', studentToken)
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })
})

