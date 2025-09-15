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
 * @param {number} data.degreeTypeId - Degree type ID
 * @param {string} data.address - Address
 * @returns {Promise<Object>} Created user with student profile
 */
async function createStudentUser (data) {
  const { username, password, name, surname, degreeTypeId, address } = data
  
  return prisma.user.create({
    data: {
      username,
      password,
      name,
      surname,
      verified: false,
      student: {
        create: {
          degreeTypeId,
          address
        }
      }
    },
    include: {
      student: {
        include: {
          degreeType: true
        }
      }
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
 * @param {string} data.companyName - Company name
 * @param {string} data.address - Company address
 * @returns {Promise<Object>} Created user with HR profile
 */
async function createEmployerUser (data) {
  const { username, password, name, surname, companyName, address } = data
  
  return prisma.user.create({
    data: {
      username,
      password,
      name,
      surname,
      verified: false,
      hr: {
        create: {
          companyName,
          address
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
 * @param {string} [data.address] - New address
 * @param {number} [data.degreeTypeId] - New degree type ID
 * @returns {Promise<Object>} Updated user with student profile
 */
async function updateStudentProfile (userId, data) {
  const updateData = {}
  
  // Only include fields that are provided
  if (data.address !== undefined) {
    updateData.address = data.address
  }
  if (data.degreeTypeId !== undefined) {
    updateData.degreeTypeId = data.degreeTypeId
  }
  
  return prisma.user.update({
    where: { id: userId },
    data: {
      student: {
        update: updateData
      }
    },
    include: {
      student: {
        include: {
          degreeType: true
        }
      }
    }
  })
}

/**
 * Updates employer profile
 * @param {number} userId - User ID
 * @param {Object} data - Update data
 * @param {string} [data.companyName] - New company name
 * @param {string} [data.address] - New address
 * @returns {Promise<Object>} Updated user with HR profile
 */
async function updateEmployerProfile (userId, data) {
  const updateData = {}
  
  // Only include fields that are provided
  if (data.companyName !== undefined) {
    updateData.companyName = data.companyName
  }
  if (data.address !== undefined) {
    updateData.address = data.address
  }
  
  return prisma.user.update({
    where: { id: userId },
    data: {
      hr: {
        update: updateData
      }
    },
    include: {
      hr: true
    }
  })
}

/**
 * Gets profile by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User profile with role data
 */
async function getProfileById (userId) {
  return prisma.user.findUnique({
    where: { id: parseInt(userId) },
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
}

/**
 * Lists all profiles
 * @returns {Promise<Array>} Array of all user profiles
 */
async function listProfiles () {
  return prisma.user.findMany({
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
}

module.exports = {
  createStudentUser,
  createEmployerUser,
  updateStudentProfile,
  updateEmployerProfile,
  getProfileById,
  listProfiles
}