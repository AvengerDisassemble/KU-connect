/**
 * @module utils/auditLogger
 * @description Audit logging utility for document access
 */

/**
 * Log document access attempt
 * @param {Object} params - Log parameters
 * @param {string} params.userId - User who accessed the document
 * @param {string} params.documentType - Type of document (resume, transcript, etc.)
 * @param {string} params.documentOwner - Owner of the document
 * @param {string} params.action - Action performed (view, download, upload, delete)
 * @param {boolean} params.success - Whether access was successful
 * @param {string} [params.reason] - Reason for failure if not successful
 * @param {string} [params.ip] - IP address of requester
 */
function logDocumentAccess({
  userId,
  documentType,
  documentOwner,
  action,
  success,
  reason,
  ip,
}) {
  const timestamp = new Date().toISOString();
  const status = success ? "SUCCESS" : "DENIED";
  const reasonText = reason ? ` - ${reason}` : "";

  console.log(
    `[AUDIT] ${timestamp} | ${status} | User: ${userId} | Action: ${action} | ` +
      `Document: ${documentType} (owner: ${documentOwner}) | IP: ${ip || "N/A"}${reasonText}`,
  );

  // In production, you would also:
  // 1. Write to a dedicated audit log file
  // 2. Send to a logging service (e.g., Winston, Bunyan, CloudWatch)
  // 3. Store in database for compliance/forensics
}

module.exports = {
  logDocumentAccess,
};
