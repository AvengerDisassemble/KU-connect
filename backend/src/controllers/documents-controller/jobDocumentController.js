/**
 * @module controllers/documents-controller/jobDocumentController
 * @description Controller for job-specific resume uploads and management
 */

const storageProvider = require("../../services/storageFactory");
const prisma = require("../../models/prisma");
const { canViewJobResume } = require("../../utils/documentAuthz");
const { logDocumentAccess } = require("../../utils/auditLogger");

/**
 * Helper function to check if a user is the HR owner of a job
 * @param {Object} user - The authenticated user object
 * @param {Object} job - The job object with hrId
 * @returns {Promise<boolean>}
 */
async function isHrOwnerOfJob(user, job) {
  if (user.role !== "EMPLOYER") {
    return false;
  }

  try {
    const hr = await prisma.hR.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    return hr && hr.id === job.hrId;
  } catch (error) {
    // Swallow and return false; caller logs if needed
    return false;
  }
}

/**
 * Upsert job application resume - allows student to either use profile resume or upload a new one
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function upsertJobResume(req, res) {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Validate job and student
    const [job, student] = await Promise.all([
      prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, hrId: true },
      }),
      prisma.student.findUnique({
        where: { userId },
        select: { id: true, resumeKey: true },
      }),
    ]);

    if (!job) {
      req.log?.("warn", "job.resume.upsert.job_not_found", {
        userId,
        jobId,
        ip: req.ip,
      });
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (!student) {
      req.log?.("warn", "job.resume.upsert.student_not_found", {
        userId,
        jobId,
        ip: req.ip,
      });
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Determine mode: 'profile' or 'upload'
    const mode = req.body?.mode || (req.file ? "upload" : "profile");

    if (!["profile", "upload"].includes(mode)) {
      req.log?.("warn", "job.resume.upsert.invalid_mode", {
        userId,
        jobId,
        mode,
        ip: req.ip,
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid mode. Must be "profile" or "upload"',
      });
    }

    let fileKey;
    let source = "UPLOADED";

    if (mode === "profile") {
      // Use profile resume
      if (!student.resumeKey) {
        req.log?.("warn", "job.resume.upsert.profile_missing", {
          userId,
          jobId,
          ip: req.ip,
        });
        return res.status(400).json({
          success: false,
          message:
            "No profile resume found. Please upload a profile resume first or upload a resume for this job",
        });
      }
      fileKey = student.resumeKey;
      source = "PROFILE";
    } else {
      // Upload new resume
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Upload file with job-specific prefix
      fileKey = await storageProvider.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        { prefix: `resumes/job-applications/${job.id}` },
      );
      source = "UPLOADED";
    }

    // Check for existing resume to enable cleanup
    const existing = await prisma.resume
      .findUnique({
        where: {
          studentId_jobId: {
            studentId: student.id,
            jobId: job.id,
          },
        },
        select: { link: true, source: true },
      })
      .catch(() => null);

    // Upsert resume record
    const saved = await prisma.resume.upsert({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: job.id,
        },
      },
      create: {
        studentId: student.id,
        jobId: job.id,
        link: fileKey,
        source,
      },
      update: {
        link: fileKey,
        source,
      },
    });

    // Cleanup old uploaded file (if different from profile and different from new file)
    if (
      existing?.link &&
      existing.link !== student.resumeKey &&
      existing.link !== fileKey
    ) {
      try {
        await storageProvider.deleteFile(existing.link);
        req.log?.("info", "job.resume.cleanup_old", {
          userId,
          jobId,
          oldKey: existing.link,
          ip: req.ip,
        });
      } catch (error) {
        req.log?.("warn", "job.resume.cleanup_failed", {
          userId,
          jobId,
          ip: req.ip,
          error: error.message,
        });
      }
    }

    req.log?.("info", "job.resume.upsert.success", {
      userId,
      jobId,
      studentId: student.id,
      fileKey,
      source,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Job resume saved successfully",
      data: {
        jobId: job.id,
        link: saved.link,
        source: saved.source,
      },
    });
  } catch (error) {
    req.log?.("error", "job.resume.upsert.error", {
      userId: req.user?.id,
      jobId: req.params?.jobId,
      ip: req.ip,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to save job resume",
    });
  }
}

/**
 * Delete job application resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function deleteJobResume(req, res) {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true, resumeKey: true },
    });

    if (!student) {
      req.log?.("warn", "job.resume.delete.student_not_found", {
        userId,
        jobId,
        ip: req.ip,
      });
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Get existing resume
    const resume = await prisma.resume.findUnique({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: jobId,
        },
      },
      select: { link: true, source: true },
    });

    if (!resume) {
      req.log?.("warn", "job.resume.delete.not_found", {
        userId,
        jobId,
        ip: req.ip,
      });
      return res.status(404).json({
        success: false,
        message: "No resume found for this job application",
      });
    }

    // Delete the resume record
    await prisma.resume.delete({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: jobId,
        },
      },
    });

    // If it was an uploaded file (not profile), delete the file from storage
    if (resume.source === "UPLOADED" && resume.link !== student.resumeKey) {
      try {
        await storageProvider.deleteFile(resume.link);
        req.log?.("info", "job.resume.delete.cleanup_file", {
          userId,
          jobId,
          fileKey: resume.link,
          ip: req.ip,
        });
      } catch (error) {
        req.log?.("warn", "job.resume.delete.cleanup_failed", {
          userId,
          jobId,
          ip: req.ip,
          error: error.message,
        });
      }
    }

    req.log?.("info", "job.resume.delete.success", {
      userId,
      jobId,
      ip: req.ip,
    });
    res.status(200).json({
      success: true,
      message: "Job resume deleted successfully",
    });
  } catch (error) {
    req.log?.("error", "job.resume.delete.error", {
      userId: req.user?.id,
      jobId: req.params?.jobId,
      ip: req.ip,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete job resume",
    });
  }
}

/**
 * Download job application resume (protected)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function downloadJobResume(req, res) {
  try {
    const { jobId, studentUserId } = req.params;
    const requester = req.user;

    // Authorization check
    const isAuthorized = await canViewJobResume(
      requester,
      jobId,
      studentUserId,
    );

    if (!isAuthorized) {
      logDocumentAccess({
        userId: requester.id,
        documentType: "job-resume",
        documentOwner: studentUserId,
        action: "download",
        success: false,
        reason: `Access denied for job ${jobId}`,
        ip: req.ip,
        logger: req.log,
        correlationId: req.correlationId,
        userAgent: req.get("user-agent"),
      });

      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      select: { id: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Get resume record
    const resume = await prisma.resume.findUnique({
      where: {
        studentId_jobId: {
          studentId: student.id,
          jobId: jobId,
        },
      },
      select: { link: true },
    });

    if (!resume || !resume.link) {
      req.log?.("warn", "job.resume.download.not_found", {
        userId: requester.id,
        jobId,
        studentUserId,
        ip: req.ip,
      });
      return res.status(404).json({
        success: false,
        message: "No resume found for this job application",
      });
    }

    // Log successful access
    logDocumentAccess({
      userId: requester.id,
      documentType: "job-resume",
      documentOwner: studentUserId,
      action: "download",
      success: true,
      ip: req.ip,
      logger: req.log,
      correlationId: req.correlationId,
      userAgent: req.get("user-agent"),
    });

    // Try signed URL first (S3), fallback to streaming (local)
    const signedUrl = await storageProvider.getSignedDownloadUrl(resume.link);

    if (signedUrl) {
      req.log?.("info", "job.resume.download.redirect", {
        userId: requester.id,
        jobId,
        studentUserId,
        ip: req.ip,
      });
      return res.redirect(signedUrl);
    }

    // Stream the file
    const { stream, mimeType, filename } = await storageProvider.getReadStream(
      resume.link,
    );

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    stream.pipe(res);

    req.log?.("info", "job.resume.download.stream", {
      userId: requester.id,
      jobId,
      studentUserId,
      fileKey: resume.link,
      ip: req.ip,
    });
  } catch (error) {
    req.log?.("error", "job.resume.download.error", {
      userId: req.user?.id,
      jobId: req.params?.jobId,
      studentUserId: req.params?.studentUserId,
      ip: req.ip,
      error: error.message,
    });

    if (error.message.includes("File not found")) {
      return res.status(404).json({
        success: false,
        message: "Resume file not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to download job resume",
    });
  }
}

module.exports = {
  upsertJobResume,
  deleteJobResume,
  downloadJobResume,
};
