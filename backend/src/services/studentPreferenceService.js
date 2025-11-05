/**
 * @module services/studentPreferenceService
 * @description Business logic for Student Preference management
 */

const prisma = require('../models/prisma')

/**
 * Get student preference by userId
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Student preference or null
 */
async function getPreferenceByUserId(userId) {
  // Find student by userId
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true }
  })

  if (!student) {
    const error = new Error('Student profile not found')
    error.status = 404
    throw error
  }

  // Get preference for this student
  const preference = await prisma.studentPreference.findUnique({
    where: { studentId: student.id }
  })

  return preference
}

/**
 * Create or update student preference by userId
 * @param {string} userId - User ID
 * @param {object} data - Preference data
 * @returns {Promise<object>} Created or updated preference
 */
async function upsertPreferenceByUserId(userId, data) {
  // Find student by userId
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true }
  })

  if (!student) {
    const error = new Error('Student profile not found')
    error.status = 404
    throw error
  }

  // Upsert preference
  const preference = await prisma.studentPreference.upsert({
    where: { studentId: student.id },
    update: {
      desiredLocation: data.desiredLocation,
      minSalary: data.minSalary,
      currency: data.currency,
      payPeriod: data.payPeriod,
      remoteWork: data.remoteWork
    },
    create: {
      studentId: student.id,
      desiredLocation: data.desiredLocation,
      minSalary: data.minSalary,
      currency: data.currency,
      payPeriod: data.payPeriod,
      remoteWork: data.remoteWork
    }
  })

  return preference
}

module.exports = {
  getPreferenceByUserId,
  upsertPreferenceByUserId
}
