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
 * @param {string} jobId
 * @returns {Promise<object|null>}
 */
async function getJobById (jobId) {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
      hr: true,
      tags: true,
      requirements: true,
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
 * @param {string} hrId
 * @param {object} data
 * @returns {Promise<object>}
 */
async function createJob (hrId, data) {
  // Fetch HR profile to get the companyName
  const hr = await prisma.hR.findUnique({
    where: { id: hrId },
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

  // Normalize tags to lowercase for case-insensitive filtering
  const normalizedTags = tags.map(t => t.toString().trim().toLowerCase()).filter(Boolean)

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
      other_contact_information: null,
      requirements: { create: requirements.map(text => ({ text })) },
      tags: {
        connectOrCreate: normalizedTags.map(name => ({
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
      requirements: true,
      qualifications: true,
      responsibilities: true,
      benefits: true
    }
  })
}

/**
 * Updates a job if owned by HR (PATCH semantics)
 * - Replaces nested arrays ONLY when provided in req body
 * - Leaves omitted fields unchanged
 * - Runs all operations in a single transaction for consistency
 *
 * @param {string} jobId
 * @param {string} hrId
 * @param {object} data
 * @returns {Promise<object|null>}
 */
async function updateJob (jobId, hrId, data) {
  const existing = await prisma.job.findUnique({ where: { id: jobId } })
  if (!existing) return null
  if (existing.hrId !== hrId) {
    const err = new Error('Forbidden: not job owner')
    err.status = 403
    throw err
  }

  // Destructure known nested-list fields; everything else is scalar on Job
  const {
    tags,
    requirements,
    qualifications,
    responsibilities,
    benefits,
    application_deadline,
    ...scalarUpdates
  } = data

  // Normalize scalar updates
  const scalarData = { ...scalarUpdates }
  if (application_deadline) scalarData.application_deadline = new Date(application_deadline)

  // Build transactional steps (one transaction)
  const steps = []

  // 1) Scalar job fields (if any present)
  if (Object.keys(scalarData).length > 0) {
    steps.push(
      prisma.job.update({
        where: { id: jobId },
        data: scalarData
      })
    )
  }

  // 2) Tags (replace only if provided AND is array)
  if (Array.isArray(tags)) {
    // Normalize tags to lowercase for case-insensitive filtering
    const normalizedTags = tags.map(t => t.toString().trim().toLowerCase()).filter(Boolean)
    // Replace tags set completely
    steps.push(
      prisma.job.update({
        where: { id: jobId },
        data: {
          tags: {
            set: [], // clear all
            connectOrCreate: normalizedTags.map(name => ({
              where: { name },
              create: { name }
            }))
          }
        }
      })
    )
  }

  // Helper to replace a simple child table (Requirement / Qualification / Responsibility / Benefit)
  const replaceSimpleChildren = (model, fieldNameArray) => {
  const arr = fieldNameArray // array of strings (texts)
  if (!Array.isArray(arr)) return
  steps.push(
    prisma[model].deleteMany({ where: { jobId } }),
    prisma[model].createMany({
      data: arr.map(text => ({ jobId, text }))
    })
  )
}


  replaceSimpleChildren('requirement', requirements)
  replaceSimpleChildren('qualification', qualifications)
  replaceSimpleChildren('responsibility', responsibilities)
  replaceSimpleChildren('benefit', benefits)

  // 3) After all writes, read back the canonical job with all relations
  steps.push(
    prisma.job.findUnique({
      where: { id: jobId },
      include: {
        hr: true,
        tags: true,
        requirements: true,
        qualifications: true,
        responsibilities: true,
        benefits: true
      }
    })
  )

  // Run in a single transaction; the last step returns the job
  const results = await prisma.$transaction(steps)
  const updatedJob = results[results.length - 1]
  return updatedJob
}


/**
 * Student applies to a job with a resume link
 * Why: enforce one application per (job, student)
 * @param {string} jobId
 * @param {string} studentId
 * @param {string} resumeLink
 * @returns {Promise<object>}
 */
async function applyToJob (jobId, studentId, resumeLink) {
  // create a Resume record for traceability (optional in your schema)
  const resume = await prisma.resume.create({
    data: {
      studentId,
      link: resumeLink
    }
  })

  try {
    return await prisma.application.create({
      data: {
        jobId,
        studentId,
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
 * @param {string} jobId
 * @param {string} hrId
 * @param {string} applicationId
 * @param {'QUALIFIED'|'REJECTED'} status
 * @returns {Promise<object|null>}
 */
async function manageApplication (jobId, hrId, applicationId, status) {
  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) return null
  if (job.hrId !== hrId) {
    const err = new Error('Forbidden: not job owner')
    err.status = 403
    throw err
  }
  return prisma.application.update({
    where: { id: applicationId },
    data: { status }
  })
}

/**
 * HR lists applicants for a job they own
 * @param {string} jobId
 * @param {string} hrId
 * @returns {Promise<Array|null>}
 */
async function getApplicants (jobId, hrId) {
  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) return null
  if (job.hrId !== hrId) {
    const err = new Error('Forbidden: not job owner')
    err.status = 403
    throw err
  }
  return prisma.application.findMany({
    where: { jobId },
    include: {
      student: { include: { degreeType: true, user: true } },
      resume: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Deletes a job (by Admin or HR owner)
 * @param {string} jobId - Job ID to delete
 * @param {object} requester - User object (from req.user)
 * @returns {Promise<object|null>} Deleted job record
 */
async function deleteJob (jobId, requester) {
  const job = await prisma.job.findUnique({ where: { id: jobId } })

  if (!job) {
    const err = new Error('Job not found')
    err.status = 404
    throw err
  }

  // Only allow Admins or the HR who owns the job
  const isAdmin = requester.role === 'ADMIN'
  const isOwner = requester.role === 'EMPLOYER' && requester.hr && job.hrId === requester.hr.id

  if (!isAdmin && !isOwner) {
    const err = new Error('You are not authorized to delete this job')
    err.status = 403
    throw err
  }

  // Delete job (cascades will handle child entities)
  const deletedJob = await prisma.job.delete({
    where: { id: jobId },
    include: { hr: true, tags: true }
  })

  return deletedJob
}

/**
 * Filters jobs by tags with pagination
 * Why: allow users to find jobs by specific tags
 * Note: Tags must be stored in lowercase for exact matching
 * @param {object} q - { tags, page, limit }
 * @returns {Promise<{items: Array, total: number, page: number, limit: number}>}
 */
async function filterJobs (q) {
  // Parse and normalize tags (lowercase, dedupe)
  // Why: Prisma doesn't support mode:'insensitive' on relation fields, so we normalize to lowercase
  let tags = []
  if (q.tags) {
    const rawTags = typeof q.tags === 'string' ? q.tags.split(',') : q.tags
    tags = [...new Set(
      rawTags
        .map(t => t.toString().trim().toLowerCase())
        .filter(Boolean)
    )]
  }

  // If no tags provided, return empty
  if (!tags.length) {
    return { items: [], total: 0, page: 1, limit: 5 }
  }

  // Pagination with clamping
  const limit = Math.min(Math.max(Number(q.limit) || 5, 1), 50)
  const page = Math.max(Number(q.page) || 1, 1)
  const skip = (page - 1) * limit

  // Build where clause - only filter by tags
  // Why: OR allows matching any tag provided
  const where = {
    OR: tags.map(t => ({
      tags: { some: { name: t } }
    }))
  }

  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      take: limit,
      skip,
      include: {
        tags: true,
        hr: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.job.count({ where })
  ])

  return { items, total, page, limit }
}

/**
 * Gets all applications for a student with their statuses
 * Why: UC-S09 - Students need to check their application statuses
 * @param {string} userId - The user ID (must be a STUDENT)
 * @returns {Promise<Array>} List of applications with job details and status
 */
async function getMyApplications (userId) {
  // Verify user is a student
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true }
  })

  if (!user || user.role !== 'STUDENT' || !user.student) {
    const error = new Error('Only students can view their applications')
    error.status = 403
    throw error
  }

  // Get all applications for this student
  const applications = await prisma.application.findMany({
    where: {
      studentId: user.student.id
    },
    include: {
      job: {
        include: {
          hr: {
            include: {
              user: {
                select: {
                  name: true,
                  surname: true
                }
              }
            }
          },
          tags: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Format response to match frontend needs
  return applications.map(app => ({
    id: app.id,
    status: app.status,
    appliedAt: app.createdAt,
    updatedAt: app.updatedAt,
    job: {
      id: app.job.id,
      title: app.job.title,
      companyName: app.job.companyName,
      location: app.job.location,
      jobType: app.job.jobType,
      workArrangement: app.job.workArrangement,
      minSalary: app.job.minSalary,
      maxSalary: app.job.maxSalary,
      tags: app.job.tags.map(t => t.name),
      hrName: `${app.job.hr.user.name} ${app.job.hr.user.surname}`
    }
  }))
}

module.exports = {
  listJobs,
  getJobById,
  searchJobs,
  createJob,
  updateJob,
  applyToJob,
  manageApplication,
  getApplicants,
  deleteJob,
  filterJobs,
  getMyApplications
}
