/**
 * Middleware wrapper for validation
 * Supports Joi schemas or custom validator functions
 */
module.exports = (schema) => (req, res, next) => {
  try {
    let value, error

    if (typeof schema === 'function' && schema.validate) {
      // Joi schema instance
      const result = schema.validate(req.body)
      value = result.value
      error = result.error
    } else if (schema && typeof schema.validate === 'function') {
      // If schema is a Joi object
      const result = schema.validate(req.body)
      value = result.value
      error = result.error
    } else if (typeof schema === 'function') {
      // Custom validator function
      return schema(req, res, next)
    } else {
      throw new Error('Invalid schema passed to validate()')
    }

    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    req.body = value
    next()
  } catch (err) {
    console.error('Validation middleware error:', err)
    res.status(500).json({ error: 'Validation error' })
  }
}
