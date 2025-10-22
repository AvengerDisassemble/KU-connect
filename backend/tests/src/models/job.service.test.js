/**
 * @fileoverview Unit tests for jobService (business logic, Prisma mocked)
 * @module tests/models/job.service.test
 */

jest.mock('../../../src/models/prisma', () => ({
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
  resume: {
    create: jest.fn()
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
}))

// Import service and prisma mock after mocks
const jobService = require('../../../src/services/jobService.js')
const prisma = require('../../../src/models/prisma')

describe('jobService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listJobs()', () => {
    it('returns paginated jobs', async () => {
      prisma.job.count.mockResolvedValue(12)
      prisma.job.findMany.mockResolvedValue([{ id: 'job1' }, { id: 'job2' }])

      const result = await jobService.listJobs({ page: 2, limit: 2, keyword: 'developer' })
      expect(prisma.job.count).toHaveBeenCalled()
      expect(prisma.job.findMany).toHaveBeenCalled()
      expect(result.total).toBe(12)
      expect(result.items).toHaveLength(2)
    })
  })

  describe('getJobById()', () => {
    it('returns job when found', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job10', title: 'Backend Dev' })
      const job = await jobService.getJobById('job10')
      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: 'job10' },
        include: expect.any(Object)
      })
      expect(job.title).toBe('Backend Dev')
    })

    it('returns null when job not found', async () => {
      prisma.job.findUnique.mockResolvedValue(null)
      const job = await jobService.getJobById('nonexistent')
      expect(job).toBeNull()
    })
  })

  describe('createJob()', () => {
    it('creates a job for HR owner', async () => {
      prisma.hR.findUnique.mockResolvedValue({ companyName: 'Acme' })
      prisma.job.create.mockResolvedValue({ id: 'job1', title: 'Intern' })

      const data = { 
        title: 'Intern', 
        description: 'Write code', 
        location: 'BKK',
        jobType: 'internship',
        workArrangement: 'on-site',
        duration: '3-month',
        minSalary: 15000,
        maxSalary: 20000,
        application_deadline: new Date(),
        phone_number: '+66812345678',
        requirements: [],
        qualifications: [],
        responsibilities: [],
        benefits: [],
        tags: []
      }
      const result = await jobService.createJob('hr5', data)

      expect(prisma.hR.findUnique).toHaveBeenCalledWith({
        where: { id: 'hr5' },
        select: { companyName: true }
      })
      expect(prisma.job.create).toHaveBeenCalled()
      expect(result.id).toBe('job1')
    })

    it('throws 404 if HR not found', async () => {
      prisma.hR.findUnique.mockResolvedValue(null)
      await expect(jobService.createJob('nonexistent', {})).rejects.toMatchObject({ status: 404 })
    })
  })

  describe('updateJob()', () => {
    it('updates a job owned by HR', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job2', hrId: 'hr10' })
      prisma.job.update.mockResolvedValue({ id: 'job2', title: 'Updated' })
      prisma.$transaction.mockResolvedValue([{ id: 'job2', title: 'Updated' }])

      const data = { title: 'Updated' }
      const result = await jobService.updateJob('job2', 'hr10', data)
      expect(prisma.job.findUnique).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('throws 403 when HR not owner', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job2', hrId: 'hr11' })
      await expect(jobService.updateJob('job2', 'hr99', {})).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('deleteJob()', () => {
    it('allows ADMIN to delete any job', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job3', hrId: 'hr1' })
      prisma.job.delete.mockResolvedValue({ id: 'job3' })
      const result = await jobService.deleteJob('job3', { role: 'ADMIN' })
      expect(prisma.job.delete).toHaveBeenCalledWith({ 
        where: { id: 'job3' },
        include: { hr: true, tags: true }
      })
      expect(result.id).toBe('job3')
    })

    it('allows HR owner to delete their own job', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job4', hrId: 'hr9' })
      prisma.job.delete.mockResolvedValue({ id: 'job4' })
      const result = await jobService.deleteJob('job4', { role: 'EMPLOYER', hr: { id: 'hr9' } })
      expect(result.id).toBe('job4')
    })

    it('throws 403 when HR tries to delete another HR\'s job', async () => {
      // HR2 trying to delete HR1's job should fail
      prisma.job.findUnique.mockResolvedValue({ id: 'job5', hrId: 'hr1' })
      await expect(
        jobService.deleteJob('job5', { role: 'EMPLOYER', hr: { id: 'hr2' } })
      ).rejects.toMatchObject({ 
        status: 403,
        message: 'You are not authorized to delete this job'
      })
    })

    it('throws 403 for non-admin non-employer roles', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job6', hrId: 'hr1' })
      await expect(jobService.deleteJob('job6', { role: 'STUDENT' })).rejects.toMatchObject({ status: 403 })
    })

    it('throws 404 if job not found', async () => {
      prisma.job.findUnique.mockResolvedValue(null)
      await expect(jobService.deleteJob('nonexistent', { role: 'ADMIN' })).rejects.toMatchObject({ status: 404 })
    })
  })

  describe('applyToJob()', () => {
    it('creates new application when not existing', async () => {
      prisma.resume.create.mockResolvedValue({ id: 'resume1', link: 'resume.pdf' })
      prisma.application.create.mockResolvedValue({ id: 'app10', jobId: 'job5', studentId: 'student7' })
      
      const result = await jobService.applyToJob('job5', 'student7', 'resume.pdf')
      
      expect(prisma.resume.create).toHaveBeenCalledWith({
        data: { studentId: 'student7', link: 'resume.pdf' }
      })
      expect(prisma.application.create).toHaveBeenCalledWith({
        data: { jobId: 'job5', studentId: 'student7', resumeId: 'resume1' }
      })
      expect(result.id).toBe('app10')
    })

    it('throws 409 if already applied', async () => {
      prisma.resume.create.mockResolvedValue({ id: 'resume2', link: 'resume.pdf' })
      prisma.application.create.mockRejectedValue({ code: 'P2002' })
      await expect(jobService.applyToJob('job5', 'student7', 'resume.pdf')).rejects.toMatchObject({ status: 409 })
    })
  })

  describe('manageApplication()', () => {
    it('updates application status', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job6', hrId: 'hr2' })
      prisma.application.update.mockResolvedValue({ id: 'app1', status: 'QUALIFIED' })
      const result = await jobService.manageApplication('job6', 'hr2', 'app1', 'QUALIFIED')
      expect(result.status).toBe('QUALIFIED')
    })

    it('throws 403 when HR not owner', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job6', hrId: 'hr99' })
      await expect(jobService.manageApplication('job6', 'hr1', 'app1', 'QUALIFIED')).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('getApplicants()', () => {
    it('returns applicants for HR job', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job7', hrId: 'hr3' })
      prisma.application.findMany.mockResolvedValue([{ id: 'app1' }, { id: 'app2' }])
      const result = await jobService.getApplicants('job7', 'hr3')
      expect(result).toHaveLength(2)
    })

    it('throws 403 if HR not owner', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 'job7', hrId: 'hr9' })
      await expect(jobService.getApplicants('job7', 'hr3')).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('filterJobs()', () => {
    it('returns empty when no tags provided', async () => {
      const result = await jobService.filterJobs({})
      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(5)
      expect(prisma.job.findMany).not.toHaveBeenCalled()
      expect(prisma.job.count).not.toHaveBeenCalled()
    })

    it('returns empty when tags array is empty', async () => {
      const result = await jobService.filterJobs({ tags: [] })
      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
      expect(prisma.job.findMany).not.toHaveBeenCalled()
    })

    it('filters jobs by single tag', async () => {
      const mockJobs = [
        { id: 'job1', title: 'Backend Dev', tags: [{ name: 'backend' }] },
        { id: 'job2', title: 'API Developer', tags: [{ name: 'backend' }] }
      ]
      prisma.job.findMany.mockResolvedValue(mockJobs)
      prisma.job.count.mockResolvedValue(2)

      const result = await jobService.filterJobs({ tags: 'backend' })

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { tags: { some: { name: 'backend' } } }
          ]
        },
        take: 5,
        skip: 0,
        include: {
          tags: true,
          hr: true
        },
        orderBy: { createdAt: 'desc' }
      })
      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('filters jobs by multiple tags (comma-separated string)', async () => {
      const mockJobs = [{ id: 'job1' }, { id: 'job2' }, { id: 'job3' }]
      prisma.job.findMany.mockResolvedValue(mockJobs)
      prisma.job.count.mockResolvedValue(15)

      const result = await jobService.filterJobs({ tags: 'backend,frontend,fullstack' })

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { tags: { some: { name: 'backend' } } },
            { tags: { some: { name: 'frontend' } } },
            { tags: { some: { name: 'fullstack' } } }
          ]
        },
        take: 5,
        skip: 0,
        include: {
          tags: true,
          hr: true
        },
        orderBy: { createdAt: 'desc' }
      })
      expect(result.total).toBe(15)
    })

    it('filters jobs by multiple tags (array)', async () => {
      prisma.job.findMany.mockResolvedValue([{ id: 'job1' }])
      prisma.job.count.mockResolvedValue(1)

      await jobService.filterJobs({ tags: ['backend', 'api'] })

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { tags: { some: { name: 'backend' } } },
            { tags: { some: { name: 'api' } } }
          ]
        },
        take: 5,
        skip: 0,
        include: {
          tags: true,
          hr: true
        },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('normalizes tags to lowercase', async () => {
      prisma.job.findMany.mockResolvedValue([])
      prisma.job.count.mockResolvedValue(0)

      await jobService.filterJobs({ tags: 'BackEnd,FrontEnd,API' })

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { tags: { some: { name: 'backend' } } },
              { tags: { some: { name: 'frontend' } } },
              { tags: { some: { name: 'api' } } }
            ]
          }
        })
      )
    })

    it('removes duplicate tags', async () => {
      prisma.job.findMany.mockResolvedValue([])
      prisma.job.count.mockResolvedValue(0)

      await jobService.filterJobs({ tags: 'backend,Backend,BACKEND,frontend' })

      // Should only have 2 unique tags after normalization
      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { tags: { some: { name: 'backend' } } },
              { tags: { some: { name: 'frontend' } } }
            ]
          }
        })
      )
    })

    it('trims whitespace from tags', async () => {
      prisma.job.findMany.mockResolvedValue([])
      prisma.job.count.mockResolvedValue(0)

      await jobService.filterJobs({ tags: '  backend  ,  frontend  ' })

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { tags: { some: { name: 'backend' } } },
              { tags: { some: { name: 'frontend' } } }
            ]
          }
        })
      )
    })

    it('filters out empty/blank tags', async () => {
      prisma.job.findMany.mockResolvedValue([])
      prisma.job.count.mockResolvedValue(0)

      await jobService.filterJobs({ tags: 'backend,,  ,frontend' })

      // Should only have 2 tags (empty strings filtered out)
      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { tags: { some: { name: 'backend' } } },
              { tags: { some: { name: 'frontend' } } }
            ]
          }
        })
      )
    })

    it('handles pagination correctly', async () => {
      prisma.job.findMany.mockResolvedValue([{ id: 'job1' }])
      prisma.job.count.mockResolvedValue(25)

      const result = await jobService.filterJobs({ 
        tags: 'backend', 
        page: 3, 
        limit: 10 
      })

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20 // (page 3 - 1) * limit 10 = 20
        })
      )
      expect(result.page).toBe(3)
      expect(result.limit).toBe(10)
      expect(result.total).toBe(25)
    })

    it('defaults to limit 5 when limit is 0 or invalid', async () => {
      prisma.job.findMany.mockResolvedValue([])
      prisma.job.count.mockResolvedValue(0)

      await jobService.filterJobs({ tags: 'backend', limit: 0 })

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      )
    })

    it('clamps limit to maximum 50', async () => {
      prisma.job.findMany.mockResolvedValue([])
      prisma.job.count.mockResolvedValue(0)

      await jobService.filterJobs({ tags: 'backend', limit: 100 })

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      )
    })

    it('defaults to page 1 when page is less than 1', async () => {
      prisma.job.findMany.mockResolvedValue([])
      prisma.job.count.mockResolvedValue(0)

      const result = await jobService.filterJobs({ tags: 'backend', page: -5 })

      expect(result.page).toBe(1)
      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 })
      )
    })

    it('includes tags and hr in results', async () => {
      prisma.job.findMany.mockResolvedValue([])
      prisma.job.count.mockResolvedValue(0)

      await jobService.filterJobs({ tags: 'backend' })

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            tags: true,
            hr: true
          }
        })
      )
    })

    it('orders results by createdAt descending', async () => {
      prisma.job.findMany.mockResolvedValue([])
      prisma.job.count.mockResolvedValue(0)

      await jobService.filterJobs({ tags: 'backend' })

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      )
    })
  })
})
