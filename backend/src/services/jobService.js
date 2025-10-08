/**
 * @module services/jobService
 * @description Business logic for Job Posting feature using Prisma
 */

const prisma = require('../models/prisma')

/**
 * Builds a Prisma where clause from filters
 * Why: normalize inputs to avoid runtime errors and support flexible search
 * @param {object} filters
 * @returns {object}
 */
function buildWhere (filters = {}) {
  const where = {}
  const keyword = filters.keyword?.toString().trim()
  const location = filters.location?.toString().trim()
  const jobType = filters.jobType?.toString().trim()

  let tags = []
  if (Array.isArray(filters.tags)) tags = filters.tags
  else if (typeof filters.tags === 'string') {
    tags = filters.tags.split(',').map(s => s.trim()).filter(Boolean)
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { companyName: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
      { location: { contains: keyword, mode: 'insensitive' } }
    ]
  }
  if (location) where.location = { contains: location, mode: 'insensitive' }
  if (jobType) where.jobType = jobType
  if (tags.length) where.tags = { some: { name: { in: tags } } }

  if (filters.minSalary != null) where.minSalary = { gte: Number(filters.minSalary) }
  if (filters.maxSalary != null) where.maxSalary = { lte: Number(filters.maxSalary) }

  return where
}

/**
 * Lists jobs with pagination
 * Why: browse page requests 5 at a time
 * @param {object} filters includes page/limit/keyword, etc.
 * @returns {Promise<{items:Array, total:number, page:number, limit:number}>}
 */
async function listJobs (filters = {}) {
  const page = Math.max(parseInt(filters.page || 1, 10), 1)
  const limit = Math.max(parseInt(filters.limit || 5, 10), 1)
  const skip = (page - 1) * limit

  const where = buildWhere(filters)

  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      take: limit,
      skip,
      include: { tags: true, hr: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.job.count({ where })
  ])

  return { items, total, page, limit }
}

/**
 * Gets full job details by id
 * @param {number|string} jobId
 * @returns {Promise<object|null>}
 */
async function getJobById (jobId) {
  return prisma.job.findUnique({
    where: { id: Number(jobId) },
    include: {
      hr: true,
      tags: true,
      qualifications: true,
      responsibilities: true,
      benefits: true
    }
  })
}

/**
 * Searches jobs by keyword across title/companyName/location
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function searchJobs (query) {
  const keyword = query?.toString().trim()
  if (!keyword) return []
  return prisma.job.findMany({
    where: {
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { companyName: { contains: keyword, mode: 'insensitive' } },
        { location: { contains: keyword, mode: 'insensitive' } }
      ]
    },
    include: { tags: true },
    orderBy: { createdAt: 'desc' },
    take: 25
  })
}

/**
 * Creates a job posting owned by HR
 * @param {number} hrId
 * @param {object} data
 * @returns {Promise<object>}
 */
async function createJob (hrId, data) {
  // Fetch HR profile to get the companyName
  const hr = await prisma.hR.findUnique({
    where: { id: Number(hrId) },
    select: { companyName: true }
  })

  if (!hr) {
    const err = new Error('HR not found')
    err.status = 404
    throw err
  }

  const {
    title, description, location,
    jobType, workArrangement, duration,
    minSalary, maxSalary, application_deadline,
    email, phone_number, requirements,
    qualifications = [], responsibilities = [], benefits = [],
    tags = []
  } = data

  return prisma.job.create({
    data: {
      hrId,
      title,
      companyName: hr.companyName,
      description,
      location,
      jobType,
      workArrangement,
      duration,
      minSalary,
      maxSalary,
      application_deadline: new Date(application_deadline),
      email: email || null,
      phone_number,
      requirements,
      tags: {
        connectOrCreate: tags.map(name => ({
          where: { name },
          create: { name }
        }))
      },
      qualifications: { create: qualifications.map(text => ({ text })) },
      responsibilities: { create: responsibilities.map(text => ({ text })) },
      benefits: { create: benefits.map(text => ({ text })) }
    },
    include: {
      tags: true,
      qualifications: true,
      responsibilities: true,
      benefits: true
    }
  })
}

/**
 * Updates a job if owned by HR
 * @param {number} jobId
 * @param {number} hrId
 * @param {object} data
 * @returns {Promise<object|null>}
 */
async function updateJob (jobId, hrId, data) {
  const existing = await prisma.job.findUnique({ where: { id: Number(jobId) } })
  if (!existing) return null
  if (existing.hrId !== Number(hrId)) {
    const err = new Error('Forbidden: not job owner')
    err.status = 403
    throw err
  }

  const {
    tags, qualifications, responsibilities, benefits,
    application_deadline, ...scalars
  } = data

  const updateData = { ...scalars }
  if (application_deadline) updateData.application_deadline = new Date(application_deadline)

  const tx = []

  if (Array.isArray(tags)) {
    tx.push(
      prisma.job.update({
        where: { id: existing.id },
        data: {
          tags: {
            set: [],
            connectOrCreate: tags.map(name => ({
              where: { name },
              create: { name }
            }))
          }
        }
      })
    )
  }

  if (Array.isArray(qualifications)) {
    tx.push(
      prisma.qualification.deleteMany({ where: { jobId: existing.id } }),
      prisma.qualification.createMany({ data: qualifications.map(text => ({ jobId: existing.id, text })) })
    )
  }

  if (Array.isArray(responsibilities)) {
    tx.push(
      prisma.responsibility.deleteMany({ where: { jobId: existing.id } }),
      prisma.responsibility.createMany({ data: responsibilities.map(text => ({ jobId: existing.id, text })) })
    )
  }

  if (Array.isArray(benefits)) {
    tx.push(
      prisma.benefit.deleteMany({ where: { jobId: existing.id } }),
      prisma.benefit.createMany({ data: benefits.map(text => ({ jobId: existing.id, text })) })
    )
  }

  const updated = await prisma.job.update({
    where: { id: existing.id },
    data: updateData
  })

  if (tx.length) await prisma.$transaction(tx)

  return getJobById(updated.id)
}

/**
 * Student applies to a job with a resume link
 * Why: enforce one application per (job, student)
 * @param {number} jobId
 * @param {number} studentId
 * @param {string} resumeLink
 * @returns {Promise<object>}
 */
async function applyToJob (jobId, studentId, resumeLink) {
  // create a Resume record for traceability (optional in your schema)
  const resume = await prisma.resume.create({
    data: {
      studentId: Number(studentId),
      link: resumeLink
    }
  })

  try {
    return await prisma.application.create({
      data: {
        jobId: Number(jobId),
        studentId: Number(studentId),
        resumeId: resume.id
      }
    })
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('Already applied to this job')
      err.status = 409
      throw err
    }
    throw error
  }
}

/**
 * HR manages a single application (QUALIFIED/REJECTED)
 * @param {number} jobId
 * @param {number} hrId
 * @param {number} applicationId
 * @param {'QUALIFIED'|'REJECTED'} status
 * @returns {Promise<object|null>}
 */
async function manageApplication (jobId, hrId, applicationId, status) {
  const job = await prisma.job.findUnique({ where: { id: Number(jobId) } })
  if (!job) return null
  if (job.hrId !== Number(hrId)) {
    const err = new Error('Forbidden: not job owner')
    err.status = 403
    throw err
  }
  return prisma.application.update({
    where: { id: Number(applicationId) },
    data: { status }
  })
}

/**
 * HR lists applicants for a job they own
 * @param {number} jobId
 * @param {number} hrId
 * @returns {Promise<Array|null>}
 */
async function getApplicants (jobId, hrId) {
  const job = await prisma.job.findUnique({ where: { id: Number(jobId) } })
  if (!job) return null
  if (job.hrId !== Number(hrId)) {
    const err = new Error('Forbidden: not job owner')
    err.status = 403
    throw err
  }
  return prisma.application.findMany({
    where: { jobId: Number(jobId) },
    include: {
      student: { include: { degreeType: true, user: true } },
      resume: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

module.exports = {
  listJobs,
  getJobById,
  searchJobs,
  createJob,
  updateJob,
  applyToJob,
  manageApplication,
  getApplicants
}
