/**
 * Documents routes
 * @module routes/documents/index
 */

const express = require('express')
const multer = require('multer')
const router = express.Router()
const documentsController = require('../../controllers/documentsController')
const auth = require('../../middlewares/authMiddleware')
const role = require('../../middlewares/roleMiddleware')

// Configure multer for PDF documents (10 MB limit)
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// Configure multer for employer verification (supports JPEG/PNG/PDF, 10 MB)
const verificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, or PDF files are allowed'))
    }
  }
})

// All routes require authentication
router.use(auth.authMiddleware)

// Resume routes (students only)
router.post('/resume', role.roleMiddleware(['STUDENT']), pdfUpload.single('resume'), documentsController.uploadResume)
router.get('/resume/:userId', documentsController.getResumeUrl)

// Transcript routes (students only)
router.post('/transcript', role.roleMiddleware(['STUDENT']), pdfUpload.single('transcript'), documentsController.uploadTranscript)
router.get('/transcript/:userId', documentsController.getTranscriptUrl)

// Employer verification routes (HR/employer only)
router.post('/employer-verification', role.roleMiddleware(['EMPLOYER']), verificationUpload.single('verification'), documentsController.uploadEmployerVerification)
router.get('/employer-verification/:userId', documentsController.getEmployerVerificationUrl)

module.exports = router

