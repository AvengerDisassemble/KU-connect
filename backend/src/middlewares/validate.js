/**
 * @module middlewares/validate
 * @description Universal Joi validation middleware
 */

const Joi = require('joi')

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi schema object
 * @param {'body'|'query'|'params'} [property='body'] - Where to validate data from
 * @returns {Function} Express middleware
 */

function validate (schema, property = 'body') {
  // Defensive check
  if (!schema || typeof schema.validate !== 'function') {
    console.error('❌ Invalid Joi schema passed to validate():', schema)
    throw new TypeError('Validation schema must be a Joi schema object')
  }

  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    })

    if (error) {
      const messages = error.details.map(d => d.message)
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      })
    }

    req[property] = value
    next()
  }
}

module.exports = validate
