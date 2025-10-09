/**
 * @fileoverview Unit tests for jobService (business logic, Prisma mocked)
 * @module tests/models/job.service.test
 */

const { jest } = require('@jest/globals')

/**
 * Mock prisma singleton before importing the service
 */
const prismaMock = {
  job: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  application: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  }
}

// mock the prisma module path used by your jobService
jest.unstable_mockModule('../../../src/models/prisma', () => ({
  default: prismaMock
}))

const jobService = await import('../../../src/services/job.service.js')

describe('jobService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listJobs()', () => {
    it('builds pagination args and filter, returns page of jobs', async () => {
      prismaMock.job.count.mockResolvedValue(12)
      prismaMock.job.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])

      const page = 2
      const pageSize = 2
      const filters = { q: 'engineer', location: 'Bangkok' }
      const result = await jobService.default.listJobs({ page, pageSize, filters })

      expect(prismaMock.job.count).toHaveBeenCalledWith({
        where: {
          AND: [
            { title: { contains: 'engineer', mode: 'insensitive' } },
            { location: { equals: 'Bangkok' } }
          ]
        }
      })
      expect(prismaMock.job.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { title: { contains: 'engineer', mode: 'insensitive' } },
            { location: { equals: 'Bangkok' } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: 2,
        take: 2
      })
      expect(result.total).toBe(12)
      expect(result.items).toHaveLength(2)
    })
  })

  describe('getJobById()', () => {
    it('returns job object when found', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 10, title: 'Dev' })
      const job = await jobService.default.getJobById(10)
      expect(prismaMock.job.findUnique).toHaveBeenCalledWith({
        where: { id: 10 }
      })
      expect(job.title).toBe('Dev')
    })

    it('returns null when not found', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null)
      const job = await jobService.default.getJobById(999)
      expect(job).toBeNull()
    })
  })

  describe('createJob()', () => {
    it('creates a job with HR owner and company name', async () => {
      prismaMock.job.create.mockResolvedValue({ id: 1, title: 'SWE' })
      const data = { title: 'SWE', description: 'Build things', location: 'BKK' }
      const result = await jobService.default.createJob({ hrId: 7, companyName: 'TestCorp', data })
      expect(prismaMock.job.create).toHaveBeenCalledWith({
        data: {
          ...data,
          hrId: 7,
          companyName: 'TestCorp'
        }
      })
      expect(result.id).toBe(1)
    })
  })

  describe('updateJob()', () => {
    it('allows HR owner to update their job', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 1, hrId: 9 })
      prismaMock.job.update.mockResolvedValue({ id: 1, title: 'New' })
      const body = { title: 'New' }

      const updated = await jobService.default.updateJob({ jobId: 1, actor: { role: 'EMPLOYER', hrId: 9 }, body })
      expect(prismaMock.job.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'New' }
      })
      expect(updated.title).toBe('New')
    })

    it('throws 403 when HR tries to update another HR job', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 1, hrId: 123 })
      const body = { title: 'Hack' }
      await expect(
        jobService.default.updateJob({ jobId: 1, actor: { role: 'EMPLOYER', hrId: 9 }, body })
      ).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('deleteJob()', () => {
    it('allows ADMIN to delete any job', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 3, hrId: 2 })
      prismaMock.job.delete.mockResolvedValue({ id: 3 })
      await jobService.default.deleteJob({ jobId: 3, actor: { role: 'ADMIN' } })
      expect(prismaMock.job.delete).toHaveBeenCalledWith({ where: { id: 3 } })
    })

    it('allows HR owner to delete their job', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 4, hrId: 88 })
      prismaMock.job.delete.mockResolvedValue({ id: 4 })
      await jobService.default.deleteJob({ jobId: 4, actor: { role: 'EMPLOYER', hrId: 88 } })
      expect(prismaMock.job.delete).toHaveBeenCalledWith({ where: { id: 4 } })
    })

    it('throws 403 when another HR attempts delete', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 4, hrId: 88 })
      await expect(
        jobService.default.deleteJob({ jobId: 4, actor: { role: 'EMPLOYER', hrId: 99 } })
      ).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('applyToJob()', () => {
    it('prevents duplicate application, returns conflict-like error', async () => {
      prismaMock.application.findFirst.mockResolvedValue({ id: 99 })
      await expect(
        jobService.default.applyToJob({ jobId: 5, studentId: 11, resumeUrl: 'r.pdf' })
      ).rejects.toMatchObject({ code: 'P2002' })
    })

    it('creates application once when not existing', async () => {
      prismaMock.application.findFirst.mockResolvedValue(null)
      prismaMock.application.create.mockResolvedValue({ id: 10, jobId: 5, studentId: 11 })
      const created = await jobService.default.applyToJob({ jobId: 5, studentId: 11, resumeUrl: 'r.pdf' })
      expect(prismaMock.application.create).toHaveBeenCalledWith({
        data: { jobId: 5, studentId: 11, resumeUrl: 'r.pdf', status: 'PENDING' }
      })
      expect(created.id).toBe(10)
    })
  })

  describe('manageApplication()', () => {
    it('updates application status', async () => {
      prismaMock.application.update.mockResolvedValue({ id: 1, status: 'QUALIFIED' })
      const result = await jobService.default.manageApplication({
        applicationId: 1,
        status: 'QUALIFIED'
      })
      expect(prismaMock.application.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'QUALIFIED' }
      })
      expect(result.status).toBe('QUALIFIED')
    })
  })

  describe('getApplicants()', () => {
    it('returns list of applicants for job', async () => {
      prismaMock.application.findMany.mockResolvedValue([
        { id: 1, studentId: 100 },
        { id: 2, studentId: 101 }
      ])
      const rows = await jobService.default.getApplicants({ jobId: 44 })
      expect(prismaMock.application.findMany).toHaveBeenCalledWith({
        where: { jobId: 44 },
        include: { student: true }
      })
      expect(Array.isArray(rows)).toBe(true)
      expect(rows).toHaveLength(2)
    })
  })
})
