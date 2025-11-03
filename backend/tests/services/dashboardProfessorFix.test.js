const request = require('supertest')
const app = require('../../src/app')
const { hashPassword } = require('../../src/utils/passwordUtils')
const prisma = require('../../src/models/prisma')
const jwt = require('jsonwebtoken')

describe('Dashboard Professor Counting Fix', () => {
  let adminToken
  let adminUserId

  beforeAll(async () => {
    // Create admin user for authentication
    const hashedPassword = await hashPassword('testpassword')
    const admin = await prisma.user.create({
      data: {
        name: 'Test',
        surname: 'Admin',
        email: `test.admin.dashboard.${Date.now()}@ku.th`,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'APPROVED',
        verified: true,
        admin: {
          create: {}
        }
      }
    })
    adminUserId = admin.id

    // Generate JWT token directly (use 'id' field, not 'userId')
    const token = jwt.sign(
      { id: adminUserId, role: 'ADMIN' },
      process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
      { expiresIn: '1h' }
    )

    adminToken = `Bearer ${token}`
  })

  afterAll(async () => {
    // Cleanup
    // Remove related records first to satisfy FK constraints
    await prisma.professor.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test.prof.dashboard'
          }
        }
      }
    })
    await prisma.admin.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test.admin.dashboard'
          }
        }
      }
    })
    // Now remove the users themselves
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test.prof.dashboard'
        }
      }
    })
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test.admin.dashboard'
        }
      }
    })
    await prisma.$disconnect()
  })

  it('should count professors separately from employers', async () => {
    // Get dashboard before
    const beforeResponse = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', adminToken)
      .expect(200)

    const beforeData = beforeResponse.body.data
    const beforeProfessorCount = beforeData.users.byRole.professor || 0
    const beforeEmployerCount = beforeData.users.byRole.employer

    // Create a professor
    const createResponse = await request(app)
      .post('/api/admin/users/professor')
      .set('Authorization', adminToken)
      .send({
        name: 'TestProf',
        surname: 'Dashboard',
        email: `test.prof.dashboard.${Date.now()}@ku.th`,
        department: 'Test Department'
      })
      .expect(201)

    expect(createResponse.body.data.user.role).toBe('PROFESSOR')

    // Get dashboard after
    const afterResponse = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', adminToken)
      .expect(200)

    const afterData = afterResponse.body.data

    // Verify professor count increased
    expect(afterData.users.byRole.professor).toBe(beforeProfessorCount + 1)

    // Verify employer count did NOT change
    expect(afterData.users.byRole.employer).toBe(beforeEmployerCount)
  })

  it('should NOT show admin-created professors in recent registrations', async () => {
    // Create a professor
    const createResponse = await request(app)
      .post('/api/admin/users/professor')
      .set('Authorization', adminToken)
      .send({
        name: 'TestProf2',
        surname: 'Dashboard',
        email: `test.prof.dashboard2.${Date.now()}@ku.th`,
        department: 'Test Department 2'
      })
      .expect(201)

    const professorEmail = createResponse.body.data.user.email

    // Get dashboard
    const dashboardResponse = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', adminToken)
      .expect(200)

    const recentActivity = dashboardResponse.body.data.recentActivity

    // Find any activity with this professor's email
    const professorActivity = recentActivity.find(
      activity => 
        activity.metadata && 
        activity.metadata.email === professorEmail
    )

    // Should not find professor in recent registrations
    // (professors created by admin should be filtered out)
    if (professorActivity) {
      expect(professorActivity.type).not.toBe('USER_REGISTRATION')
    }
  })

  it('should include professor role in byRole stats', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', adminToken)
      .expect(200)

    const data = response.body.data

    // Verify byRole has professor field
    expect(data.users.byRole).toHaveProperty('professor')
    expect(typeof data.users.byRole.professor).toBe('number')
    expect(data.users.byRole.professor).toBeGreaterThanOrEqual(0)
  })
})
