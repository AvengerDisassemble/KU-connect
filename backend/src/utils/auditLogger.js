const { withContext } = require("./logger");

/**
 * @module utils/auditLogger
 * @description Audit logging utility for document access
 */

/**
 * Log document access attempt using structured logger (falls back to console logger)
 * @param {Object} params - Log parameters
 * @param {string} params.userId - User who accessed the document
 * @param {string} params.documentType - Type of document (resume, transcript, etc.)
 * @param {string} params.documentOwner - Owner of the document
 * @param {string} params.action - Action performed (view, download, upload, delete)
 * @param {boolean} params.success - Whether access was successful
 * @param {string} [params.reason] - Reason for failure if not successful
 * @param {string} [params.ip] - IP address of requester
 * @param {(level: string, message: string, meta?: object) => void} [params.logger] - Request-scoped logger (req.log)
 * @param {string} [params.correlationId] - Correlation ID when no req.log is available
 * @param {string} [params.userAgent] - User agent when no req.log is available
 */
function logDocumentAccess({
  userId,
  documentType,
  documentOwner,
  action,
  success,
  reason,
  ip,
  logger,
  correlationId,
  userAgent,
}) {
  const logFn =
    logger ||
    withContext({
      correlationId,
      userAgent,
    });

  logFn("info", "audit.document.access", {
    userId,
    documentType,
    documentOwner,
    action,
    success,
    reason,
    ip,
  });
}

module.exports = {
  logDocumentAccess,
};
