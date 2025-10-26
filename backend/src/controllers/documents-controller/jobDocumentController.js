/**
 * @module controllers/documents-controller/jobDocumentController
 * @description Controller for job-specific resume uploads and management
 */

const storageProvider = require('../../services/storageFactory')
const prisma = require('../../models/prisma')
const { canViewJobResume } = require('../../utils/documentAuthz')
const { logDocumentAccess } = require('../../utils/auditLogger')

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
        where: { id: jobId },
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
          jobId: jobId
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
          jobId: jobId
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
 * Download job application resume (protected)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function downloadJobResume(req, res) {
  try {
    const { jobId, studentUserId } = req.params
    const requester = req.user

    // Authorization check
    const isAuthorized = await canViewJobResume(requester, jobId, studentUserId)
    
    if (!isAuthorized) {
      logDocumentAccess({
        userId: requester.id,
        documentType: 'job-resume',
        documentOwner: studentUserId,
        action: 'download',
        success: false,
        reason: `Access denied for job ${jobId}`,
        ip: req.ip
      })
      
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      select: { id: true }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      })
    }

    // Get resume record
    const resume = await prisma.resume.findUnique({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: jobId
        }
      },
      select: { link: true }
    })

    if (!resume || !resume.link) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this job application'
      })
    }

    // Log successful access
    logDocumentAccess({
      userId: requester.id,
      documentType: 'job-resume',
      documentOwner: studentUserId,
      action: 'download',
      success: true,
      ip: req.ip
    })

    // Try signed URL first (S3), fallback to streaming (local)
    const signedUrl = await storageProvider.getSignedDownloadUrl(resume.link)
    
    if (signedUrl) {
      return res.redirect(signedUrl)
    }

    // Stream the file
    const { stream, mimeType, filename } = await storageProvider.getReadStream(resume.link)
    
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    
    stream.pipe(res)
  } catch (error) {
    console.error('Download job resume error:', error)
    
    if (error.message.includes('File not found')) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to download job resume'
    })
  }
}

module.exports = {
  upsertJobResume,
  deleteJobResume,
  downloadJobResume
}
