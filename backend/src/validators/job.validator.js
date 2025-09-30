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
    hrId: Joi.number().integer().required(),
    title: Joi.string().max(255).required(),
    description: Joi.string().required(),
    location: Joi.string().max(255).required(),
    application_deadline: Joi.date().test('is-future').required(),
    email: Joi.string().email().required(),
    phone_number: Joi.string().pattern(/^[0-9+\-()\s]+$/).optional().allow(null, ''),
    other_contact_information: Joi.string().max(255).optional().allow(null, ''),
    requirements: Joi.string().optional().allow(null, '')
})

/**
 * Validation schema for updating a job posting
 */
const updateJobSchema = Joi.object({
    title: Joi.string().max(255).optional(),
    description: Joi.string().optional(),
    location: Joi.string().max(255).optional(),
    application_deadline: Joi.date().test('is-future').optional(),
    email: Joi.string().email().optional(),
    phone_number: Joi.string().pattern(/^[0-9+\-()\s]+$/).optional().allow(null, ''),
    other_contact_information: Joi.string().max(255).optional().allow(null, ''),
    requirements: Joi.string().optional().allow(null, '')
})

module.exports = {
    createJobSchema,
    updateJobSchema
}
