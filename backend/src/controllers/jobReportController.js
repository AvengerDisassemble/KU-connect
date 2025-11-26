/**
 * @module controllers/jobReportController
 * @description Express handlers for job report system
 */

const jobReportService = require("../services/jobReportService");

/**
 * Creates a job report (non-owner only)
 * @route POST /api/job/:id/report
 */
async function createReport(req, res) {
  try {
    const userId = req.user.id;
    const jobId = req.params.id; // Keep as string (cuid)
    const { reason } = req.body;

    // Basic input validation
    if (!jobId || typeof jobId !== "string") {
      req.log?.("warn", "job.report.create.invalid_job_id", {
        userId,
        ip: req.ip,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    if (!reason || reason.trim().length < 10) {
      req.log?.("warn", "job.report.create.invalid_reason", {
        userId,
        ip: req.ip,
      });
      return res.status(400).json({
        success: false,
        message: "Reason must be at least 10 characters long",
      });
    }

    // Prevent EMPLOYER from reporting their own job
    // Why: fetch HR data directly without modifying authService
    if (req.user.role === "EMPLOYER") {
      const isOwner = await jobReportService.isJobOwnedByUser(jobId, userId);
      if (isOwner) {
        req.log?.("warn", "job.report.create.denied_owner", {
          userId,
          jobId,
          ip: req.ip,
        });
        return res.status(403).json({
          success: false,
          message: "You cannot report your own job posting",
        });
      }
    }

    // Create report
    const report = await jobReportService.createReport(userId, jobId, reason);

    req.log?.("info", "job.report.create", {
      userId,
      jobId,
      reportId: report.id,
      ip: req.ip,
    });
    res.status(201).json({
      success: true,
      message: "Job report submitted successfully",
      data: report,
    });
  } catch (err) {
    req.log?.("error", "job.report.create.error", {
      userId: req.user?.id,
      jobId: req.params?.id,
      ip: req.ip,
      error: err.message,
    });

    // Handle known custom errors from service
    if (err.code === "DUPLICATE_REPORT") {
      return res.status(400).json({
        success: false,
        message: "You have already reported this job",
      });
    }

    if (err.code === "JOB_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (err.code === "OWNER_REPORT") {
      return res.status(403).json({
        success: false,
        message: "You cannot report your own job posting",
      });
    }

    // Generic fallback
    res.status(500).json({
      success: false,
      message: "Failed to submit report",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

/**
 * Lists all job reports (Admin only)
 * @route GET /api/job/reports
 */
async function listReports(req, res) {
  try {
    const reports = await jobReportService.listReports();
    if (!reports || reports.length === 0) {
      req.log?.("info", "job.report.list.empty", {
        userId: req.user?.id,
        ip: req.ip,
      });
      return res.status(200).json({
        success: true,
        message: "No job reports found",
        data: [],
      });
    }

    req.log?.("security", "job.report.list", {
      userId: req.user?.id,
      ip: req.ip,
      count: reports.length,
    });
    res.status(200).json({
      success: true,
      message: "All job reports retrieved successfully",
      data: reports,
    });
  } catch (err) {
    req.log?.("error", "job.report.list.error", {
      userId: req.user?.id,
      ip: req.ip,
      error: err.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch job reports",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

/**
 * Deletes a job report (Admin only)
 * @route DELETE /api/job/reports/:reportId
 */
async function deleteReport(req, res) {
  try {
    const reportId = req.params.reportId; // Keep as string (cuid)

    if (!reportId || typeof reportId !== "string") {
      req.log?.("warn", "job.report.delete.invalid_id", {
        userId: req.user?.id,
        ip: req.ip,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const deleted = await jobReportService.deleteReport(reportId);
    if (!deleted) {
      req.log?.("warn", "job.report.delete.not_found", {
        userId: req.user?.id,
        reportId,
        ip: req.ip,
      });
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    req.log?.("security", "job.report.delete", {
      userId: req.user?.id,
      reportId,
      ip: req.ip,
    });
    res.status(200).json({
      success: true,
      message: "Job report deleted successfully",
      data: deleted,
    });
  } catch (err) {
    req.log?.("error", "job.report.delete.error", {
      userId: req.user?.id,
      reportId: req.params?.reportId,
      ip: req.ip,
      error: err.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete job report",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

module.exports = {
  createReport,
  listReports,
  deleteReport,
};
