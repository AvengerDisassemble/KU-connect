/**
 * @module services/profileService
 * @description Service layer for profile management operations
 */

const prisma = require("../models/prisma"); // Prisma client instance

/**
 * Extract user fields for update (avoids duplication)
 * @param {Object} fields - Partial user fields
 * @returns {Object} filtered fields for update
 */
function extractUserUpdateFields(fields) {
  const updates = {};
  if (fields.name !== undefined) updates.name = fields.name;
  if (fields.surname !== undefined) updates.surname = fields.surname;
  if (fields.email !== undefined) updates.email = fields.email;
  if (fields.phoneNumber !== undefined)
    updates.phoneNumber = fields.phoneNumber;
  return updates;
}

/**
 * Updates student profile
 * @param {string} userId - User ID (hashed)
 * @param {Object} data - Update data
 * @param {number} [data.gpa] - New GPA
 * @param {number} [data.expectedGraduationYear] - New expected graduation year
 * @param {string} [data.address] - New address
 * @param {string} [data.degreeTypeId] - New degree type ID
 * @returns {Promise<Object>} Updated user with student profile
 */
async function updateStudentProfile(userId, data) {
  const { address, degreeTypeId, gpa, expectedGraduationYear, ...userFields } =
    data;

  const studentUpdate = {};
  if (address !== undefined) studentUpdate.address = address;
  if (degreeTypeId !== undefined) studentUpdate.degreeTypeId = degreeTypeId;
  if (gpa !== undefined) studentUpdate.gpa = gpa;
  if (expectedGraduationYear !== undefined)
    studentUpdate.expectedGraduationYear = expectedGraduationYear;

  const userUpdate = extractUserUpdateFields(userFields);

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...userUpdate,
      student: Object.keys(studentUpdate).length
        ? { update: studentUpdate }
        : undefined,
    },
    include: {
      student: { include: { degreeType: true } },
    },
  });
}

/**
 * Updates employer (HR) profile
 * @param {string} userId - User ID (hashed)
 * @param {Object} data - Update data
 * @param {string} [data.industry] - New industry
 * @param {string} [data.companySize] - New company size
 * @param {string} [data.website] - New website
 * @param {string} [data.companyName] - New company name
 * @param {string} [data.address] - New address
 * @param {string} [data.description] - New company description
 * @param {string} [data.phoneNumber] - New company phone number
 * @returns {Promise<Object>} Updated user with HR profile
 */
async function updateEmployerProfile(userId, data) {
  const {
    companyName,
    address,
    industry,
    companySize,
    website,
    description,
    phoneNumber,
    ...userFields
  } = data;

  const hrUpdate = {};
  if (companyName !== undefined) hrUpdate.companyName = companyName;
  if (address !== undefined) hrUpdate.address = address;
  if (industry !== undefined) hrUpdate.industry = industry;
  if (companySize !== undefined) hrUpdate.companySize = companySize;
  if (website !== undefined) hrUpdate.website = website;
  if (description !== undefined) hrUpdate.description = description;
  if (phoneNumber !== undefined) hrUpdate.phoneNumber = phoneNumber;

  const userUpdate = extractUserUpdateFields(userFields);

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...userUpdate,
      hr: Object.keys(hrUpdate).length ? { update: hrUpdate } : undefined,
    },
    include: { hr: true },
  });
}

/**
 * Gets profile by user ID
 * @param {string} userId - User ID (hashed)
 * @returns {Promise<Object|null>} User profile with role data
 */
async function getProfileById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: { include: { degreeType: true } },
      hr: true,
      professor: true,
      admin: true,
    },
  });

  if (!user) return null;

  // Remove null role objects for cleaner output
  for (const key of ["student", "hr", "professor", "admin"]) {
    if (!user[key]) delete user[key];
  }

  return user;
}

/**
 * Lists all profiles
 * @returns {Promise<Array>} Array of all user profiles
 */
async function listProfiles() {
  const profiles = await prisma.user.findMany({
    include: {
      student: { include: { degreeType: true } },
      hr: true,
      professor: true,
      admin: true,
    },
  });

  // Remove null role objects from each profile
  profiles.forEach((profile) => {
    for (const key of ["student", "hr", "professor", "admin"]) {
      if (!profile[key]) delete profile[key];
    }
  });

  return profiles;
}

module.exports = {
  updateStudentProfile,
  updateEmployerProfile,
  getProfileById,
  listProfiles,
};
