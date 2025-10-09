/**
 * @fileoverview Integration tests for Profile routes (Express + SQLite + Supertest)
 */

const request = require('supertest')
const prisma = require('../../../../src/models/prisma')
const express = require('express')

jest.setTimeout(30000)

let app

async function cleanDb() {
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;')
  const tables = await prisma.$queryRawUnsafe(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('_prisma_migrations')
  `)
  for (const { name } of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`)
  }
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;')
}

describe('Profile routes (integration)', () => {
  describe('GET /api/profile/:userId', () => {
    it('should return 200 with correct profile', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'student@test.com',
          name: 'Stu',
          surname: 'Dent',
          username: 'stu',
          password: 'pass',
          student: {
            create: {
              degreeType: { name: 'Bachelor' },
              address: 'Dorm',
              gpa: 3.4
            }
          }
        },
        include: { student: true }
      })

      const res = await request(app).get(`/api/profile/${user.id}`).expect(200)
      expect(res.body.data).toEqual(expect.objectContaining({ id: user.id }))
    })

    it('should return 404 if not found', async () => {
      const res = await request(app).get('/api/profile/99999').expect(404)
      expect(res.body.data.message).toMatch(/not found/i)
    })
  })

  describe('GET /api/profile', () => {
    it('should return 200 with list of profiles', async () => {
      await prisma.user.create({
        data: {
          email: 'a@a.com',
          name: 'A',
          surname: 'A',
          username: 'a',
          password: 'pw',
          student: {
            create: {
              degreeType: { name: 'Master' },
              address: 'Home',
              gpa: 3.0
            }
          }
        }
      })
      await prisma.user.create({
        data: {
          email: 'b@b.com',
          name: 'B',
          surname: 'B',
          username: 'b',
          password: 'pw',
          hr: {
            create: {
              companyName: 'Beta Co',
              industry: 'IT_SOFTWARE',
              companySize: 'ONE_TO_TEN',
              address: 'HQ'
            }
          }
        }
      })

      const res = await request(app).get('/api/profile').expect(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('PATCH /api/profile', () => {
    it('should update student profile successfully', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'patch@test.com',
          name: 'Patch',
          surname: 'Me',
          username: 'patch',
          password: 'pw',
          student: {
            create: {
              degreeType: { connect: { name: 'Unknown' } },
              gpa: 2.5,
              address: 'Dorm'
            }
          }
        }
      })

      const res = await request(app)
        .patch('/api/profile')
        .send({ userId: user.id, role: 'STUDENT', updates: { gpa: 3.2 } })
        .expect(200)

      expect(res.body.data.student.gpa).toBe(3.2)
    })

    it('should update employer profile successfully', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'hr@test.com',
          name: 'HR',
          surname: 'Person',
          username: 'hr',
          password: 'pw',
          hr: {
            create: {
              companyName: 'ACME',
              industry: 'IT_SERVICES',
              companySize: 'ONE_TO_TEN',
              address: 'HQ'
            }
          }
        }
      })

      const res = await request(app)
        .patch('/api/profile')
        .send({ userId: user.id, role: 'EMPLOYER', updates: { companyName: 'ACME New' } })
        .expect(200)

      expect(res.body.data.hr.companyName).toBe('ACME New')
    })

    it('should return 400 for invalid payload', async () => {
      const res = await request(app).patch('/api/profile').send({}).expect(400)
      expect(res.body.data.message).toMatch(/invalid|required/i)
    })

    it('should return 404 when profile not found', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .send({ userId: 99999, role: 'STUDENT', updates: { gpa: 4.0 } })
        .expect(404)
      expect(res.body.data.message).toMatch(/not found/i)
    })
  })
})