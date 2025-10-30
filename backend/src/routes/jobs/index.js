/**
 * Job resume routes
 * @module routes/jobs/resume
 */

const express = require('express')
const multer = require('multer')
const router = express.Router()
const jobDocumentController = require('../../controllers/documents-controller/jobDocumentController')
const auth = require('../../middlewares/authMiddleware')
const role = require('../../middlewares/roleMiddleware')
const downloadRateLimit = require('../../middlewares/downloadRateLimit')
const rateLimit = require('express-rate-limit')

// Set up rate limiter for job resume upload/delete (max 10 requests per 15 minutes per IP)
const jobResumeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later.',
})
// Configure multer for PDF documents (10 MB limit) - same as profile resumes
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

// All routes require authentication
router.use(auth.authMiddleware)

// Job resume routes (student only for POST/DELETE)
// POST - Upsert job application resume (use profile or upload new)
router.post(
  '/:jobId/resume',
  jobResumeRateLimit,
  role.roleMiddleware(['STUDENT']),
  pdfUpload.single('resume'),
  jobDocumentController.upsertJobResume
)

// GET - Download job application resume (protected, owner/HR/admin)
router.get(
  '/:jobId/resume/:studentUserId/download',
  downloadRateLimit,
  jobDocumentController.downloadJobResume
)

// DELETE - Delete job application resume (student only)
router.delete(
  '/:jobId/resume',
  jobResumeRateLimit,
  role.roleMiddleware(['STUDENT']),
  jobDocumentController.deleteJobResume
)

module.exports = router
