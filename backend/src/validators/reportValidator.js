/**
 * @module validators/report
 * @description Joi schema for job report creation
 */

const Joi = require('joi')

/**
 * Schema for creating a job report
 */
const createReportSchema = Joi.object({
  reason: Joi.string().trim().min(10).max(300).required()
})

module.exports = { createReportSchema }
