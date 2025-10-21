/**
 * @module utils/documentAuthz
 * @description Centralized authorization checks for document access
 */

const prisma = require('../models/prisma')

/**
 * Check if user can view a student's document (resume/transcript)
 * @param {Object} requester - Requesting user {id, role}
 * @param {string} targetUserId - Target user whose document is requested
 * @returns {boolean} True if authorized
 */
function canViewStudentDocument(requester, targetUserId) {
  // Owner can view their own documents
  if (requester.id === targetUserId) {
    return true
  }
  
  // Admins can view any document
  if (requester.role === 'ADMIN') {
    return true
  }
  
  return false
}

/**
 * Check if user can view an HR's verification document
 * @param {Object} requester - Requesting user {id, role}
 * @param {string} targetUserId - Target HR user
 * @returns {boolean} True if authorized
 */
function canViewHRDocument(requester, targetUserId) {
  // Owner can view their own documents
  if (requester.id === targetUserId) {
    return true
  }
  
  // Admins can view any document
  if (requester.role === 'ADMIN') {
    return true
  }
  
  return false
}

/**
 * Check if user can view a job-specific resume
 * @param {Object} requester - Requesting user {id, role}
 * @param {string} jobId - Job posting ID
 * @param {string} studentUserId - Student who uploaded resume
 * @returns {Promise<boolean>} True if authorized
 */
async function canViewJobResume(requester, jobId, studentUserId) {
  // Owner student can view their own resume
  if (requester.id === studentUserId) {
    return true
  }
  
  // Admins can view any resume
  if (requester.role === 'ADMIN') {
    return true
  }
  
  // HR who owns the job can view resumes for that job
  if (requester.role === 'EMPLOYER') {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { 
        hR: {
          select: { userId: true }
        }
      }
    })
    
    if (job && job.hR && job.hR.userId === requester.id) {
      return true
    }
  }
  
  return false
}

module.exports = {
  canViewStudentDocument,
  canViewHRDocument,
  canViewJobResume
}
