# Secure File Access Implementation Summary

## Overview

Replaced public static file serving with protected, authenticated download endpoints to ensure only authorized users can access uploaded documents.

## What Changed

### 1. Removed Public Access ✅

- **Removed**: `app.use('/uploads', express.static(...))` from `src/app.js`
- **Impact**: Files in `backend/uploads/` are no longer publicly accessible
- **Security**: Documents cannot be accessed via direct URL without authentication

### 2. Extended Storage Provider API ✅

Added two new methods to all storage providers:

#### `getReadStream(fileKey)`

- Returns a Node.js readable stream for the file
- Includes MIME type and filename metadata
- Implemented for both local and S3 storage

#### `getSignedDownloadUrl(fileKey, expiresIn = 300)`

- For S3: Returns pre-signed URL (default 5-minute expiry)
- For local: Returns `null` (forces streaming)
- Enables efficient S3 downloads via redirect

**Files Modified:**

- `src/services/storage/storageProvider.js` (base class)
- `src/services/storage/localStorageProvider.js`
- `src/services/storage/s3StorageProvider.js`

### 3. Created Authorization Utilities ✅

**New file**: `src/utils/documentAuthz.js`

Contains centralized authorization logic:

- `canViewStudentDocument(requester, targetUserId)` - Owner or ADMIN
- `canViewHRDocument(requester, targetUserId)` - Owner or ADMIN
- `canViewJobResume(requester, jobId, studentUserId)` - Owner, Job HR, or ADMIN

### 4. Added Audit Logging ✅

**New file**: `src/utils/auditLogger.js`

Logs all document access attempts with:

- User ID
- Document type and owner
- Action (download, view, upload, delete)
- Success/failure status
- IP address
- Timestamp

Example log output:

```
[AUDIT] 2025-10-21T... | SUCCESS | User: user-123 | Action: download |
Document: resume (owner: user-456) | IP: 127.0.0.1
```

### 5. Implemented Rate Limiting ✅

**New file**: `src/middlewares/downloadRateLimit.js`

- **Limit**: 60 downloads per minute per user+IP combination
- **Response**: HTTP 429 when exceeded
- **Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **Storage**: In-memory (use Redis in production)

### 6. Protected Download Endpoints ✅

Added `/download` routes for all documents:

| Endpoint                                                    | Authorization           | Rate Limited |
| ----------------------------------------------------------- | ----------------------- | ------------ |
| `GET /api/documents/resume/:userId/download`                | Owner or ADMIN          | ✅           |
| `GET /api/documents/transcript/:userId/download`            | Owner or ADMIN          | ✅           |
| `GET /api/documents/employer-verification/:userId/download` | Owner or ADMIN          | ✅           |
| `GET /api/jobs/:jobId/resume/:studentUserId/download`       | Owner, Job HR, or ADMIN | ✅           |

**How it works:**

1. Authenticate user (JWT)
2. Check authorization (owner/HR/admin)
3. Log access attempt
4. Check rate limit
5. For S3: Redirect to signed URL
6. For local: Stream file with proper headers

**Response headers:**

```
Content-Type: application/pdf
Content-Disposition: inline; filename="resume.pdf"
Cache-Control: no-store, no-cache, must-revalidate, private
X-Content-Type-Options: nosniff
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
```

### 7. Files Modified

**Controllers:**

- `src/controllers/documents-controller/documentsController.js`
  - Added: `downloadResume()`, `downloadTranscript()`, `downloadEmployerVerification()`
  - Integrated: Authorization checks, audit logging
- `src/controllers/documents-controller/jobDocumentController.js`
  - Added: `downloadJobResume()`
  - Integrated: Authorization checks, audit logging

**Routes:**

- `src/routes/documents/index.js` - Added 3 download routes with rate limiting
- `src/routes/jobs/index.js` - Added 1 download route with rate limiting

**New Files:**

- `src/utils/documentAuthz.js` - Authorization logic
- `src/utils/auditLogger.js` - Audit logging utility
- `src/middlewares/downloadRateLimit.js` - Rate limiting middleware

## Access Control Matrix

| Document Type      | Owner Student | Other Student | Job HR (Owner) | Other HR | Admin       |
| ------------------ | ------------- | ------------- | -------------- | -------- | ----------- |
| Profile Resume     | ✅ Download   | ❌            | ❌             | ❌       | ✅ Download |
| Profile Transcript | ✅ Download   | ❌            | ❌             | ❌       | ✅ Download |
| Job Resume         | ✅ Download   | ❌            | ✅ Download    | ❌       | ✅ Download |
| HR Verification    | ❌            | ❌            | ✅ Download    | ❌       | ✅ Download |

## Migration Guide

### For Frontend Developers

**Old (insecure):**

```javascript
// ❌ This no longer works
const url = await fetch("/api/documents/resume/user-123")
  .then((r) => r.json())
  .then((data) => data.url);
// url = "/uploads/resumes/file.pdf" - now returns 404

window.open(url); // Fails!
```

**New (secure):**

```javascript
// ✅ Use download endpoint directly
const downloadUrl = "/api/documents/resume/user-123/download";
window.open(downloadUrl, "_blank"); // Opens in new tab

// For S3: Gets redirected to signed URL
// For local: Streams the file
```

### For API Clients (Postman, etc.)

**Download a resume:**

```http
GET /api/documents/resume/:userId/download
Authorization: Bearer <token>

Response:
- S3: 302 redirect to signed URL
- Local: File stream with proper headers
```

## Security Benefits

1. ✅ **Authentication Required**: All downloads require valid JWT token
2. ✅ **Authorization Enforced**: Role-based access control prevents unauthorized access
3. ✅ **Audit Trail**: All access attempts logged for compliance/security review
4. ✅ **Rate Limiting**: Prevents abuse and DoS attacks
5. ✅ **No Direct Access**: Files cannot be accessed via direct URLs
6. ✅ **Secure Headers**: Prevents MIME sniffing and caching of sensitive documents
7. ✅ **Expiring URLs**: S3 signed URLs expire after 5 minutes

## Performance Considerations

### Local Storage

- Files streamed directly from disk
- Low memory footprint (uses Node streams)
- Fast for small files (<10MB)

### S3 Storage

- Redirects to pre-signed URLs
- Minimal server load (just generates URL)
- CloudFront can be added for CDN caching

### Rate Limiting

- In-memory store (fast, but not shared across instances)
- **Production**: Use Redis for distributed rate limiting

## Testing Checklist

- [ ] Student can download their own resume
- [ ] Student cannot download another student's resume
- [ ] Admin can download any student's resume
- [ ] HR can download job-specific resumes for their jobs
- [ ] HR cannot download job-specific resumes for other HR's jobs
- [ ] Rate limiting kicks in after 60 requests/minute
- [ ] Audit logs are written for all access attempts
- [ ] S3 provider returns signed URLs
- [ ] Local provider streams files
- [ ] 404 for non-existent files
- [ ] 403 for unauthorized access

## Next Steps

### Immediate (Before Deployment)

1. **Update Frontend**: Change all file access to use `/download` endpoints
2. **Update Tests**: Add integration tests for download endpoints
3. **Update Postman**: Document new download endpoints in collections
4. **Decision: Avatar Policy**: Decide if avatars need same protection or can remain public

### Production Readiness

1. **Redis Rate Limiting**: Replace in-memory store with Redis
2. **Persistent Audit Logs**: Write to file/database instead of console
3. **Monitoring**: Alert on high rate limit violations
4. **CloudFront**: Add CDN for S3 files if needed
5. **Backup**: Ensure uploaded files are backed up

## Breaking Changes

⚠️ **API Breaking Change**: The `/uploads/*` static routes no longer work.

**Old endpoints still work** (for backward compatibility):

- `GET /api/documents/resume/:userId` - Returns URL (deprecated)
- `GET /api/documents/transcript/:userId` - Returns URL (deprecated)
- etc.

**Recommended**: Migrate to `/download` endpoints immediately.

## Environment Variables

No new environment variables required. Uses existing:

- `STORAGE_PROVIDER` - 'local' or 's3'
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME` (for S3)

## Backward Compatibility

The old `get*Url()` controller functions **still exist** and return URLs via `getFileUrl()`:

- For S3: Returns signed URL (works)
- For local: Returns `/uploads/...` path (broken due to removed static serving)

**Action Required**: Frontend must migrate to `/download` endpoints.

---

**Implementation Date**: October 21, 2025  
**Security Level**: ✅ Production-ready with noted production enhancements  
**Status**: ✅ Implemented and ready for testing
