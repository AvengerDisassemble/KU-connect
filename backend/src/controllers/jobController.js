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
    req.log?.("info", "job.list", {
      userId: req.user?.id,
      ip: req.ip,
      filterKeys: Object.keys(filters || {}).length,
      count: Array.isArray(result?.jobs || result) ? (result.jobs || result).length : undefined,
    });
    res.status(200).json({
      success: true,
      message: "Jobs retrieved successfully",
      data: result,
    });
  } catch (error) {
    req.log?.("error", "job.list.error", {
      userId: req.user?.id,
      ip: req.ip,
      error: error.message,
    });
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
    req.log?.("info", "job.search", {
      userId: req.user?.id,
      ip: req.ip,
      query,
      count: Array.isArray(result) ? result.length : undefined,
    });
    res.status(200).json({
      success: true,
      message: "Search completed successfully",
      data: result,
    });
  } catch (error) {
    req.log?.("error", "job.search.error", {
      userId: req.user?.id,
      ip: req.ip,
      query: req.params?.query,
      error: error.message,
    });
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
      req.log?.("warn", "job.detail.not_found", {
        userId: req.user?.id,
        ip: req.ip,
        jobId,
      });
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    req.log?.("info", "job.detail", {
      userId: req.user?.id,
      ip: req.ip,
      jobId,
    });

    res.status(200).json({
      success: true,
      message: "Job retrieved successfully",
      data: job,
    });
  } catch (error) {
    req.log?.("error", "job.detail.error", {
      userId: req.user?.id,
      ip: req.ip,
      jobId: req.params?.id,
      error: error.message,
    });
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
      req.log?.("warn", "job.create.unauthorized_no_hr_profile", {
        userId,
        ip: req.ip,
      });
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

    req.log?.("info", "job.create.success", {
      userId,
      hrId: hr.id,
      companyName: hr.companyName,
      jobId: job.id,
      ip: req.ip,
    });
  } catch (error) {
    req.log?.("error", "job.create.error", {
      userId: req.user?.id,
      ip: req.ip,
      error: error.message,
    });
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
      req.log?.("warn", "job.update.unauthorized_no_hr_profile", {
        userId,
        jobId,
        ip: req.ip,
      });
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

    req.log?.("info", "job.update.success", {
      userId,
      jobId,
      hrId: hr.id,
      ip: req.ip,
    });
  } catch (error) {
    req.log?.("error", "job.update.error", {
      userId: req.user?.id,
      jobId: req.params?.id,
      ip: req.ip,
      error: error.message,
    });
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
      req.log?.("warn", "job.apply.unauthorized_no_student_profile", {
        userId,
        jobId,
        ip: req.ip,
      });
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
      req.log?.("warn", "job.apply.notification_failed", {
        userId,
        jobId,
        error: notificationError.message,
      });
      // Continue - application was successful even if notification failed
    }

    res.status(201).json({
      success: true,
      message: "Job application submitted successfully",
      data: application,
    });

    req.log?.("info", "job.apply.success", {
      userId,
      jobId,
      studentId: student.id,
      ip: req.ip,
    });
  } catch (error) {
    req.log?.("error", "job.apply.error", {
      userId: req.user?.id,
      jobId: req.params?.id,
      ip: req.ip,
      error: error.message,
    });
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
      req.log?.("warn", "job.applicants.unauthorized_no_hr_profile", {
        userId,
        jobId,
        ip: req.ip,
      });
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

    req.log?.("info", "job.applicants.fetch.success", {
      userId,
      jobId,
      applicantCount: applicants?.length,
      ip: req.ip,
    });
  } catch (error) {
    req.log?.("error", "job.applicants.fetch.error", {
      userId: req.user?.id,
      jobId: req.params?.id,
      ip: req.ip,
      error: error.message,
    });
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
      req.log?.("warn", "job.manage_application.unauthorized_no_hr_profile", {
        userId,
        jobId,
        ip: req.ip,
      });
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
      req.log?.("warn", "job.manage_application.notification_failed", {
        userId,
        jobId,
        applicationId,
        error: notificationError.message,
      });
      // Continue - application status was updated successfully
    }

    res.status(200).json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      data: result,
    });

    req.log?.("info", "job.manage_application.success", {
      userId,
      jobId,
      applicationId,
      status,
      ip: req.ip,
    });
  } catch (error) {
    req.log?.("error", "job.manage_application.error", {
      userId: req.user?.id,
      jobId: req.params?.id,
      applicationId: req.body?.applicationId,
      ip: req.ip,
      error: error.message,
    });
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

    req.log?.("info", "job.delete.success", {
      jobId,
      userId: requester?.id,
      role: requester?.role,
      ip: req.ip,
    });
  } catch (error) {
    req.log?.("error", "job.delete.error", {
      userId: req.user?.id,
      jobId: req.params?.id,
      ip: req.ip,
      error: error.message,
    });
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
    req.log?.("info", "job.filter", {
      userId: req.user?.id,
      ip: req.ip,
      filterKeys: Object.keys(req.query || {}).length,
      count: Array.isArray(data) ? data.length : undefined,
    });
    res.json({
      success: true,
      message: "Jobs filtered successfully",
      data,
    });
  } catch (err) {
    req.log?.("error", "job.filter.error", {
      userId: req.user?.id,
      ip: req.ip,
      error: err.message,
    });
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
      req.log?.("info", "job.applications.empty", {
        userId,
        ip: req.ip,
      });
      return res.status(200).json({
        success: true,
        message: "No applications submitted yet",
        data: [],
      });
    }

    req.log?.("info", "job.applications.list", {
      userId,
      ip: req.ip,
      count: applications.length,
    });

    res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      data: applications,
    });
  } catch (error) {
    req.log?.("error", "job.applications.error", {
      userId: req.user?.id,
      ip: req.ip,
      error: error.message,
    });
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
