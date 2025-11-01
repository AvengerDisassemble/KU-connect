/**
 * @module tests/controllers/professorController.test
 * @description Test professor analytics controller with role-based access
 */

const request = require('supertest')
const app = require('../../src/app')
const prisma = require('../../src/models/prisma')
const jwt = require('jsonwebtoken')

describe('Professor Analytics Controller', () => {
  let professorToken, adminToken, studentToken
  let professorUserId, adminUserId, studentUserId
  let degreeType1, degreeType2
  let testStudents = []
  let testJobs = []
  let testApplications = []

  beforeAll(async () => {
    try {
      // Create degree types
      degreeType1 = await prisma.degreeType.create({
        data: { name: `Bachelor of Engineering ${Date.now()}` }
      })
      
      degreeType2 = await prisma.degreeType.create({
        data: { name: `Master of Science ${Date.now()}` }
      })

      // Create professor user
      const professorUser = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'Professor',
          email: `professor-${Date.now()}@test.com`,
          password: 'hashedpass',
          role: 'PROFESSOR',
          verified: true
        }
      })
      professorUserId = professorUser.id

      await prisma.professor.create({
        data: {
          userId: professorUserId,
          department: 'Engineering'
        }
      })

      // Create admin user
      const adminUser = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'Admin',
          email: `admin-${Date.now()}@test.com`,
          password: 'hashedpass',
          role: 'ADMIN',
          verified: true
        }
      })
      adminUserId = adminUser.id

      await prisma.admin.create({
        data: { userId: adminUserId }
      })

      // Create student user (for 403 tests)
      const studentUser = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'Student',
          email: `student-${Date.now()}@test.com`,
          password: 'hashedpass',
          role: 'STUDENT',
          verified: true
        }
      })
      studentUserId = studentUser.id

      await prisma.student.create({
        data: {
          userId: studentUserId,
          degreeTypeId: degreeType1.id,
          address: 'Test Address',
          gpa: 3.5,
          expectedGraduationYear: 2026
        }
      })

      // Generate tokens
      const secret = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret'
      professorToken = jwt.sign({ id: professorUserId, role: 'PROFESSOR' }, secret, { expiresIn: '1h' })
      adminToken = jwt.sign({ id: adminUserId, role: 'ADMIN' }, secret, { expiresIn: '1h' })
      studentToken = jwt.sign({ id: studentUserId, role: 'STUDENT' }, secret, { expiresIn: '1h' })

      // Create test students with various graduation years
      const graduationYears = [2025, 2026, 2027, 2028, 2029]
      const gpas = [2.5, 3.0, 3.5, 4.0]
      
      for (let i = 0; i < 10; i++) {
        const user = await prisma.user.create({
          data: {
            name: `Student${i}`,
            surname: `Test${i}`,
            email: `teststudent${i}-${Date.now()}@test.com`,
            password: 'hashedpass',
            role: 'STUDENT',
            verified: true
          }
        })

        const student = await prisma.student.create({
          data: {
            userId: user.id,
            degreeTypeId: i < 5 ? degreeType1.id : degreeType2.id,
            address: `Address ${i}`,
            gpa: gpas[i % gpas.length],
            expectedGraduationYear: graduationYears[i % graduationYears.length],
            resumeKey: i % 2 === 0 ? `resume-key-${i}` : null,
            transcriptKey: i % 3 === 0 ? `transcript-key-${i}` : null
          }
        })

        testStudents.push({ user, student })
      }

      // Create HR user for jobs
      const hrUser = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'HR',
          email: `testhr-${Date.now()}@test.com`,
          password: 'hashedpass',
          role: 'EMPLOYER',
          verified: true
        }
      })

      const hr = await prisma.hR.create({
        data: {
          userId: hrUser.id,
          companyName: 'Test Company',
          address: 'Company Address',
          phoneNumber: '02-123-4567'
        }
      })

      // Create test jobs
      const jobTypes = ['internship', 'full-time', 'part-time']
      const now = new Date()
      
      for (let i = 0; i < 5; i++) {
        const job = await prisma.job.create({
          data: {
            hrId: hr.id,
            title: `Test Job ${i}`,
            companyName: 'Test Company',
            description: 'Job description',
            location: i % 2 === 0 ? 'Bangkok' : 'Chiang Mai',
            jobType: jobTypes[i % jobTypes.length],
            workArrangement: 'hybrid',
            duration: '3 months',
            minSalary: 15000,
            maxSalary: 25000,
            application_deadline: new Date(now.getTime() + (i % 2 === 0 ? 30 : -30) * 24 * 60 * 60 * 1000),
            phone_number: '02-123-4567'
          }
        })

        testJobs.push(job)
      }

      // Create test applications with various statuses and dates
      const statuses = ['PENDING', 'QUALIFIED', 'REJECTED']
      const daysAgo = [5, 10, 15, 20, 25, 30, 35, 40]
      
      for (let i = 0; i < testStudents.length; i++) {
        const student = testStudents[i].student
        const numApplications = (i % 3) + 1 // 1-3 applications per student
        
        for (let j = 0; j < numApplications; j++) {
          const jobIndex = (i + j) % testJobs.length
          const application = await prisma.application.create({
            data: {
              jobId: testJobs[jobIndex].id,
              studentId: student.id,
              status: statuses[(i + j) % statuses.length],
              createdAt: new Date(now.getTime() - daysAgo[(i + j) % daysAgo.length] * 24 * 60 * 60 * 1000)
            }
          })

          testApplications.push(application)
        }
      }

      // Add some interests
      for (let i = 0; i < 3; i++) {
        await prisma.studentInterest.create({
          data: {
            studentId: testStudents[i].student.id,
            jobId: testJobs[(i + 1) % testJobs.length].id
          }
        })
      }
    } catch (error) {
      console.error('Setup error:', error)
      throw error
    }
  })

  afterAll(async () => {
    try {
      // Cleanup in reverse order of creation
      await prisma.studentInterest.deleteMany({})
      await prisma.application.deleteMany({})
      await prisma.job.deleteMany({})
      await prisma.hR.deleteMany({})
      
      // Delete test students
      const studentUserIds = testStudents.map(s => s.user.id)
      await prisma.student.deleteMany({
        where: { userId: { in: studentUserIds } }
      })
      
      // Delete professor, admin, and student profiles
      await prisma.professor.deleteMany({ where: { userId: professorUserId } })
      await prisma.admin.deleteMany({ where: { userId: adminUserId } })
      await prisma.student.deleteMany({ where: { userId: studentUserId } })
      
      // Delete all users
      const allUserIds = [
        ...studentUserIds,
        professorUserId,
        adminUserId,
        studentUserId
      ].filter(id => id)
      
      await prisma.user.deleteMany({
        where: { id: { in: allUserIds } }
      })
      
      // Delete degree types
      await prisma.degreeType.deleteMany({
        where: {
          id: { in: [degreeType1.id, degreeType2.id] }
        }
      })
    } catch (error) {
      console.error('Cleanup error:', error)
    } finally {
      await prisma.$disconnect()
    }
  })

  // ==================== DASHBOARD ENDPOINT TESTS ====================
  describe('GET /api/professor/analytics/dashboard', () => {
    test('should return dashboard analytics for professor', async () => {
      const response = await request(app)
        .get('/api/professor/analytics/dashboard')
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      
      // Verify summary metrics
      expect(response.body.data.summary).toBeDefined()
      expect(response.body.data.summary.totalStudents).toBeGreaterThan(0)
      expect(response.body.data.summary.totalApplications).toBeGreaterThan(0)
      
      // Verify application metrics
      expect(response.body.data.applicationMetrics).toBeDefined()
      expect(response.body.data.applicationMetrics.byStatus).toBeDefined()
      expect(response.body.data.applicationMetrics.byStatus.pending).toBeGreaterThanOrEqual(0)
      
      // Verify job metrics
      expect(response.body.data.jobMetrics).toBeDefined()
      expect(response.body.data.jobMetrics.byJobType).toBeInstanceOf(Array)
      
      // Verify trends
      expect(response.body.data.applicationTrends).toBeDefined()
      expect(response.body.data.applicationTrends.daily).toBeInstanceOf(Array)
      expect(response.body.data.applicationTrends.monthly).toBeInstanceOf(Array)
      
      // Verify degree type breakdown
      expect(response.body.data.degreeTypeBreakdown).toBeInstanceOf(Array)
      
      // Verify recent activity
      expect(response.body.data.recentActivity).toBeInstanceOf(Array)
    })

    test('should return dashboard analytics for admin', async () => {
      const response = await request(app)
        .get('/api/professor/analytics/dashboard')
        .set('Cookie', [`accessToken=${adminToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })

    test('should filter by degreeTypeId', async () => {
      const response = await request(app)
        .get(`/api/professor/analytics/dashboard?degreeTypeId=${degreeType1.id}`)
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.degreeTypeBreakdown).toBeInstanceOf(Array)
      
      // Should only have data for the filtered degree type
      const breakdown = response.body.data.degreeTypeBreakdown
      if (breakdown.length > 0) {
        expect(breakdown.every(dt => dt.degreeTypeId === degreeType1.id)).toBe(true)
      }
    })

    test('should filter by timePeriod (last30days)', async () => {
      const response = await request(app)
        .get('/api/professor/analytics/dashboard?timePeriod=last30days')
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.applicationTrends).toBeDefined()
      expect(response.body.data.applicationTrends.daily).toBeInstanceOf(Array)
    })

    test('should return 403 for non-professor/admin users', async () => {
      const response = await request(app)
        .get('/api/professor/analytics/dashboard')
        .set('Cookie', [`accessToken=${studentToken}`])
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    test('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/professor/analytics/dashboard')
        .expect(401)
    })
  })

  // ==================== STUDENT LIST ENDPOINT TESTS ====================
  describe('GET /api/professor/students', () => {
    test('should return paginated student list', async () => {
      const response = await request(app)
        .get('/api/professor/students')
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.students).toBeInstanceOf(Array)
      expect(response.body.data.pagination).toBeDefined()
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.limit).toBe(20)
      expect(response.body.data.pagination.total).toBeGreaterThan(0)
    })

    test('should filter by degreeTypeId', async () => {
      const response = await request(app)
        .get(`/api/professor/students?degreeTypeId=${degreeType1.id}`)
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      const students = response.body.data.students
      
      // All students should have the filtered degree type
      students.forEach(student => {
        expect(student.degreeType.id).toBe(degreeType1.id)
      })
    })

    test('should filter by year', async () => {
      const response = await request(app)
        .get('/api/professor/students?year=4')
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      const students = response.body.data.students
      
      // All students should be year 4
      students.forEach(student => {
        expect(student.year).toBe(4)
      })
    })

    test('should filter by year=4+', async () => {
      const response = await request(app)
        .get('/api/professor/students?year=4%2B')
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      const students = response.body.data.students
      
      // All students should be year 4+
      students.forEach(student => {
        expect(student.year).toBe('4+')
      })
    })

    test('should search by name', async () => {
      const response = await request(app)
        .get('/api/professor/students?search=Student0')
        .set('Cookie', [`accessToken=${professorToken}`])

      // Log the response to see what's happening
      if (response.status !== 200) {
        console.log('Search error response:', response.body)
      }

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      const students = response.body.data.students
      
      // At least one student should match the search
      expect(students.length).toBeGreaterThan(0)
      expect(students.some(s => s.name.includes('Student0'))).toBe(true)
    })

    test('should sort by applications (desc)', async () => {
      const response = await request(app)
        .get('/api/professor/students?sortBy=applications&order=desc')
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      const students = response.body.data.students
      
      if (students.length > 1) {
        // Check that applications are sorted descending
        for (let i = 0; i < students.length - 1; i++) {
          expect(students[i].applicationStats.total).toBeGreaterThanOrEqual(students[i + 1].applicationStats.total)
        }
      }
    })

    test('should filter by hasApplications=true', async () => {
      const response = await request(app)
        .get('/api/professor/students?hasApplications=true')
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      const students = response.body.data.students
      
      // All students should have applications
      students.forEach(student => {
        expect(student.applicationStats.total).toBeGreaterThan(0)
      })
    })

    test('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/professor/students?page=1&limit=5')
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.students.length).toBeLessThanOrEqual(5)
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.limit).toBe(5)
    })

    test('should return 403 for non-professor/admin users', async () => {
      const response = await request(app)
        .get('/api/professor/students')
        .set('Cookie', [`accessToken=${studentToken}`])
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  // ==================== STUDENT DETAIL ENDPOINT TESTS ====================
  describe('GET /api/professor/students/:studentId', () => {
    test('should return student detail with full data', async () => {
      const studentId = testStudents[0].student.id

      const response = await request(app)
        .get(`/api/professor/students/${studentId}`)
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.student).toBeDefined()
      
      // Verify personal info
      expect(response.body.data.student.personalInfo).toBeDefined()
      expect(response.body.data.student.personalInfo.name).toBeDefined()
      expect(response.body.data.student.personalInfo.email).toBeDefined()
      
      // Verify academic info
      expect(response.body.data.student.academicInfo).toBeDefined()
      expect(response.body.data.student.academicInfo.degreeType).toBeDefined()
      expect(response.body.data.student.academicInfo.currentYear).toBeDefined()
      
      // Verify application statistics
      expect(response.body.data.student.applicationStatistics).toBeDefined()
      expect(response.body.data.student.applicationStatistics.total).toBeDefined()
      expect(response.body.data.student.applicationStatistics.byStatus).toBeDefined()
      
      // Verify job preferences
      expect(response.body.data.student.jobPreferences).toBeDefined()
      
      // Verify application history
      expect(response.body.data.applicationHistory).toBeInstanceOf(Array)
      
      // Verify interested jobs
      expect(response.body.data.interestedJobs).toBeInstanceOf(Array)
    })

    test('should not include sensitive data', async () => {
      const studentId = testStudents[0].student.id

      const response = await request(app)
        .get(`/api/professor/students/${studentId}`)
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      
      // Check that sensitive fields are NOT present
      const responseStr = JSON.stringify(response.body)
      expect(responseStr).not.toContain('password')
      expect(responseStr).not.toContain('refreshToken')
      
      // Document keys should be booleans, not the actual keys
      expect(response.body.data.student.academicInfo.hasResume).toBeDefined()
      expect(typeof response.body.data.student.academicInfo.hasResume).toBe('boolean')
      expect(responseStr).not.toContain('resumeKey')
    })

    test('should include application history sorted by date', async () => {
      const studentId = testStudents[0].student.id

      const response = await request(app)
        .get(`/api/professor/students/${studentId}`)
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      const history = response.body.data.applicationHistory
      
      if (history.length > 1) {
        // Check applications are sorted descending by date
        for (let i = 0; i < history.length - 1; i++) {
          const date1 = new Date(history[i].appliedAt)
          const date2 = new Date(history[i + 1].appliedAt)
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
        }
      }
    })

    test('should return 404 for non-existent student', async () => {
      const fakeId = 'nonexistent123'

      const response = await request(app)
        .get(`/api/professor/students/${fakeId}`)
        .set('Cookie', [`accessToken=${professorToken}`])
        .expect(404)

      expect(response.body.success).toBe(false)
    })

    test('should return 403 for non-professor/admin users', async () => {
      const studentId = testStudents[0].student.id

      const response = await request(app)
        .get(`/api/professor/students/${studentId}`)
        .set('Cookie', [`accessToken=${studentToken}`])
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })
})
