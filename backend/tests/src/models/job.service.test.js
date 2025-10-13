/**
 * @fileoverview Unit tests for jobService (business logic, Prisma mocked)
 * @module tests/models/job.service.test
 */

const { jest } = require('@jest/globals')

/**
 * Mock Prisma singleton (partial)
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
  hR: {
    findUnique: jest.fn()
  },
  requirement: {
    deleteMany: jest.fn(),
    createMany: jest.fn()
  },
  qualification: {
    deleteMany: jest.fn(),
    createMany: jest.fn()
  },
  responsibility: {
    deleteMany: jest.fn(),
    createMany: jest.fn()
  },
  benefit: {
    deleteMany: jest.fn(),
    createMany: jest.fn()
  },
  tag: {
    findMany: jest.fn(),
    create: jest.fn()
  },
  $transaction: jest.fn(async (tx) => Promise.all(tx))
}

jest.unstable_mockModule('../../../src/models/prisma', () => ({
  default: prismaMock
}))

// Import service after mocks
const jobService = (await import('../../../src/services/jobService.js')).default ?? (await import('../../../src/services/jobService.js'))

describe('jobService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listJobs()', () => {
    it('returns paginated jobs', async () => {
      prismaMock.job.count.mockResolvedValue(12)
      prismaMock.job.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])

      const result = await jobService.listJobs({ page: 2, limit: 2, keyword: 'developer' })
      expect(prismaMock.job.count).toHaveBeenCalled()
      expect(prismaMock.job.findMany).toHaveBeenCalled()
      expect(result.total).toBe(12)
      expect(result.items).toHaveLength(2)
    })
  })

  describe('getJobById()', () => {
    it('returns job when found', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 10, title: 'Backend Dev' })
      const job = await jobService.getJobById(10)
      expect(prismaMock.job.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
        include: expect.any(Object)
      })
      expect(job.title).toBe('Backend Dev')
    })

    it('returns null when job not found', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null)
      const job = await jobService.getJobById(999)
      expect(job).toBeNull()
    })
  })

  describe('createJob()', () => {
    it('creates a job for HR owner', async () => {
      prismaMock.hR.findUnique.mockResolvedValue({ companyName: 'Acme' })
      prismaMock.job.create.mockResolvedValue({ id: 1, title: 'Intern' })

      const data = { title: 'Intern', description: 'Write code', location: 'BKK' }
      const result = await jobService.createJob(5, data)

      expect(prismaMock.hR.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
        select: { companyName: true }
      })
      expect(prismaMock.job.create).toHaveBeenCalled()
      expect(result.id).toBe(1)
    })

    it('throws 404 if HR not found', async () => {
      prismaMock.hR.findUnique.mockResolvedValue(null)
      await expect(jobService.createJob(999, {})).rejects.toMatchObject({ status: 404 })
    })
  })

  describe('updateJob()', () => {
    it('updates a job owned by HR', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 2, hrId: 10 })
      prismaMock.job.update.mockResolvedValue({ id: 2, title: 'Updated' })
      prismaMock.$transaction.mockResolvedValue([])

      const data = { title: 'Updated' }
      const result = await jobService.updateJob(2, 10, data)
      expect(prismaMock.job.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('throws 403 when HR not owner', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 2, hrId: 11 })
      await expect(jobService.updateJob(2, 99, {})).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('deleteJob()', () => {
    it('allows ADMIN to delete any job', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 3, hrId: 1 })
      prismaMock.job.delete.mockResolvedValue({ id: 3 })
      const result = await jobService.deleteJob(3, { role: 'ADMIN' })
      expect(prismaMock.job.delete).toHaveBeenCalledWith({ where: { id: 3 } })
      expect(result.id).toBe(3)
    })

    it('allows HR owner to delete their own job', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 4, hrId: 9 })
      prismaMock.job.delete.mockResolvedValue({ id: 4 })
      const result = await jobService.deleteJob(4, { role: 'EMPLOYER', hrId: 9 })
      expect(result.id).toBe(4)
    })

    it('throws 403 if HR not owner', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 5, hrId: 1 })
      await expect(jobService.deleteJob(5, { role: 'EMPLOYER', hrId: 2 })).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('applyToJob()', () => {
    it('creates new application when not existing', async () => {
      prismaMock.application.findFirst.mockResolvedValue(null)
      prismaMock.application.create.mockResolvedValue({ id: 10 })
      const result = await jobService.applyToJob(5, 7, 'resume.pdf')
      expect(prismaMock.application.create).toHaveBeenCalled()
      expect(result.id).toBe(10)
    })

    it('throws 409 if already applied', async () => {
      prismaMock.application.create.mockRejectedValue({ code: 'P2002' })
      await expect(jobService.applyToJob(5, 7, 'resume.pdf')).rejects.toMatchObject({ status: 409 })
    })
  })

  describe('manageApplication()', () => {
    it('updates application status', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 6, hrId: 2 })
      prismaMock.application.update.mockResolvedValue({ id: 1, status: 'QUALIFIED' })
      const result = await jobService.manageApplication(6, 2, 1, 'QUALIFIED')
      expect(result.status).toBe('QUALIFIED')
    })

    it('throws 403 when HR not owner', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 6, hrId: 99 })
      await expect(jobService.manageApplication(6, 1, 1, 'QUALIFIED')).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('getApplicants()', () => {
    it('returns applicants for HR job', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 7, hrId: 3 })
      prismaMock.application.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
      const result = await jobService.getApplicants(7, 3)
      expect(result).toHaveLength(2)
    })

    it('throws 403 if HR not owner', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 7, hrId: 9 })
      await expect(jobService.getApplicants(7, 3)).rejects.toMatchObject({ status: 403 })
    })
  })
})
