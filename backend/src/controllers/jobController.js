/**
 * @module controllers/jobController
 * @description Controller for Job Posting feature (with authentication + role-based access)
 */

const prisma = require('../models/prisma')
const jobService = require('../services/jobService')
const notificationService = require('../services/notificationService')

/**
 * List jobs with pagination (public)
 * @route POST /api/job/list
 *
 * SECURITY NOTE: Sensitive filters (minSalary, maxSalary) MUST be sent in the HTTP request body.
 * Do NOT allow sensitive filters in query parameters. This prevents exposure via:
 * - Server logs
 * - Browser history
 * - Referrer headers
 * - Proxy servers
 * Use POST with request body for all filtering operations.
 */
async function listJobs(req, res) {
  try {
    // Read filters from request body (POST), not query parameters (GET)
    // This ensures sensitive data like salary ranges are not exposed in URLs
    const filters = req.body;

    const result = await jobService.listJobs(filters);
    res.status(200).json({
      success: true,
      message: "Jobs retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("List jobs error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to list jobs",
    });
  }
}

/**
 * Search jobs by keyword (public)
 * @route GET /api/job/search/:query
 */
async function searchJobs(req, res) {
  try {
    const query = req.params.query;
    const result = await jobService.searchJobs(query);
    res.status(200).json({
      success: true,
      message: "Search completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Search jobs error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to search jobs",
    });
  }
}

/**
 * Get job by ID (public)
 * @route GET /api/job/:id
 */
async function getJobById(req, res) {
  try {
    const jobId = req.params.id;
    const job = await jobService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job retrieved successfully",
      data: job,
    });
  } catch (error) {
    console.error("Get job by ID error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get job",
    });
  }
}

/**
 * Create job posting (HR only)
 * @route POST /api/job
 */
async function createJob(req, res) {
  try {
    const userId = req.user.id;

    // Find the HR profile linked to this user
    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true, companyName: true },
    });

    if (!hr) {
      return res.status(403).json({
        success: false,
        message: "You must have an HR profile to post a job",
      });
    }

    const job = await jobService.createJob(hr.id, req.body);

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error("Create job error:", error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create job",
    });
  }
}

/**
 * Update job posting (HR only, must own job)
 * @route PATCH /api/job/:id
 */
async function updateJob(req, res) {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;

    // Resolve HR ID from userId
    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!hr) {
      return res.status(403).json({
        success: false,
        message: "Only HR users can update jobs",
      });
    }

    const updated = await jobService.updateJob(jobId, hr.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Job not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update job error:", error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update job",
    });
  }
}

/**
 * Student applies to a job
 * @route POST /api/job/:id
 */
async function applyToJob(req, res) {
  try {
    const userId = req.user.id;

    // Find student profile linked to this user
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Only students can apply to jobs",
      });
    }

    const jobId = req.params.id;
    const { resumeLink } = req.body;

    const application = await jobService.applyToJob(jobId, student.id, resumeLink)

    // Send notification to employer (don't fail if notification fails)
    try {
      await notificationService.notifyEmployerOfApplication({
        studentUserId: userId,
        jobId
      })
    } catch (notificationError) {
      console.error('Failed to send employer notification:', notificationError.message)
      // Continue - application was successful even if notification failed
    }

    res.status(201).json({
      success: true,
      message: "Job application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Apply to job error:", error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to apply for job",
    });
  }
}

/**
 * HR gets applicants for their job
 * @route GET /api/job/:id/applyer
 */
async function getApplicants(req, res) {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;

    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!hr) {
      return res.status(403).json({
        success: false,
        message: "Only HR users can view applicants",
      });
    }

    const applicants = await jobService.getApplicants(jobId, hr.id);
    if (!applicants) {
      return res.status(404).json({
        success: false,
        message: "Job not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Applicants retrieved successfully",
      data: applicants,
    });
  } catch (error) {
    console.error("Get applicants error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve applicants",
    });
  }
}

/**
 * HR manages application status (QUALIFIED / REJECTED)
 * @route PATCH /api/job/:id/applyer
 */
async function manageApplication(req, res) {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;
    const { applicationId, status } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!hr) {
      return res.status(403).json({
        success: false,
        message: "Only HR users can manage applications",
      });
    }

    const result = await jobService.manageApplication(
      jobId,
      hr.id,
      applicationId,
      status,
    );
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized'
      })
    }

    // Send notification to student (don't fail if notification fails)
    try {
      // Resolve student user ID from application
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          student: {
            select: { userId: true }
          }
        }
      })

      if (application && application.student) {
        await notificationService.notifyStudentOfApproval({
          employerUserId: userId,
          studentUserId: application.student.userId,
          jobId,
          status,
          applicationId
        })
      }
    } catch (notificationError) {
      console.error('Failed to send student notification:', notificationError.message)
      // Continue - application status was updated successfully
    }

    res.status(200).json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Manage application error:", error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update application status",
    });
  }
}

/**
 * Deletes a job posting (Admin or HR owner)
 * @route DELETE /api/job/:id
 */
async function deleteJob(req, res) {
  try {
    const jobId = req.params.id;
    const requester = req.user;

    const deleted = await jobService.deleteJob(jobId, requester);

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Delete job error:", error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete job",
    });
  }
}

/**
 * Filter jobs by tags, title, and company with pagination
 * @route GET /api/job/filter
 */
async function filterJobs(req, res) {
  try {
    const data = await jobService.filterJobs(req.query);
    res.json({
      success: true,
      message: "Jobs filtered successfully",
      data,
    });
  } catch (err) {
    console.error("Filter jobs error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to filter jobs",
    });
  }
}

/**
 * Get all applications for the authenticated student
 * UC-S09: Check Application Status
 * @route GET /api/job/my-applications
 */
async function getMyApplications(req, res) {
  try {
    const userId = req.user.id;
    const applications = await jobService.getMyApplications(userId);

    // Handle empty state
    if (applications.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No applications submitted yet",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      data: applications,
    });
  } catch (error) {
    console.error("Get my applications error:", error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to retrieve applications",
    });
  }
}

module.exports = {
  listJobs,
  searchJobs,
  getJobById,
  createJob,
  updateJob,
  applyToJob,
  getApplicants,
  manageApplication,
  deleteJob,
  filterJobs,
  getMyApplications,
};
