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

const { jest } = require('@jest/globals')

jest.mock('../../../src/models/prisma', () => {
  const m = {
    job: { findUnique: jest.fn() },
    jobReport: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn()
    },
    $transaction: jest.fn(fn => fn(m))
  }
  return m
})

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
    prisma.job.findUnique.mockResolvedValue({ id: 5, hrId: 100 })
    prisma.jobReport.findFirst.mockResolvedValue(null)
    prisma.jobReport.create.mockResolvedValue({ id: 77, jobId: 5, userId: 2 })

    const res = await jobReportService.createReport(2, 5, 'spam')
    expect(prisma.jobReport.create).toHaveBeenCalledWith({
      data: { userId: 2, jobId: 5, reason: 'spam' }
    })
    expect(res.id).toBe(77)
  })

  test('createReport throws JOB_NOT_FOUND', async () => {
    prisma.job.findUnique.mockResolvedValue(null)

    await expect(jobReportService.createReport(2, 5, 'spam'))
      .rejects.toMatchObject({ code: 'JOB_NOT_FOUND', status: 404 })
  })

  test('createReport throws DUPLICATE_REPORT', async () => {
    prisma.job.findUnique.mockResolvedValue({ id: 5, hrId: 100 })
    prisma.jobReport.findFirst.mockResolvedValue({ id: 90 })

    await expect(jobReportService.createReport(2, 5, 'spam'))
      .rejects.toMatchObject({ code: 'DUPLICATE_REPORT', status: 400 })
  })

  test('createReport forbids owner (HR) reporting own job', async () => {
    prisma.job.findUnique.mockResolvedValue({ id: 5, hrId: 10 })
    // service should call a helper to check ownership before allowing report
    await expect(jobReportService.createReport(
      /* userId */ 99,
      /* jobId */ 5,
      /* reason */ 'bad'
    , { actor: { role: 'EMPLOYER', hrId: 10 } }))
      .rejects.toMatchObject({ status: 403 })
  })

  /**
   * @test listReports(): returns with includes
   */
  test('listReports returns reports with job and user', async () => {
    prisma.jobReport.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
    const rows = await jobReportService.listReports()
    expect(prisma.jobReport.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { id: true, title: true, companyName: true } },
        user: { select: { id: true, email: true, role: true } }
      }
    })
    expect(rows).toHaveLength(2)
  })

  /**
   * @test deleteReport(): ok + not found
   */
  test('deleteReport deletes successfully', async () => {
    prisma.jobReport.delete.mockResolvedValue({ id: 10 })
    const res = await jobReportService.deleteReport(10)
    expect(prisma.jobReport.delete).toHaveBeenCalledWith({ where: { id: 10 } })
    expect(res.id).toBe(10)
  })

  test('deleteReport returns null if not found', async () => {
    prisma.jobReport.delete.mockRejectedValue(
      Object.assign(new Error('Record not found'), { code: 'P2025' })
    )
    const res = await jobReportService.deleteReport(999)
    expect(res).toBeNull()
  })

  /**
   * @test isJobOwnedByHr(): true/false
   */
  test('isJobOwnedByHr returns true for owner', async () => {
    prisma.job.findUnique.mockResolvedValue({ id: 1, hrId: 7 })
    const ok = await jobReportService.isJobOwnedByHr(1, 7)
    expect(ok).toBe(true)
  })

  test('isJobOwnedByHr returns false otherwise', async () => {
    prisma.job.findUnique.mockResolvedValue({ id: 1, hrId: 7 })
    const ok = await jobReportService.isJobOwnedByHr(1, 99)
    expect(ok).toBe(false)
  })
})
