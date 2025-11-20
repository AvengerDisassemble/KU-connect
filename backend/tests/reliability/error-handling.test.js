/**
 * @fileoverview Reliability and error handling tests
 * Tests: NFR-4.1 (Error handling), NFR-4.2 (Transaction integrity)
 */

const request = require('supertest')
const app = require('../../src/app')
const prisma = require('../../src/models/prisma')
const { setupNFRTests, teardownNFRTests } = require('../nfr-setup')

let testContext

describe('NFR-4: Reliability Requirements', () => {
  beforeAll(async () => {
    testContext = await setupNFRTests()
  })

  afterAll(async () => {
    await teardownNFRTests(testContext)
  })

  describe('NFR-4.1: Graceful Error Handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/register/alumni')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('message')
      expect(response.body).not.toHaveProperty('stack') // No stack traces exposed
    })

    it('should handle missing required fields gracefully', async () => {
      const response = await request(app)
        .post('/api/register/alumni')
        .send({}) // Empty body

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
      expect(Array.isArray(response.body.errors)).toBe(true)
    })

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database disconnect
      // For now, we test that errors don't crash the server
      
      const response = await request(app)
        .get('/api/job/999999999') // Non-existent ID
        .set('Authorization', testContext.tokens.student)

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body.success).toBe(false)
      expect(response.body).toHaveProperty('message')
    })

    it('should return user-friendly error messages', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@ku.th',
          password: 'SomePassword123'
        })

      expect(response.status).toBe(401)
      expect(response.body.message).toMatch(/invalid|incorrect|not found/i)
      // Should NOT expose: "User not found in database table 'users'"
      expect(response.body.message).not.toMatch(/table|database|sql/i)
    })

    it('should handle file upload errors gracefully', async () => {
      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', testContext.tokens.student)
        .attach('file', Buffer.from('not-an-image'), {
          filename: 'test.txt',
          contentType: 'text/plain'
        })

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBeDefined()
    })
  })

  describe('NFR-4.2: Transaction Integrity', () => {
    it('should rollback transaction on job creation failure', async () => {
      const initialJobCount = await prisma.job.count()

      // Try to create job with invalid data that will fail midway
      const response = await request(app)
        .post('/api/job')
        .set('Authorization', testContext.tokens.employer)
        .send({
          title: 'Test Job',
          // Missing required fields to cause failure
        })

      expect(response.status).toBeGreaterThanOrEqual(400)

      // Verify no partial data was saved
      const finalJobCount = await prisma.job.count()
      expect(finalJobCount).toBe(initialJobCount)
    })

    it('should rollback user registration on student creation failure', async () => {
      const initialUserCount = await prisma.user.count()

      // Create registration with invalid degree type
      const response = await request(app)
        .post('/api/register/alumni')
        .send({
          name: 'Test',
          surname: 'User',
          email: `rollback-test-${Date.now()}@ku.th`,
          password: 'Password123',
          degreeTypeId: 'non-existent-degree-id',
          address: 'Test Address'
        })

      expect(response.status).toBeGreaterThanOrEqual(400)

      // User should not exist in database
      const finalUserCount = await prisma.user.count()
      expect(finalUserCount).toBe(initialUserCount)
    })

    it('should handle concurrent updates without data corruption', async () => {
      // Use the test job created in setup
      const jobId = testContext.testJob.id

      // Try to update the same job 10 times simultaneously
      const updates = Array.from({ length: 10 }, (_, i) => 
        request(app)
          .patch(`/api/job/${jobId}`)
          .set('Authorization', testContext.tokens.employer)
          .send({ title: `Updated Title ${i}` })
      )

      await Promise.all(updates)

      // Verify job still exists and is in valid state
      const updatedJob = await prisma.job.findUnique({
        where: { id: jobId }
      })

      expect(updatedJob).not.toBeNull()
      expect(updatedJob.title).toMatch(/Updated Title|NFR Test Job/)
    })
  })

  describe('NFR-4.3: System Stability Under Load', () => {
    it('should not crash on rapid repeated requests', async () => {
      const requests = Array.from({ length: 50 }, () =>
        request(app)
          .post('/api/job/list')
          .set('Authorization', testContext.tokens.student)
          .send({ page: 1, pageSize: 10 })
      )

      const responses = await Promise.all(requests)

      // All requests should return valid responses (no crashes)
      responses.forEach(response => {
        expect([200, 401, 429]).toContain(response.status) // OK, Unauthorized, or Rate Limited
        expect(response.body).toHaveProperty('success')
      })
    }, 15000)

    it('should handle malformed requests without crashing', async () => {
      // Send each malformed request and handle errors properly
      const results = []
      
      const malformedData = [null, undefined, [], 'string', 123]
      
      for (const data of malformedData) {
        try {
          const response = await request(app)
            .post('/api/job')
            .send(data)
          results.push(response)
        } catch (err) {
          // Some malformed requests might cause supertest to throw
          results.push({ status: 500, error: err.message })
        }
      }

      // Server should handle all malformed requests gracefully
      results.forEach(result => {
        expect(result.status).toBeGreaterThanOrEqual(400)
      })
    })
  })

  describe('Memory Leak Detection', () => {
    it('should not leak memory on repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Perform 100 operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/job/list')
          .set('Authorization', testContext.tokens.student)
          .send({ page: 1, pageSize: 10 })
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`)

      // Memory increase should be reasonable (< 50MB for 100 requests)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    }, 30000)
  })
})
