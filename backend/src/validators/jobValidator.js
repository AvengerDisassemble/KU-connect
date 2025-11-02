/**
 * @module validators/jobValidator
 * @description Joi schemas for Job Posting feature
 */

const Joi = require("joi");

/**
 * Common reusable patterns
 */
const stringArray = Joi.array().items(Joi.string().trim().min(1).max(300));

/**
 * Phone regex pattern allows digits, spaces, dashes, parentheses, and plus sign.
 */
const phonePattern = /^[0-9+\-()\s]+$/;

/**
 * Create Job Schema (EMPLOYER only)
 * Prevents HR from manually submitting company name
 * Validates correct salary range, future date, and non-empty strings
 */
const createJobSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  companyName: Joi.forbidden(), // auto-filled from HR record
  description: Joi.string().trim().min(10).required(),
  location: Joi.string().trim().min(2).max(150).required(),

  jobType: Joi.string()
    .valid("internship", "part-time", "full-time", "contract")
    .required(),
  workArrangement: Joi.string().valid("on-site", "remote", "hybrid").required(),
  duration: Joi.string().trim().min(1).max(100).required(),

  minSalary: Joi.number().integer().min(0).required(),
  maxSalary: Joi.number().integer().min(Joi.ref("minSalary")).required(),

  application_deadline: Joi.date()
    .iso()
    .greater("now")
    .max("2100-01-01") // prevent absurdly far dates
    .required(),

  email: Joi.string().email().allow(null, "").optional(),
  phone_number: Joi.string()
    .pattern(phonePattern)
    .trim()
    .min(6)
    .max(30)
    .required(),
  other_contact_information: Joi.string()
    .trim()
    .max(300)
    .allow(null, "")
    .optional(),

  requirements: stringArray.default([]),
  qualifications: stringArray.default([]),
  responsibilities: stringArray.default([]),
  benefits: stringArray.default([]),
  tags: Joi.array()
    .items(Joi.string().trim().min(1).max(50))
    .unique()
    .default([]),
});

/**
 * Update Job Schema (EMPLOYER only)
 * Ensures HR cannot override companyName or invalid salary ranges
 * Requires at least one field
 */
const updateJobSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150),
  companyName: Joi.forbidden(),
  description: Joi.string().trim().min(10),
  location: Joi.string().trim().min(2).max(150),

  jobType: Joi.string().valid(
    "internship",
    "part-time",
    "full-time",
    "contract"
  ),
  workArrangement: Joi.string().valid("on-site", "remote", "hybrid"),
  duration: Joi.string().trim().min(1).max(100),

  minSalary: Joi.number().integer().min(0),
  maxSalary: Joi.number().integer().min(Joi.ref("minSalary")),

  application_deadline: Joi.date().iso().greater("now").max("2100-01-01"),

  email: Joi.string().email().allow(null, ""),
  phone_number: Joi.string().pattern(phonePattern).trim().min(6).max(30),

  other_contact_information: Joi.string().trim().max(300).allow(null, ""),

  requirements: stringArray,
  qualifications: stringArray,
  responsibilities: stringArray,
  benefits: stringArray,
  tags: Joi.array().items(Joi.string().trim().min(1).max(50)).unique(),
}).min(1);

/**
 * Student Applies to a Job
 * Resume link must be a valid HTTPS URL
 */
const applyJobSchema = Joi.object({
  resumeLink: Joi.string()
    .trim()
    .max(300)
    .required()
    .custom((value, helpers) => {
      const urlPattern = /^https?:\/\//i;
      const storagePattern = /^[^\s]+$/;

      if (urlPattern.test(value) || storagePattern.test(value)) {
        return value;
      }

      return helpers.error("any.invalid");
    }, "resume link validation")
    .messages({
      "any.invalid":
        "Resume link must be an https URL or storage key without spaces",
      "string.max": "Resume link must be shorter than 300 characters",
    }),
});

/**
 * Employer Manages Application
 * Only two allowed states
 */
const manageApplicationSchema = Joi.object({
  applicationId: Joi.string().required(),
  status: Joi.string().valid("QUALIFIED", "REJECTED").required(),
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  applyJobSchema,
  manageApplicationSchema,
};
