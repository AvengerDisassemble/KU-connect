/**
 * @module services/profileService
 * @description Service layer for profile management operations
 */

const prisma = require('../models/prisma')

/**
 * Creates a new student user with profile
 * @param {Object} data - Student data
 * @param {string} data.username - Username
 * @param {string} data.password - Password
 * @param {string} data.name - First name
 * @param {string} data.surname - Last name
 * @param {string} data.email - Email address
 * @param {string} [data.phoneNumber] - Phone number
 * @param {number} data.degreeTypeId - Degree type ID
 * @param {string} data.address - Address
 * @param {number} data.gpa - GPA
 * @param {number} data.expectedGraduationYear - Expected graduation year
 * @returns {Promise<Object>} Created user with student profile
 */
async function createStudentUser (data) {
  const {
    username,
    password,
    name,
    surname,
    email,
    phoneNumber,
    degreeTypeId,
    address,
    gpa,
    expectedGraduationYear
  } = data
  
  return prisma.user.create({
    data: {
      username,
      password,
      name,
      surname,
      email,
      phoneNumber: phoneNumber || null,
      verified: false,
      student: {
        create: {
          degreeTypeId,
          address,
          gpa: gpa ?? null,
          expectedGraduationYear: expectedGraduationYear ?? null
        }
      }
    },
    include: {
      student: { include: { degreeType: true } }
    }
  })
}


/**
 * Creates a new employer user with HR profile
 * @param {Object} data - Employer data
 * @param {string} data.username - Username
 * @param {string} data.password - Password
 * @param {string} data.name - First name
 * @param {string} data.surname - Last name
 * @param {string} data.email - Email address
 * @param {string} [data.phoneNumber] - Phone number
 * @param {string} data.industry - Industry
 * @param {string} data.companySize - Company size
 * @param {string} [data.website] - Company website
 * @param {string} data.companyName - Company name
 * @param {string} data.address - Company address
 * @returns {Promise<Object>} Created user with HR profile
 */
async function createEmployerUser (data) {
  const {
    username,
    password,
    name,
    surname,
    email,
    phoneNumber,
    companyName,
    address,
    industry,
    companySize,
    website
  } = data
  
  return prisma.user.create({
    data: {
      username,
      password,
      name,
      surname,
      email,
      phoneNumber: phoneNumber || null,
      verified: false,
      hr: {
        create: {
          companyName,
          address,
          industry,
          companySize,
          website: website || null
        }
      }
    },
    include: {
      hr: true
    }
  })
}

/**
 * Updates student profile
 * @param {number} userId - User ID
 * @param {Object} data - Update data
 * @param {number} [data.gpa] - New GPA
 * @param {number} [data.expectedGraduationYear] - New expected graduation year
 * @param {string} [data.address] - New address
 * @param {number} [data.degreeTypeId] - New degree type ID
 * @returns {Promise<Object>} Updated user with student profile
 */
async function updateStudentProfile(userId, data) {
  const { address, degreeTypeId, gpa, expectedGraduationYear, ...userFields } = data

  const studentUpdate = {}
  if (address !== undefined) studentUpdate.address = address
  if (degreeTypeId !== undefined) studentUpdate.degreeTypeId = degreeTypeId
  if (gpa !== undefined) studentUpdate.gpa = gpa
  if (expectedGraduationYear !== undefined) studentUpdate.expectedGraduationYear = expectedGraduationYear

  const userUpdate = {}
  if (userFields.name !== undefined) userUpdate.name = userFields.name
  if (userFields.surname !== undefined) userUpdate.surname = userFields.surname
  if (userFields.email !== undefined) userUpdate.email = userFields.email
  if (userFields.phoneNumber !== undefined) userUpdate.phoneNumber = userFields.phoneNumber

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...userUpdate,
      student: Object.keys(studentUpdate).length ? { update: studentUpdate } : undefined
    },
    include: {
      student: { include: { degreeType: true } }
    }
  })
}

/**
 * Updates employer profile
 * @param {number} userId - User ID
 * @param {Object} data - Update data
 * @param {string} [data.industry] - New industry
 * @param {string} [data.companySize] - New company size
 * @param {string} [data.website] - New website
 * @param {string} [data.companyName] - New company name
 * @param {string} [data.address] - New address
 * @returns {Promise<Object>} Updated user with HR profile
 */
async function updateEmployerProfile(userId, data) {
  const { companyName, address, industry, companySize, website, ...userFields } = data

  const hrUpdate = {}
  if (companyName !== undefined) hrUpdate.companyName = companyName
  if (address !== undefined) hrUpdate.address = address
  if (industry !== undefined) hrUpdate.industry = industry
  if (companySize !== undefined) hrUpdate.companySize = companySize
  if (website !== undefined) hrUpdate.website = website

  const userUpdate = {}
  if (userFields.name !== undefined) userUpdate.name = userFields.name
  if (userFields.surname !== undefined) userUpdate.surname = userFields.surname
  if (userFields.email !== undefined) userUpdate.email = userFields.email
  if (userFields.phoneNumber !== undefined) userUpdate.phoneNumber = userFields.phoneNumber

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...userUpdate,
      hr: Object.keys(hrUpdate).length ? { update: hrUpdate } : undefined
    },
    include: { hr: true }
  })
}

/**
 * Gets profile by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User profile with role data
 */
async function getProfileById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: {
      student: { include: { degreeType: true } },
      hr: true,
      professor: true,
      admin: true
    }
  })

  if (!user) return null

  // Remove role objects that are null
  Object.keys(user).forEach((key) => {
    if (['student', 'hr', 'professor', 'admin'].includes(key) && !user[key]) {
      delete user[key]
    }
  })

  return user
}


/**
 * Lists all profiles
 * @returns {Promise<Array>} Array of all user profiles
 */
async function listProfiles() {
  const profiles = await prisma.user.findMany({
    include: {
      student: {
        include: {
          degreeType: true
        }
      },
      hr: true,
      professor: true,
      admin: true
    }
  })

  // Remove role objects that are null
  profiles.forEach((profile) => {
    Object.keys(profile).forEach((key) => {
      if (['student', 'hr', 'professor', 'admin'].includes(key) && !profile[key]) {
        delete profile[key]
      }
    })
  })

  return profiles
}

module.exports = {
  createStudentUser,
  createEmployerUser,
  updateStudentProfile,
  updateEmployerProfile,
  getProfileById,
  listProfiles
}