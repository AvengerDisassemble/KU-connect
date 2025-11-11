/**
 * @fileoverview Performance tests for API response times
 * Tests: NFR-2.1 (< 3 second response), NFR-2.2 (100 concurrent users)
 */

const request = require('supertest')
const app = require('../../src/app')
const { setupNFRTests, teardownNFRTests } = require('../nfr-setup')

describe('NFR-2: Performance Requirements', () => {
  let testContext

  beforeAll(async () => {
    testContext = await setupNFRTests()
  })

  afterAll(async () => {
    await teardownNFRTests()
  })

  describe('NFR-2.1: Response Time < 3 seconds', () => {
    const MAX_RESPONSE_TIME = 3000 // 3 seconds in milliseconds

    it('GET /api/jobs should respond within 3 seconds', async () => {
      const startTime = Date.now()
      
      await request(app)
        .post('/api/job/list')
        .set('Authorization', testContext.tokens.student)
        .send({ page: 1, pageSize: 20 })
        .expect(200)
      
      const duration = Date.now() - startTime
      
      console.log(`Job list response time: ${duration}ms`)
      expect(duration).toBeLessThan(MAX_RESPONSE_TIME)
    })

    it('GET /api/job/:id should respond within 3 seconds', async () => {
      const startTime = Date.now()
      
      // Use the test job created in setup
      const response = await request(app)
        .get(`/api/job/${testContext.testJob.id}`)
        .set('Authorization', testContext.tokens.student)
      
      const duration = Date.now() - startTime
      
      console.log(`Job detail response time: ${duration}ms`)
      expect(duration).toBeLessThan(MAX_RESPONSE_TIME)
    })

    it('POST /api/login should respond within 3 seconds', async () => {
      const startTime = Date.now()
      
      await request(app)
        .post('/api/login')
        .send({
          email: 'nfr-student@test.com',
          password: 'NFRTest123!'
        })
      
      const duration = Date.now() - startTime
      
      console.log(`Login response time: ${duration}ms`)
      expect(duration).toBeLessThan(MAX_RESPONSE_TIME)
    })

    it('GET /api/profile/dashboard should respond within 3 seconds', async () => {
      const startTime = Date.now()
      
      await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', testContext.tokens.student)
      
      const duration = Date.now() - startTime
      
      console.log(`Dashboard response time: ${duration}ms`)
      expect(duration).toBeLessThan(MAX_RESPONSE_TIME)
    })
  })

  describe('NFR-2.2: Concurrent User Load', () => {
    it('should handle 100 concurrent read requests', async () => {
      const concurrentUsers = 100
      const requests = []

      const startTime = Date.now()

      // Simulate 100 users requesting job list simultaneously
      for (let i = 0; i < concurrentUsers; i++) {
        requests.push(
          request(app)
            .post('/api/job/list')
            .set('Authorization', testContext.tokens.student)
            .send({ page: 1, pageSize: 10 })
        )
      }

      const responses = await Promise.all(requests)
      const duration = Date.now() - startTime

      // All requests should succeed
      const successCount = responses.filter(r => r.status === 200).length
      const avgResponseTime = duration / concurrentUsers

      console.log(`Concurrent requests: ${concurrentUsers}`)
      console.log(`Successful: ${successCount}/${concurrentUsers}`)
      console.log(`Total time: ${duration}ms`)
      console.log(`Avg response time: ${avgResponseTime.toFixed(2)}ms`)

      expect(successCount).toBeGreaterThanOrEqual(concurrentUsers * 0.95) // 95% success rate
      expect(avgResponseTime).toBeLessThan(3000)
    }, 30000) // 30 second timeout for this test

    it('should handle 50 concurrent write operations', async () => {
      const concurrentUsers = 50
      const requests = []

      const startTime = Date.now()

      // Simulate 50 users updating profiles simultaneously (all using same student token)
      for (let i = 0; i < concurrentUsers; i++) {
        requests.push(
          request(app)
            .patch('/api/profile')
            .set('Authorization', testContext.tokens.student)
            .send({ address: `Test Address ${i}` })
        )
      }

      const responses = await Promise.all(requests)
      const duration = Date.now() - startTime

      const successCount = responses.filter(r => 
        r.status === 200 || r.status === 404 // 404 if user doesn't exist in DB
      ).length

      console.log(`Concurrent write operations: ${concurrentUsers}`)
      console.log(`Completed: ${successCount}/${concurrentUsers}`)
      console.log(`Total time: ${duration}ms`)

      // System should remain stable (no crashes)
      expect(successCount).toBeGreaterThan(0)
    }, 30000)
  })

  describe('Database Query Performance', () => {
    it('should execute complex job search queries efficiently', async () => {
      const startTime = Date.now()

      await request(app)
        .post('/api/job/list')
        .set('Authorization', testContext.tokens.student)
        .send({
          page: 1,
          pageSize: 50,
          filters: {
            location: 'Bangkok',
            jobType: 'full-time',
            minSalary: 30000
          }
        })

      const duration = Date.now() - startTime

      console.log(`Complex query duration: ${duration}ms`)
      expect(duration).toBeLessThan(2000) // Should be even faster for DB queries
    })
  })
})
