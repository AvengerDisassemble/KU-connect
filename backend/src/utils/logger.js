const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), "logs");
const LOG_FILE = process.env.LOG_FILE || path.join(LOG_DIR, "backend.log");

let fileStream;

function ensureLogStream() {
  if (fileStream) {
    return fileStream;
  }

  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fileStream = fs.createWriteStream(LOG_FILE, {
      flags: "a",
      encoding: "utf8",
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "logger.file_stream_error",
        error: {
          message: error.message,
          code: error.code,
        },
      })
    );
    fileStream = null;
  }

  return fileStream;
}

/**
 * Redact sensitive fields from logs to avoid leaking secrets/PII
 * Only shallowly redacts common sensitive keys to keep implementation lightweight.
 */
function redact(meta = {}) {
  const SENSITIVE_KEYS = new Set([
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
    "cookie",
    "cookies",
    "set-cookie",
  ]);

  if (meta === null || typeof meta !== "object") return meta;

  const clone = Array.isArray(meta) ? [] : {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.has(key)) {
      clone[key] = "[REDACTED]";
      continue;
    }

    if (value && typeof value === "object") {
      clone[key] = redact(value);
      continue;
    }

    if (typeof value === "string" && value.toLowerCase().includes("bearer ")) {
      clone[key] = "[REDACTED]";
      continue;
    }

    clone[key] = value;
  }

  return clone;
}

function serializeError(err) {
  if (!err) return undefined;
  return {
    name: err.name,
    message: err.message,
    code: err.code,
    status: err.status || err.statusCode,
    stack:
      process.env.NODE_ENV === "development" && err.stack
        ? err.stack.split("\n").slice(0, 6).join("\n")
        : undefined,
  };
}

function consoleMethod(level) {
  if (level === "error") return console.error;
  if (level === "warn") return console.warn;
  return console.log;
}

function log(level, message, meta = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redact(meta),
  };

  const line = `${JSON.stringify(payload)}\n`;
  consoleMethod(level)(line.trimEnd());

  const stream = ensureLogStream();
  if (stream) {
    stream.write(line);
  }
}

function withContext(defaultMeta = {}) {
  return (level, message, meta = {}) =>
    log(level, message, { ...defaultMeta, ...meta });
}

function createCorrelationId() {
  return randomUUID();
}

module.exports = {
  log,
  withContext,
  serializeError,
  createCorrelationId,
};
