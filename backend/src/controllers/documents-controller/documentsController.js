/**
 * @module controllers/documentsController
 * @description Controller for user document uploads (resume, transcript, employer verification)
 */

const storageProvider = require('../../services/storageFactory')
const prisma = require('../../models/prisma')

/**
 * Upload student resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function uploadResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const userId = req.user.id

    // Fetch student record
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

    // Best-effort delete old resume
    if (student.resumeKey) {
      try {
        await storageProvider.deleteFile(student.resumeKey)
      } catch (error) {
        console.error('Failed to delete old resume:', error.message)
      }
    }

    // Upload new resume
    const fileKey = await storageProvider.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      { prefix: 'resumes' }
    )

    // Update student record
    await prisma.student.update({
      where: { userId },
      data: { resumeKey: fileKey }
    })

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: { fileKey }
    })
  } catch (error) {
    console.error('Resume upload error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload resume'
    })
  }
}

/**
 * Get resume URL for a student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function getResumeUrl(req, res) {
  try {
    const requestedUserId = req.params.userId
    const { role: userRole, id: currentUserId } = req.user

    // Access control: owner or admin
    if (currentUserId !== requestedUserId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const student = await prisma.student.findUnique({
      where: { userId: requestedUserId },
      select: { resumeKey: true }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      })
    }

    if (!student.resumeKey) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this student',
        data: { url: null }
      })
    }

    const url = await storageProvider.getFileUrl(student.resumeKey)

    res.status(200).json({
      success: true,
      message: 'Resume URL retrieved successfully',
      data: { url }
    })
  } catch (error) {
    console.error('Get resume URL error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get resume URL'
    })
  }
}

/**
 * Upload student transcript
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function uploadTranscript(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const userId = req.user.id

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true, transcriptKey: true }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      })
    }

    // Best-effort delete old transcript
    if (student.transcriptKey) {
      try {
        await storageProvider.deleteFile(student.transcriptKey)
      } catch (error) {
        console.error('Failed to delete old transcript:', error.message)
      }
    }

    // Upload new transcript
    const fileKey = await storageProvider.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      { prefix: 'transcripts' }
    )

    // Update student record
    await prisma.student.update({
      where: { userId },
      data: { transcriptKey: fileKey }
    })

    res.status(200).json({
      success: true,
      message: 'Transcript uploaded successfully',
      data: { fileKey }
    })
  } catch (error) {
    console.error('Transcript upload error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload transcript'
    })
  }
}

/**
 * Get transcript URL for a student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function getTranscriptUrl(req, res) {
  try {
    const requestedUserId = req.params.userId
    const { role: userRole, id: currentUserId } = req.user

    // Access control: owner or admin
    if (currentUserId !== requestedUserId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const student = await prisma.student.findUnique({
      where: { userId: requestedUserId },
      select: { transcriptKey: true }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      })
    }

    if (!student.transcriptKey) {
      return res.status(404).json({
        success: false,
        message: 'No transcript found for this student',
        data: { url: null }
      })
    }

    const url = await storageProvider.getFileUrl(student.transcriptKey)

    res.status(200).json({
      success: true,
      message: 'Transcript URL retrieved successfully',
      data: { url }
    })
  } catch (error) {
    console.error('Get transcript URL error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get transcript URL'
    })
  }
}

/**
 * Upload employer verification document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function uploadEmployerVerification(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const userId = req.user.id

    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true, verificationDocKey: true }
    })

    if (!hr) {
      return res.status(404).json({
        success: false,
        message: 'HR profile not found'
      })
    }

    // Best-effort delete old verification doc
    if (hr.verificationDocKey) {
      try {
        await storageProvider.deleteFile(hr.verificationDocKey)
      } catch (error) {
        console.error('Failed to delete old verification document:', error.message)
      }
    }

    // Upload new verification document
    const fileKey = await storageProvider.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      { prefix: 'employer-docs' }
    )

    // Update HR record
    await prisma.hR.update({
      where: { userId },
      data: { verificationDocKey: fileKey }
    })

    res.status(200).json({
      success: true,
      message: 'Employer verification document uploaded successfully',
      data: { fileKey }
    })
  } catch (error) {
    console.error('Employer verification upload error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload employer verification document'
    })
  }
}

/**
 * Get employer verification document URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function getEmployerVerificationUrl(req, res) {
  try {
    const requestedUserId = req.params.userId
    const { role: userRole, id: currentUserId } = req.user

    // Access control: owner or admin
    if (currentUserId !== requestedUserId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const hr = await prisma.hR.findUnique({
      where: { userId: requestedUserId },
      select: { verificationDocKey: true }
    })

    if (!hr) {
      return res.status(404).json({
        success: false,
        message: 'HR profile not found'
      })
    }

    if (!hr.verificationDocKey) {
      return res.status(404).json({
        success: false,
        message: 'No verification document found for this employer',
        data: { url: null }
      })
    }

    const url = await storageProvider.getFileUrl(hr.verificationDocKey)

    res.status(200).json({
      success: true,
      message: 'Employer verification URL retrieved successfully',
      data: { url }
    })
  } catch (error) {
    console.error('Get employer verification URL error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get employer verification URL'
    })
  }
}

module.exports = {
  uploadResume,
  getResumeUrl,
  uploadTranscript,
  getTranscriptUrl,
  uploadEmployerVerification,
  getEmployerVerificationUrl
}

