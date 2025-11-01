/**
 * @fileoverview Integration tests for Admin Announcement routes
 */

const request = require('supertest')
const prisma = require('../../../../src/models/prisma')
const app = require('../../../../src/app')
const { cleanupDatabase, createTestToken } = require('../../utils/testHelpers')

jest.setTimeout(30000)

let adminUser, studentUser, admin
let adminToken, studentToken
let testAnnouncement

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret'

  await cleanupDatabase(prisma, { logSuccess: false })

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
    },
    include: { admin: true }
  })
  admin = adminUser.admin
  adminToken = createTestToken({ id: adminUser.id, role: 'ADMIN' })

  // Create student user
  const degreeType = await prisma.degreeType.create({
    data: { name: 'Bachelor' }
  })

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
          address: 'Dorm'
        }
      }
    }
  })
  studentToken = createTestToken({ id: studentUser.id, role: 'STUDENT' })

  // Create a test announcement
  testAnnouncement = await prisma.announcement.create({
    data: {
      title: 'Test Announcement',
      content: 'This is a test announcement for integration testing.',
      audience: 'ALL',
      priority: 'MEDIUM',
      createdBy: adminUser.id
    }
  })
})

afterAll(async () => {
  await cleanupDatabase(prisma, { logSuccess: false })
  await prisma.$disconnect()
})

describe('Admin Announcement Routes', () => {
  describe('GET /api/admin/announcements', () => {
    it('should return all announcements', async () => {
      const response = await request(app)
        .get('/api/admin/announcements')
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should include creator information', async () => {
      const response = await request(app)
        .get('/api/admin/announcements')
        .set('Authorization', adminToken)
        .expect(200)

      const announcement = response.body.data[0]
      expect(announcement.creator).toBeDefined()
      expect(announcement.creator.name).toBeDefined()
    })
  })

  describe('GET /api/admin/announcements/:id', () => {
    it('should return a single announcement', async () => {
      const response = await request(app)
        .get(`/api/admin/announcements/${testAnnouncement.id}`)
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBe(testAnnouncement.id)
      expect(response.body.data.title).toBe(testAnnouncement.title)
    })

    it('should return 404 for non-existent announcement', async () => {
      const response = await request(app)
        .get('/api/admin/announcements/nonexistent-id')
        .set('Authorization', adminToken)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/admin/announcements', () => {
    it('should create announcement as admin', async () => {
      const response = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', adminToken)
        .send({
          title: 'New Announcement',
          content: 'This is a new announcement created by an admin.',
          audience: 'ALL',
          priority: 'HIGH'
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.title).toBe('New Announcement')
      expect(response.body.data.createdBy).toBe(adminUser.id)

      // Verify in database
      const created = await prisma.announcement.findUnique({
        where: { id: response.body.data.id }
      })
      expect(created).toBeTruthy()
    })

    it('should validate title is required', async () => {
      const response = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', adminToken)
        .send({
          content: 'Content without title',
          audience: 'ALL'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should validate content is required', async () => {
      const response = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', adminToken)
        .send({
          title: 'Title without content',
          audience: 'ALL'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should validate audience is required', async () => {
      const response = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', adminToken)
        .send({
          title: 'Valid title',
          content: 'Valid content'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should validate title length (max 200 chars)', async () => {
      const response = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', adminToken)
        .send({
          title: 'A'.repeat(201),
          content: 'Valid content',
          audience: 'ALL'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should validate content length (max 5000 chars)', async () => {
      const response = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', adminToken)
        .send({
          title: 'Valid title',
          content: 'A'.repeat(5001),
          audience: 'ALL'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', studentToken)
        .send({
          title: 'Unauthorized Announcement',
          content: 'This should fail',
          audience: 'ALL'
        })
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/admin/announcements')
        .send({
          title: 'Unauthenticated Announcement',
          content: 'This should fail',
          audience: 'ALL'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PATCH /api/admin/announcements/:id', () => {
    it('should update announcement as admin', async () => {
      const response = await request(app)
        .patch(`/api/admin/announcements/${testAnnouncement.id}`)
        .set('Authorization', adminToken)
        .send({
          title: 'Updated Announcement Title'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe('Updated Announcement Title')

      // Verify in database
      const updated = await prisma.announcement.findUnique({
        where: { id: testAnnouncement.id }
      })
      expect(updated.title).toBe('Updated Announcement Title')
    })

    it('should update only content', async () => {
      const response = await request(app)
        .patch(`/api/admin/announcements/${testAnnouncement.id}`)
        .set('Authorization', adminToken)
        .send({
          content: 'Updated content only'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.content).toBe('Updated content only')
    })

    it('should require at least one field to update', async () => {
      const response = await request(app)
        .patch(`/api/admin/announcements/${testAnnouncement.id}`)
        .set('Authorization', adminToken)
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should deny access to non-admin', async () => {
      const response = await request(app)
        .patch(`/api/admin/announcements/${testAnnouncement.id}`)
        .set('Authorization', studentToken)
        .send({
          title: 'Unauthorized Update'
        })
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/admin/announcements/:id', () => {
    it('should delete announcement as admin', async () => {
      // Create announcement to delete
      const toDelete = await prisma.announcement.create({
        data: {
          title: 'To Delete',
          content: 'This will be deleted',
          createdBy: adminUser.id,
          audience: 'ALL'
        }
      })

      const response = await request(app)
        .delete(`/api/admin/announcements/${toDelete.id}`)
        .set('Authorization', adminToken)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify deletion in database
      const deleted = await prisma.announcement.findUnique({
        where: { id: toDelete.id }
      })
      expect(deleted).toBeNull()
    })

    it('should return 404 for non-existent announcement', async () => {
      const response = await request(app)
        .delete('/api/admin/announcements/nonexistent-id')
        .set('Authorization', adminToken)
        .expect(404)

      expect(response.body.success).toBe(false)
    })

    it('should deny access to non-admin', async () => {
      const response = await request(app)
        .delete(`/api/admin/announcements/${testAnnouncement.id}`)
        .set('Authorization', studentToken)
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })
})

