/**
 * @module controllers/documents-controller/jobDocumentController
 * @description Controller for job-specific resume uploads and management
 */

const storageProvider = require('../../services/storageFactory')
const prisma = require('../../models/prisma')

/**
 * Helper function to check if a user is the HR owner of a job
 * @param {Object} user - The authenticated user object
 * @param {Object} job - The job object with hrId
 * @returns {Promise<boolean>}
 */
async function isHrOwnerOfJob(user, job) {
  if (user.role !== 'EMPLOYER') {
    return false
  }

  try {
    const hr = await prisma.hR.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })

    return hr && hr.id === job.hrId
  } catch (error) {
    console.error('Error checking HR ownership:', error)
    return false
  }
}

/**
 * Upsert job application resume - allows student to either use profile resume or upload a new one
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function upsertJobResume(req, res) {
  try {
    const { jobId } = req.params
    const userId = req.user.id

    // Validate job and student
    const [job, student] = await Promise.all([
      prisma.job.findUnique({
        where: { id: Number(jobId) },
        select: { id: true, hrId: true }
      }),
      prisma.student.findUnique({
        where: { userId },
        select: { id: true, resumeKey: true }
      })
    ])

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      })
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      })
    }

    // Determine mode: 'profile' or 'upload'
    const mode = req.body?.mode || (req.file ? 'upload' : 'profile')

    if (!['profile', 'upload'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mode. Must be "profile" or "upload"'
      })
    }

    let fileKey
    let source = 'UPLOADED'

    if (mode === 'profile') {
      // Use profile resume
      if (!student.resumeKey) {
        return res.status(400).json({
          success: false,
          message: 'No profile resume found. Please upload a profile resume first or upload a resume for this job'
        })
      }
      fileKey = student.resumeKey
      source = 'PROFILE'
    } else {
      // Upload new resume
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        })
      }

      // Upload file with job-specific prefix
      fileKey = await storageProvider.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId,
        { prefix: `resumes/job-applications/${job.id}` }
      )
      source = 'UPLOADED'
    }

    // Check for existing resume to enable cleanup
    const existing = await prisma.resume.findUnique({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: job.id
        }
      },
      select: { link: true, source: true }
    }).catch(() => null)

    // Upsert resume record
    const saved = await prisma.resume.upsert({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: job.id
        }
      },
      create: {
        studentId: student.id,
        jobId: job.id,
        link: fileKey,
        source
      },
      update: {
        link: fileKey,
        source
      }
    })

    // Cleanup old uploaded file (if different from profile and different from new file)
    if (existing?.link && existing.link !== student.resumeKey && existing.link !== fileKey) {
      try {
        await storageProvider.deleteFile(existing.link)
        console.log(`Deleted old job resume file: ${existing.link}`)
      } catch (error) {
        console.error('Failed to delete old job resume:', error.message)
      }
    }

    res.status(200).json({
      success: true,
      message: 'Job resume saved successfully',
      data: {
        jobId: job.id,
        link: saved.link,
        source: saved.source
      }
    })
  } catch (error) {
    console.error('Upsert job resume error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to save job resume'
    })
  }
}

/**
 * Get job application resume URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function getJobResumeUrl(req, res) {
  try {
    const { jobId, studentUserId } = req.params
    const me = req.user

    // Fetch job and student
    const [job, student] = await Promise.all([
      prisma.job.findUnique({
        where: { id: Number(jobId) },
        select: { id: true, hrId: true }
      }),
      prisma.student.findUnique({
        where: { userId: studentUserId },
        select: { id: true, userId: true }
      })
    ])

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      })
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Access control: owner, ADMIN, or HR owner of job
    const isOwner = me.id === student.userId
    const isAdmin = me.role === 'ADMIN'
    const isJobOwner = await isHrOwnerOfJob(me, job)

    if (!isOwner && !isAdmin && !isJobOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    // Get resume record
    const resume = await prisma.resume.findUnique({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: job.id
        }
      },
      select: { link: true, source: true }
    })

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this job application',
        data: { url: null }
      })
    }

    // Get URL from storage provider
    const url = await storageProvider.getFileUrl(resume.link)

    res.status(200).json({
      success: true,
      message: 'Job resume URL retrieved successfully',
      data: {
        url,
        source: resume.source
      }
    })
  } catch (error) {
    console.error('Get job resume URL error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get job resume URL'
    })
  }
}

/**
 * Delete job application resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function deleteJobResume(req, res) {
  try {
    const { jobId } = req.params
    const userId = req.user.id

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true, resumeKey: true }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      })
    }

    // Get existing resume
    const resume = await prisma.resume.findUnique({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: Number(jobId)
        }
      },
      select: { link: true, source: true }
    })

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this job application'
      })
    }

    // Delete the resume record
    await prisma.resume.delete({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: Number(jobId)
        }
      }
    })

    // If it was an uploaded file (not profile), delete the file from storage
    if (resume.source === 'UPLOADED' && resume.link !== student.resumeKey) {
      try {
        await storageProvider.deleteFile(resume.link)
        console.log(`Deleted job resume file: ${resume.link}`)
      } catch (error) {
        console.error('Failed to delete job resume file:', error.message)
      }
    }

    res.status(200).json({
      success: true,
      message: 'Job resume deleted successfully'
    })
  } catch (error) {
    console.error('Delete job resume error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete job resume'
    })
  }
}

/**
 * Get current user's job application resume URL (convenience endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function getSelfJobResumeUrl(req, res) {
  // Reuse the getJobResumeUrl logic by setting studentUserId to current user
  req.params.studentUserId = req.user.id
  return getJobResumeUrl(req, res)
}

module.exports = {
  upsertJobResume,
  getJobResumeUrl,
  deleteJobResume,
  getSelfJobResumeUrl
}
