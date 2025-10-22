/**
 * @fileoverview Integration tests for Degree routes
 * @module tests/routes/degree/index
 */

const request = require('supertest')
const prisma = require('../../../../src/models/prisma')
const app = require('../../../../src/app')
const { TEST_DEGREE_TYPES } = require('../../utils/testHelpers')

describe('Degree Routes', () => {
  /**
   * Setup test data before all tests
   */
  beforeAll(async () => {
    // Ensure at least one degree type exists
    await prisma.degreeType.upsert({
      where: { name: TEST_DEGREE_TYPES.BACHELOR },
      update: {},
      create: { name: TEST_DEGREE_TYPES.BACHELOR }
    })

    await prisma.degreeType.upsert({
      where: { name: TEST_DEGREE_TYPES.MASTER },
      update: {},
      create: { name: TEST_DEGREE_TYPES.MASTER }
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // ───────────────────────────────
  // GET /api/degree
  // ───────────────────────────────
  describe('GET /api/degree', () => {
    it('should return all degree types without authentication', async () => {
      const res = await request(app)
        .get('/api/degree')
        // Note: No Authorization header - this should work without auth

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Degree types retrieved successfully')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(2)
      
      // Verify structure of degree types
      const degreeType = res.body.data[0]
      expect(degreeType).toHaveProperty('id')
      expect(degreeType).toHaveProperty('name')
    })

    it('should work even when called multiple times (idempotent)', async () => {
      const res1 = await request(app).get('/api/degree')
      const res2 = await request(app).get('/api/degree')

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
      expect(res1.body.data).toEqual(res2.body.data)
    })
  })
})
