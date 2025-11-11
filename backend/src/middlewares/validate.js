/**
 * @module middlewares/validate
 * @description Universal Joi validation middleware with async custom handler support
 */

const Joi = require("joi");

/**
 * Validates request body, query, or params against a Joi schema
 * or runs a custom async validator middleware function.
 *
 * @param {Joi.ObjectSchema|Function} schema - Joi schema or async validator function
 * @param {'body'|'query'|'params'} [property='body'] - Request property to validate
 * @returns {Function} Express middleware
 */
function validate(schema, property = "body") {
  return async (req, res, next) => {
    try {
      // ✅ Allow async custom validators (e.g., updateProfile)
      if (typeof schema === "function" && !schema.isJoi) {
        return await schema(req, res, next);
      }

      // ✅ Ensure it's a valid Joi schema
      if (!schema || typeof schema.validate !== "function") {
        throw new TypeError(
          "Validation schema must be a Joi schema object or a custom validator function",
        );
      }

      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        allowUnknown: true, // allow extra fields (like role)
        stripUnknown: true, // remove unrecognized fields
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details.map((d) => d.message).join(", "),
        });
      }

      // Replace request data with validated data
      req[property] = value;
      next();
    } catch (err) {
      console.error("Validation error:", err);
      res.status(500).json({
        success: false,
        message: "Internal validation error",
      });
    }
  };
}

module.exports = { validate };
