/**
 * @module validators/job.validator
 * @description Joi schemas for Job Posting feature
 */

const Joi = require('joi')

/**
 * Common string array
 */
const stringArray = Joi.array().items(Joi.string().trim().min(1)).default([])

/**
 * Create job schema (HR only)
 */
const createJobSchema = Joi.object({
  title: Joi.string().trim().max(150).required(),
  companyName: Joi.forbidden(), // ✅ Prevent HR from submitting it manually
  description: Joi.string().trim().required(),
  location: Joi.string().trim().max(150).required(),
  jobType: Joi.string().valid('internship', 'part-time', 'full-time', 'contract').required(),
  workArrangement: Joi.string().valid('on-site', 'remote', 'hybrid').required(),
  duration: Joi.string().trim().max(100).required(),
  minSalary: Joi.number().integer().min(0).required(),
  maxSalary: Joi.number().integer().min(Joi.ref('minSalary')).required(),
  application_deadline: Joi.date().iso().greater('now').required(),
  email: Joi.string().email().allow(null, '').optional(),
  phone_number: Joi.string().pattern(/^[0-9+\-()\s]+$/).required(),
  requirements: Joi.string().trim().required(),
  qualifications: stringArray,
  responsibilities: stringArray,
  benefits: stringArray,
  tags: Joi.array().items(Joi.string().trim().max(50)).default([])
})

/**
 * Update job schema (HR owner only)
 */
const updateJobSchema = Joi.object({
  title: Joi.string().trim().max(150),
companyName: Joi.forbidden(), // ✅ Prevent HR from updating it via this route
  description: Joi.string().trim(),
  location: Joi.string().trim().max(150),
  jobType: Joi.string().valid('internship', 'part-time', 'full-time', 'contract'),
  workArrangement: Joi.string().valid('on-site', 'remote', 'hybrid'),
  duration: Joi.string().trim().max(100),
  minSalary: Joi.number().integer().min(0),
  maxSalary: Joi.number().integer().min(Joi.ref('minSalary')),
  application_deadline: Joi.date().iso().greater('now'),
  email: Joi.string().email().allow(null, ''),
  phone_number: Joi.string().pattern(/^[0-9+\-()\s]+$/),
  requirements: Joi.string().trim(),
  qualifications: stringArray,
  responsibilities: stringArray,
  benefits: stringArray,
  tags: Joi.array().items(Joi.string().trim().max(50))
}).min(1)

/**
 * Student applies to a job (resume link required)
 */
const applyJobSchema = Joi.object({
  resumeLink: Joi.string().uri().required()
})

/**
 * HR manages a specific application
 */
const manageApplicationSchema = Joi.object({
  status: Joi.string().valid('QUALIFIED', 'REJECTED').required()
})

module.exports = {
  createJobSchema,
  updateJobSchema,
  applyJobSchema,
  manageApplicationSchema
}
