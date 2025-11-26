const { createCorrelationId, withContext } = require("../utils/logger");

/**
 * Request-scoped logging middleware with correlation IDs.
 * Adds:
 * - req.correlationId
 * - req.log(level, message, meta)
 * - X-Request-Id response header
 */
function requestLogger(req, res, next) {
  const correlationId = req.headers["x-request-id"] || createCorrelationId();
  req.correlationId = correlationId;
  res.setHeader("X-Request-Id", correlationId);

  const baseLog = withContext({
    correlationId,
    method: req.method,
    path: req.originalUrl,
  });

  // Attach lightweight logger to request
  req.log = (level, message, meta = {}) =>
    baseLog(level, message, {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get("user-agent"),
      ...meta,
    });

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    baseLog("info", "http.request.completed", {
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get("user-agent"),
    });
  });

  next();
}

module.exports = {
  requestLogger,
};
