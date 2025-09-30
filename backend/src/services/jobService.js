/**
 * @module services/jobService
 * @description Service layer for job management operations
 */

const prisma = require('../models/prisma')

/**
 * Creates a new job posting
 * @param {Object} data - Job data
 * @param {number} data.hrId - HR ID
 * @param {string} data.title - Job title
 * @param {string} data.description - Job description
 * @param {string} data.location - Job location
 * @param {Date} data.application_deadline - Application deadline
 * @param {string} data.email - Contact email
 * @param {string} [data.phone_number] - Contact phone number
 * @param {string} [data.other_contact_information] - Other contact information
 * @param {string} [data.requirements] - Job requirements
 * @returns {Promise<Object>} Created job posting
 */

async function createJob (data) {
    const {
        hrId,
        title,
        description,
        location,
        application_deadline,
        email,
        phone_number,
        other_contact_information,
        requirements
    } = data

    return prisma.job.create({
        data: {
            hrId,
            title,
            description,
            location,
            application_deadline: new Date(application_deadline),
            email,
            phone_number,
            other_contact_information,
            requirements
        },
        include: { hr: true }
    })
}

/**
 * Updates an existing job posting
 * @param {number} jobId - Job ID
 * @param {Object} data - Update data
 * @param {string} [data.title] - New job title
 * @param {string} [data.description] - New job description
 * @param {string} [data.location] - New job location
 * @param {Date} [data.application_deadline] - New application deadline
 * @param {string} [data.email] - New contact email
 * @param {string} [data.phone_number] - New contact phone number
 * @param {string} [data.other_contact_information] - New other contact information
 * @param {string} [data.requirements] - New job requirements
 * @returns {Promise<Object>} Updated job posting
 */

async function updateJob (jobId, data) {
    const {
        title,
        description,
        location,
        application_deadline,
        email,
        phone_number,
        other_contact_information,
        requirements
    } = data
    
    if (application_deadline) {
        data.application_deadline = new Date(application_deadline)
    }

    return prisma.job.update({
        where: { id: jobId },
        data: {
            title,
            description,
            location,
            application_deadline,
            email,
            phone_number,
            other_contact_information,
            requirements
        },
        include: { hr: true }
    })
}

/**
 * Deletes a job posting
 * @param {number} jobId - Job ID
 * @returns {Promise<Object>} Deleted job posting
 */

async function deleteJob (jobId) {
    return prisma.job.delete({
        where: { id: jobId },
        include: { hr: true }
    })
}

/**
 * Fetches a job posting by ID
 * @param {number} jobId - Job ID
 * @returns {Promise<Object|null>} Job posting or null if not found
 */ 

async function getJobById (jobId) {
    return prisma.job.findUnique({
        where: { id: jobId },
        include: { hr: true }
    })
}

/**
* Lists all job postings
* @returns {Promise<Array>} Array of job postings
*/
async function listJobs () {
    return prisma.job.findMany({    
        include: { hr: true }
    })
}

module.exports = {
    createJob,
    updateJob,
    deleteJob,
    getJobById,
    listJobs
}
