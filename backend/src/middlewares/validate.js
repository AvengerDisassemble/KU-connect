/**
 * @module middlewares/validate
 * @description Generic validation middleware
 */

/**
 * Wraps validation function for use as middleware
 * @param {Function} validationFn - Validation function
 * @returns {Function} Express middleware function
 */
function validate (validationFn) {
  return (req, res, next) => {
    // If the validation function is already a middleware, use it directly
    if (validationFn.length === 3) {
      return validationFn(req, res, next)
    }
    
    // Otherwise, wrap it
    const result = validationFn(req.body)
    
    if (result.error) {
      return res.status(400).json({
        error: result.error.details[0].message
      })
    }
    
    req.body = result.value
    next()
  }
}

module.exports = validate