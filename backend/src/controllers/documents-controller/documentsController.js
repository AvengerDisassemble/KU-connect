/**
 * @module controllers/documentsController
 * @description Controller for user document uploads (resume, transcript, employer verification)
 */

const storageProvider = require("../../services/storageFactory");
const prisma = require("../../models/prisma");
const {
  canViewStudentDocument,
  canViewHRDocument,
} = require("../../utils/documentAuthz");
const { logDocumentAccess } = require("../../utils/auditLogger");

/**
 * Upload student resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function uploadResume(req, res) {
  try {
    if (!req.file) {
      req.log?.("warn", "documents.resume.upload.missing_file", {
        ip: req.ip,
        userId: req.user?.id,
      });
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user.id;

    // Fetch student record
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true, resumeKey: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Best-effort delete old resume
    if (student.resumeKey) {
      try {
        await storageProvider.deleteFile(student.resumeKey);
      } catch (error) {
        req.log?.("warn", "documents.resume.upload.cleanup_failed", {
          ip: req.ip,
          userId,
          error: error.message,
        });
      }
    }

    // Upload new resume
    const fileKey = await storageProvider.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { prefix: "resumes" },
    );

    // Update student record
    await prisma.student.update({
      where: { userId },
      data: { resumeKey: fileKey },
    });

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      data: { fileKey },
    });

    req.log?.("info", "documents.resume.upload.success", {
      ip: req.ip,
      userId,
      fileKey,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    req.log?.("error", "documents.resume.upload.error", {
      ip: req.ip,
      userId: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to upload resume",
    });
  }
}

/**
 * Upload student transcript
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function uploadTranscript(req, res) {
  try {
    if (!req.file) {
      req.log?.("warn", "documents.transcript.upload.missing_file", {
        ip: req.ip,
        userId: req.user?.id,
      });
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user.id;

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true, transcriptKey: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Best-effort delete old transcript
    if (student.transcriptKey) {
      try {
        await storageProvider.deleteFile(student.transcriptKey);
      } catch (error) {
        req.log?.("warn", "documents.transcript.upload.cleanup_failed", {
          ip: req.ip,
          userId,
          error: error.message,
        });
      }
    }

    // Upload new transcript
    const fileKey = await storageProvider.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { prefix: "transcripts" },
    );

    // Update student record
    await prisma.student.update({
      where: { userId },
      data: { transcriptKey: fileKey },
    });

    res.status(200).json({
      success: true,
      message: "Transcript uploaded successfully",
      data: { fileKey },
    });

    req.log?.("info", "documents.transcript.upload.success", {
      ip: req.ip,
      userId,
      fileKey,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    req.log?.("error", "documents.transcript.upload.error", {
      ip: req.ip,
      userId: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to upload transcript",
    });
  }
}

/**
 * Upload employer verification document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function uploadEmployerVerification(req, res) {
  try {
    if (!req.file) {
      req.log?.("warn", "documents.employer_verification.upload.missing_file", {
        ip: req.ip,
        userId: req.user?.id,
      });
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user.id;

    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true, verificationDocKey: true },
    });

    if (!hr) {
      return res.status(404).json({
        success: false,
        message: "HR profile not found",
      });
    }

    // Best-effort delete old verification doc
    if (hr.verificationDocKey) {
      try {
        await storageProvider.deleteFile(hr.verificationDocKey);
      } catch (error) {
        req.log?.(
          "warn",
          "documents.employer_verification.upload.cleanup_failed",
          {
            ip: req.ip,
            userId,
            error: error.message,
          },
        );
      }
    }

    // Upload new verification document
    const fileKey = await storageProvider.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { prefix: "employer-docs" },
    );

    // Update HR record
    await prisma.hR.update({
      where: { userId },
      data: { verificationDocKey: fileKey },
    });

    res.status(200).json({
      success: true,
      message: "Employer verification document uploaded successfully",
      data: { fileKey },
    });

    req.log?.("info", "documents.employer_verification.upload.success", {
      ip: req.ip,
      userId,
      fileKey,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    req.log?.("error", "documents.employer_verification.upload.error", {
      ip: req.ip,
      userId: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to upload employer verification document",
    });
  }
}

/**
 * Download resume file (protected)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function downloadResume(req, res) {
  try {
    const requestedUserId = req.params.userId;
    const requester = req.user;

    // Authorization check
    const isAuthorized = await canViewStudentDocument(requester, requestedUserId);
    if (!isAuthorized) {
      logDocumentAccess({
        userId: requester.id,
        documentType: "resume",
        documentOwner: requestedUserId,
        action: "download",
        success: false,
        reason: "Access denied",
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

    const student = await prisma.student.findUnique({
      where: { userId: requestedUserId },
      select: { resumeKey: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    if (!student.resumeKey) {
      return res.status(404).json({
        success: false,
        message: "No resume found for this student",
      });
    }

    // Log successful access
    logDocumentAccess({
      userId: requester.id,
      documentType: "resume",
      documentOwner: requestedUserId,
      action: "download",
      success: true,
      ip: req.ip,
      logger: req.log,
      correlationId: req.correlationId,
      userAgent: req.get("user-agent"),
    });

    // Try signed URL first (S3), fallback to streaming (local)
    const signedUrl = await storageProvider.getSignedDownloadUrl(
      student.resumeKey,
    );

    if (signedUrl) {
      // Redirect to signed URL
      return res.redirect(signedUrl);
    }

    // Stream the file
    const { stream, mimeType, filename } = await storageProvider.getReadStream(
      student.resumeKey,
    );

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    stream.pipe(res);
  } catch (error) {
    req.log?.("error", "documents.resume.download.error", {
      ip: req.ip,
      userId: req.user?.id,
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
      message: "Failed to download resume",
    });
  }
}

/**
 * Download transcript file (protected)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function downloadTranscript(req, res) {
  try {
    const requestedUserId = req.params.userId;
    const requester = req.user;

    // Authorization check
    const isAuthorized = await canViewStudentDocument(requester, requestedUserId);
    if (!isAuthorized) {
      logDocumentAccess({
        userId: requester.id,
        documentType: "transcript",
        documentOwner: requestedUserId,
        action: "download",
        success: false,
        reason: "Access denied",
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

    const student = await prisma.student.findUnique({
      where: { userId: requestedUserId },
      select: { transcriptKey: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    if (!student.transcriptKey) {
      return res.status(404).json({
        success: false,
        message: "No transcript found for this student",
      });
    }

    logDocumentAccess({
      userId: requester.id,
      documentType: "transcript",
      documentOwner: requestedUserId,
      action: "download",
      success: true,
      ip: req.ip,
      logger: req.log,
      correlationId: req.correlationId,
      userAgent: req.get("user-agent"),
    });

    // Try signed URL first (S3), fallback to streaming (local)
    const signedUrl = await storageProvider.getSignedDownloadUrl(
      student.transcriptKey,
    );

    if (signedUrl) {
      return res.redirect(signedUrl);
    }

    // Stream the file
    const { stream, mimeType, filename } = await storageProvider.getReadStream(
      student.transcriptKey,
    );

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    stream.pipe(res);
  } catch (error) {
    req.log?.("error", "documents.transcript.download.error", {
      ip: req.ip,
      userId: req.user?.id,
      error: error.message,
    });

    if (error.message.includes("File not found")) {
      return res.status(404).json({
        success: false,
        message: "Transcript file not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to download transcript",
    });
  }
}

/**
 * Download employer verification document (protected)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function downloadEmployerVerification(req, res) {
  try {
    const requestedUserId = req.params.userId;
    const requester = req.user;

    // Authorization check
    if (!canViewHRDocument(requester, requestedUserId)) {
      logDocumentAccess({
        userId: requester.id,
        documentType: "employer-verification",
        documentOwner: requestedUserId,
        action: "download",
        success: false,
        reason: "Access denied",
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

    const hr = await prisma.hR.findUnique({
      where: { userId: requestedUserId },
      select: { verificationDocKey: true },
    });

    if (!hr) {
      return res.status(404).json({
        success: false,
        message: "HR profile not found",
      });
    }

    if (!hr.verificationDocKey) {
      return res.status(404).json({
        success: false,
        message: "No verification document found for this employer",
      });
    }

    logDocumentAccess({
      userId: requester.id,
      documentType: "employer-verification",
      documentOwner: requestedUserId,
      action: "download",
      success: true,
      ip: req.ip,
      logger: req.log,
      correlationId: req.correlationId,
      userAgent: req.get("user-agent"),
    });

    // Try signed URL first (S3), fallback to streaming (local)
    const signedUrl = await storageProvider.getSignedDownloadUrl(
      hr.verificationDocKey,
    );

    if (signedUrl) {
      return res.redirect(signedUrl);
    }

    // Stream the file
    const { stream, mimeType, filename } = await storageProvider.getReadStream(
      hr.verificationDocKey,
    );

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    stream.pipe(res);
  } catch (error) {
    req.log?.("error", "documents.employer_verification.download.error", {
      ip: req.ip,
      userId: req.user?.id,
      error: error.message,
    });

    if (error.message.includes("File not found")) {
      return res.status(404).json({
        success: false,
        message: "Verification document file not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to download employer verification document",
    });
  }
}

/**
 * Upload student verification document (for unverified accounts)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function uploadStudentVerification(req, res) {
  try {
    if (!req.file) {
      req.log?.("warn", "documents.student_verification.upload.missing_file", {
        ip: req.ip,
        userId: req.user?.id,
      });
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user.id;

    // Fetch student record
    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        id: true,
        verificationDocKey: true,
        user: {
          select: { verified: true },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Allow only unverified students to upload verification docs
    if (student.user.verified) {
      return res.status(400).json({
        success: false,
        message: "Your account is already verified",
      });
    }

    // Best-effort delete old verification document
    if (student.verificationDocKey) {
      try {
        await storageProvider.deleteFile(student.verificationDocKey);
      } catch (error) {
        req.log?.(
          "warn",
          "documents.student_verification.upload.cleanup_failed",
          {
            ip: req.ip,
            userId,
            error: error.message,
          },
        );
      }
    }

    // Upload new verification document
    const fileName = `student-verification-${userId}-${Date.now()}.${req.file.mimetype.split("/")[1]}`;
    const fileKey = await storageProvider.uploadFile(
      req.file.buffer,
      fileName,
      req.file.mimetype,
      { prefix: "student-verifications" },
    );

    // Update student record
    await prisma.student.update({
      where: { userId },
      data: { verificationDocKey: fileKey },
    });

    res.status(200).json({
      success: true,
      message:
        "Student verification document uploaded successfully. Pending admin review.",
    });

    req.log?.("info", "documents.student_verification.upload.success", {
      ip: req.ip,
      userId,
      fileKey,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    req.log?.("error", "documents.student_verification.upload.error", {
      ip: req.ip,
      userId: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to upload student verification document",
    });
  }
}

/**
 * Download student verification document (protected)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function downloadStudentVerification(req, res) {
  try {
    const { userId } = req.params;
    const requester = req.user;

    // Only admins or the student themselves can download verification
    if (requester.role !== "ADMIN" && requester.id !== userId) {
      logDocumentAccess({
        userId: requester.id,
        documentType: "student-verification",
        documentOwner: userId,
        action: "download",
        success: false,
        reason: "Access denied",
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

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { verificationDocKey: true },
    });

    if (!student || !student.verificationDocKey) {
      return res.status(404).json({
        success: false,
        message: "Student verification document not found",
      });
    }

    // Log successful access
    logDocumentAccess({
      userId: requester.id,
      documentType: "student-verification",
      documentOwner: userId,
      action: "download",
      success: true,
      ip: req.ip,
      logger: req.log,
      correlationId: req.correlationId,
      userAgent: req.get("user-agent"),
    });

    // Try signed URL first (S3), fallback to streaming (local)
    const signedUrl = await storageProvider.getSignedDownloadUrl(
      student.verificationDocKey,
    );

    if (signedUrl) {
      return res.redirect(signedUrl);
    }

    // Stream the file
    const { stream, mimeType, filename } = await storageProvider.getReadStream(
      student.verificationDocKey,
    );

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    stream.pipe(res);
  } catch (error) {
    req.log?.("error", "documents.student_verification.download.error", {
      ip: req.ip,
      userId: req.user?.id,
      error: error.message,
    });

    if (error.message.includes("File not found")) {
      return res.status(404).json({
        success: false,
        message: "Student verification document file not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to download student verification document",
    });
  }
}

module.exports = {
  uploadResume,
  downloadResume,
  uploadTranscript,
  downloadTranscript,
  uploadEmployerVerification,
  downloadEmployerVerification,
  uploadStudentVerification,
  downloadStudentVerification,
};
