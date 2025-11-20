/**
 * @module utils/documentAuthz
 * @description Centralized authorization checks for document access
 */

const prisma = require("../models/prisma");

/**
 * Check if user can view a student's document (resume/transcript)
 * @param {Object} requester - Requesting user {id, role}
 * @param {string} targetUserId - Target user whose document is requested
 * @returns {Promise<boolean>} True if authorized
 */
async function canViewStudentDocument(requester, targetUserId) {
  // Owner can view their own documents
  if (requester.id === targetUserId) {
    return true;
  }

  // Admins can view any document
  if (requester.role === "ADMIN") {
    return true;
  }

  // HR can view student documents if the student has applied to any of their jobs
  if (requester.role === "EMPLOYER") {
    const hr = await prisma.hR.findUnique({
      where: { userId: requester.id },
      select: { id: true },
    });

    if (hr) {
      const student = await prisma.student.findUnique({
        where: { userId: targetUserId },
        select: { id: true },
      });

      if (student) {
        // Check if student has applied to any job owned by this HR
        const application = await prisma.application.findFirst({
          where: {
            studentId: student.id,
            job: {
              hrId: hr.id,
            },
          },
        });

        if (application) {
          return true;
        }
      }
    }
  }

  return false;
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
    return true;
  }

  // Admins can view any document
  if (requester.role === "ADMIN") {
    return true;
  }

  return false;
}

/**
 * Check if user can view a job-specific resume
 * @param {Object} requester - Requesting user {id, role}
 * @param {string|number} jobId - Job posting ID
 * @param {string} studentUserId - Student who uploaded resume
 * @returns {Promise<boolean>} True if authorized
 */
async function canViewJobResume(requester, jobId, studentUserId) {
  // Owner student can view their own resume
  if (requester.id === studentUserId) {
    return true;
  }

  // Admins can view any resume
  if (requester.role === "ADMIN") {
    return true;
  }

  // HR can view student documents if the student has applied to any of their jobs
  if (requester.role === "EMPLOYER") {
    const hr = await prisma.hR.findUnique({
      where: { userId: requester.id },
      select: { id: true },
    });

    if (hr) {
      const student = await prisma.student.findUnique({
        where: { userId: studentUserId },
        select: { id: true },
      });

      if (student) {
        // Check if student has applied to any job owned by this HR
        const application = await prisma.application.findFirst({
          where: {
            studentId: student.id,
            job: {
              hrId: hr.id,
            },
          },
        });

        if (application) {
          return true;
        }
      }
    }
  }

  return false;
}

module.exports = {
  canViewStudentDocument,
  canViewHRDocument,
  canViewJobResume,
};
