/**
 * @module validators/notificationValidator
 * @description Joi schemas for user notification feature
 */

const Joi = require('joi')

/**
 * Schema for notifying employer of new application
 * Used for internal trigger endpoint
 */
const employerApplicationSchema = Joi.object({
  studentUserId: Joi.string().trim().required(),
  jobId: Joi.string().trim().required()
})

/**
 * Schema for notifying student of application status
 * Used for internal trigger endpoint
 */
const studentApprovalSchema = Joi.object({
  employerUserId: Joi.string().trim().required(),
  studentUserId: Joi.string().trim().required(),
  jobId: Joi.string().trim().required(),
  status: Joi.string().valid('QUALIFIED', 'REJECTED').required(),
  applicationId: Joi.string().trim().optional()
})

/**
 * Schema for pagination query parameters
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

module.exports = {
  employerApplicationSchema,
  studentApprovalSchema,
  paginationSchema
}
