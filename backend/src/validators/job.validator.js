/**
 * @module validators/job.validator
 * @description Validation schemas for job operations
 * 
 * @requires joi
 */

const Joi = require('joi');

/**
 * Validation schema for creating a job posting
 */
const createJobSchema = Joi.object({
    userId: Joi.number().integer().required(),
    title: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    location: Joi.string().trim().required(),
    application_deadline: Joi.date().iso().greater('now').required(),
    email: Joi.string().email().required(),
    phone_number: Joi.string().required(),
    other_contact_information: Joi.string().allow(null, ''),
    requirements: Joi.string().trim().required()
})

/**
 * Validation schema for updating a job posting
 */
const updateJobSchema = Joi.object({
    userId: Joi.number().integer().required(),
    title: Joi.string().trim(),
    description: Joi.string().trim(),
    location: Joi.string().trim(),
    application_deadline: Joi.date().iso().greater('now'),
    email: Joi.string().email(),
    phone_number: Joi.string(),
    other_contact_information: Joi.string().allow(null, ''),
    requirements: Joi.string().trim()
})

module.exports = {
    createJobSchema,
    updateJobSchema
}
