/**
 * @fileoverview Unit tests for jobReportService (Prisma mocked)
 * @module tests/models/jobReport.service.test
 *
 * @why
 * Verify report creation constraints:
 * - cannot report own job
 * - duplicate report protection
 * - proper include shapes for listing
 */

jest.mock('../../../src/models/prisma', () => ({
  job: { findUnique: jest.fn() },
  jobReport: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn()
  },
  $transaction: jest.fn(fn => fn(require('../../../src/models/prisma')))
}))

const prisma = require('../../../src/models/prisma')
const jobReportService = require('../../../src/services/jobReportService.js')

describe('jobReportService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * @test createReport(): happy path
   */
  test('createReport creates successfully', async () => {
    prisma.job.findUnique.mockResolvedValue({ 
      id: 'job5', 
      hrId: 'hr100',
      hr: { userId: 'user100' }
    })
    prisma.jobReport.findFirst.mockResolvedValue(null)
    prisma.jobReport.create.mockResolvedValue({ id: 'report77', jobId: 'job5', userId: 'user2' })

    const res = await jobReportService.createReport('user2', 'job5', 'spam')
    expect(prisma.jobReport.create).toHaveBeenCalledWith({
      data: { userId: 'user2', jobId: 'job5', reason: 'spam' }
    })
    expect(res.id).toBe('report77')
  })

  test('createReport throws JOB_NOT_FOUND', async () => {
    prisma.job.findUnique.mockResolvedValue(null)

    await expect(jobReportService.createReport('user2', 'job5', 'spam'))
      .rejects.toMatchObject({ code: 'JOB_NOT_FOUND' })
  })

  test('createReport throws DUPLICATE_REPORT', async () => {
    prisma.job.findUnique.mockResolvedValue({ 
      id: 'job5', 
      hrId: 'hr100',
      hr: { userId: 'user100' }
    })
    prisma.jobReport.findFirst.mockResolvedValue({ id: 'report90' })

    await expect(jobReportService.createReport('user2', 'job5', 'spam'))
      .rejects.toMatchObject({ code: 'DUPLICATE_REPORT' })
  })

  test('createReport forbids owner (HR) reporting own job', async () => {
    prisma.job.findUnique.mockResolvedValue({ 
      id: 'job5', 
      hrId: 'hr10',
      hr: { userId: 'user99' }
    })
    
    await expect(jobReportService.createReport('user99', 'job5', 'bad'))
      .rejects.toMatchObject({ code: 'OWNER_REPORT' })
  })

  /**
   * @test listReports(): returns with includes
   */
  test('listReports returns reports with job and user', async () => {
    prisma.jobReport.findMany.mockResolvedValue([
      { id: 'report1' }, 
      { id: 'report2' }
    ])
    const rows = await jobReportService.listReports()
    expect(prisma.jobReport.findMany).toHaveBeenCalledWith({
      include: {
        job: { include: { hr: true } },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })
    expect(rows).toHaveLength(2)
  })

  /**
   * @test deleteReport(): ok + not found
   */
  test('deleteReport deletes successfully', async () => {
    prisma.jobReport.delete.mockResolvedValue({ 
      id: 'report10',
      job: { id: 'job1', title: 'Test Job' },
      user: { id: 'user1', email: 'test@test.com' }
    })
    const res = await jobReportService.deleteReport('report10')
    expect(prisma.jobReport.delete).toHaveBeenCalledWith({ 
      where: { id: 'report10' },
      include: {
        job: { include: { hr: true } },
        user: true
      }
    })
    expect(res.id).toBe('report10')
  })

  test('deleteReport throws on not found', async () => {
    prisma.jobReport.delete.mockRejectedValue(
      Object.assign(new Error('Record not found'), { code: 'P2025' })
    )
    await expect(jobReportService.deleteReport('report999')).rejects.toThrow()
  })

  /**
   * @test isJobOwnedByHr(): true/false
   */
  test('isJobOwnedByHr returns true for owner', async () => {
    prisma.job.findUnique.mockResolvedValue({ id: 'job1', hrId: 'hr7' })
    const ok = await jobReportService.isJobOwnedByHr('job1', 'hr7')
    expect(ok).toBe(true)
  })

  test('isJobOwnedByHr returns false otherwise', async () => {
    prisma.job.findUnique.mockResolvedValue({ id: 'job1', hrId: 'hr7' })
    const ok = await jobReportService.isJobOwnedByHr('job1', 'hr99')
    expect(ok).toBe(false)
  })

  test('isJobOwnedByHr returns false when job not found', async () => {
    prisma.job.findUnique.mockResolvedValue(null)
    const ok = await jobReportService.isJobOwnedByHr('nonexistent', 'hr7')
    expect(ok).toBeFalsy() // Service returns null (falsy) when job not found
  })

  /**
   * @test isJobOwnedByUser(): true/false
   */
  test('isJobOwnedByUser returns true for owner', async () => {
    prisma.job.findUnique.mockResolvedValue({ 
      id: 'job1', 
      hrId: 'hr7',
      hr: { userId: 'user123' }
    })
    const ok = await jobReportService.isJobOwnedByUser('job1', 'user123')
    expect(ok).toBe(true)
  })

  test('isJobOwnedByUser returns false otherwise', async () => {
    prisma.job.findUnique.mockResolvedValue({ 
      id: 'job1', 
      hrId: 'hr7',
      hr: { userId: 'user123' }
    })
    const ok = await jobReportService.isJobOwnedByUser('job1', 'user999')
    expect(ok).toBe(false)
  })

  test('isJobOwnedByUser returns false when job not found', async () => {
    prisma.job.findUnique.mockResolvedValue(null)
    const ok = await jobReportService.isJobOwnedByUser('nonexistent', 'user123')
    expect(ok).toBeFalsy() // Service returns null (falsy) when job not found
  })
})
