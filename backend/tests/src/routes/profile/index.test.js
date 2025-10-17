/**
 * @fileoverview Integration tests for Profile routes (Express + SQLite + Supertest)
 */

const request = require('supertest')
const prisma = require('../../../../src/models/prisma')
const app = require('../../../../src/app')
const jwt = require('jsonwebtoken')

jest.setTimeout(30000)

let degreeType
let studentUser, hrUser, adminUser
let studentToken, hrToken, adminToken

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

  // Cleanup in proper order - order matters for foreign keys
  await prisma.jobReport.deleteMany()
  await prisma.studentInterest.deleteMany()
  await prisma.application.deleteMany()
  await prisma.requirement.deleteMany()
  await prisma.qualification.deleteMany()
  await prisma.responsibility.deleteMany()
  await prisma.benefit.deleteMany()
  await prisma.job.deleteMany()
  await prisma.student.deleteMany()
  await prisma.hR.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.professor.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.degreeType.deleteMany()

  // Create required DegreeType
  degreeType = await prisma.degreeType.create({
    data: {
      name: 'Bachelor of Testing'
    }
  })

  // Create test users with auth tokens
  const secret = process.env.JWT_SECRET

  adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      surname: 'User',
      email: 'admin@test.com',
      password: 'Pass',
      role: 'ADMIN',
      admin: { create: {} }
    }
  })
  adminToken = `Bearer ${jwt.sign({ id: adminUser.id, role: 'ADMIN' }, secret)}`

  studentUser = await prisma.user.create({
    data: {
      name: 'Student',
      surname: 'User',
      email: 'student@test.com',
      password: 'Pass',
      role: 'STUDENT',
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: 'Dorm',
          gpa: 3.4
        }
      }
    },
    include: { student: true }
  })
  studentToken = `Bearer ${jwt.sign({ id: studentUser.id, role: 'STUDENT' }, secret)}`

  hrUser = await prisma.user.create({
    data: {
      name: 'HR',
      surname: 'User',
      email: 'hr@test.com',
      password: 'Pass',
      role: 'EMPLOYER',
      hr: {
        create: {
          companyName: 'TestCorp',
          industry: 'IT_SOFTWARE',
          companySize: 'ONE_TO_TEN',
          address: 'Office'
        }
      }
    },
    include: { hr: true }
  })
  hrToken = `Bearer ${jwt.sign({ id: hrUser.id, role: 'EMPLOYER', hr: { id: hrUser.hr.id } }, secret)}`
})

afterAll(async () => {
  // Cleanup in proper order
  await prisma.jobReport.deleteMany()
  await prisma.studentInterest.deleteMany()
  await prisma.application.deleteMany()
  await prisma.requirement.deleteMany()
  await prisma.qualification.deleteMany()
  await prisma.responsibility.deleteMany()
  await prisma.benefit.deleteMany()
  await prisma.job.deleteMany()
  await prisma.student.deleteMany()
  await prisma.hR.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.professor.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.degreeType.deleteMany()
  
  await prisma.$disconnect()
})

describe('Profile routes (integration)', () => {
  describe('GET /api/profile/:userId', () => {
    it('should return 200 with correct profile', async () => {
      const res = await request(app)
        .get(`/api/profile/${studentUser.id}`)
        .set('Authorization', studentToken)
        .expect(200)
      expect(res.body.data).toEqual(expect.objectContaining({ id: studentUser.id }))
    })

    it('should return 404 if not found', async () => {
      const res = await request(app)
        .get('/api/profile/99999')
        .set('Authorization', studentToken)
        .expect(404)
      expect(res.body.data.message).toMatch(/not found/i)
    })
  })

  describe('GET /api/profile', () => {
    it('should return 200 with list of profiles', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', studentToken)
        .expect(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(2) // Should have student + hr
    })
  })

  describe('PATCH /api/profile', () => {
    it('should update student profile successfully', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', studentToken)
        .send({ userId: studentUser.id, role: 'STUDENT', updates: { gpa: 3.8 } })
        .expect(200)

      expect(res.body.data.student.gpa).toBe(3.8)
    })

    it('should update employer profile successfully', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', hrToken)
        .send({ userId: hrUser.id, role: 'EMPLOYER', updates: { companyName: 'TestCorp Updated' } })
        .expect(200)

      expect(res.body.data.hr.companyName).toBe('TestCorp Updated')
    })

    it('should return 400 for invalid payload', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', studentToken)
        .send({})
        .expect(400)
      expect(res.body.data.message).toMatch(/invalid|required/i)
    })

    it('should return 404 when profile not found', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', studentToken)
        .send({ userId: 99999, role: 'STUDENT', updates: { gpa: 4.0 } })
        .expect(404)
      expect(res.body.data.message).toMatch(/not found/i)
    })
  })
})