# Secure Document Access - Postman Testing Guide

## Overview
This guide shows how to test the secured document download endpoints. All documents now require authentication and proper authorization to access.

## Authentication Setup

All requests require a JWT token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## 1. Profile Resume Download

### Endpoint
```
GET /api/documents/resume/:userId/download
```

### Authorization
- ✅ Student can download their own resume
- ✅ Admin can download any student's resume
- ❌ Other students cannot download

### Postman Request

```http
GET http://localhost:3000/api/documents/resume/{{studentUserId}}/download
Authorization: Bearer {{student_token}}
```

### Success Response (Local Storage)
- **Status**: 200 OK
- **Headers**:
  ```
  Content-Type: application/pdf
  Content-Disposition: inline; filename="resume.pdf"
  Cache-Control: no-store, no-cache, must-revalidate, private
  X-RateLimit-Limit: 60
  X-RateLimit-Remaining: 59
  ```
- **Body**: PDF file (binary)

### Success Response (S3 Storage)
- **Status**: 302 Found
- **Location**: `https://bucket.s3.amazonaws.com/...?signed-url-params`
- Browser/Postman automatically follows redirect to download file

### Error Responses

**403 Forbidden** (trying to access another student's resume):
```json
{
  "success": false,
  "message": "Access denied"
}
```

**404 Not Found** (no resume uploaded):
```json
{
  "success": false,
  "message": "No resume found for this student"
}
```

**429 Too Many Requests** (rate limit exceeded):
```json
{
  "success": false,
  "message": "Too many download requests. Please try again later.",
  "retryAfter": 45
}
```

---

## 2. Profile Transcript Download

### Endpoint
```
GET /api/documents/transcript/:userId/download
```

### Authorization
- Same as resume (Owner or ADMIN)

### Postman Request

```http
GET http://localhost:3000/api/documents/transcript/{{studentUserId}}/download
Authorization: Bearer {{student_token}}
```

### Responses
Same format as resume download.

---

## 3. Employer Verification Download

### Endpoint
```
GET /api/documents/employer-verification/:userId/download
```

### Authorization
- ✅ Employer can download their own verification document
- ✅ Admin can download any employer's document
- ❌ Students cannot download
- ❌ Other employers cannot download

### Postman Request

```http
GET http://localhost:3000/api/documents/employer-verification/{{employerUserId}}/download
Authorization: Bearer {{employer_token}}
```

### Responses
Supports PDF, JPEG, and PNG files. Same response format as above.

---

## 4. Job-Specific Resume Download

### Endpoint
```
GET /api/jobs/:jobId/resume/:studentUserId/download
```

### Authorization
- ✅ Student (owner) can download their own job resume
- ✅ HR who owns the job can download applicant resumes
- ✅ Admin can download any job resume
- ❌ Other students cannot download
- ❌ HR from other companies cannot download

### Postman Request

**As student (downloading own resume):**
```http
GET http://localhost:3000/api/jobs/123/resume/{{studentUserId}}/download
Authorization: Bearer {{student_token}}
```

**As HR (downloading applicant resume):**
```http
GET http://localhost:3000/api/jobs/123/resume/{{applicantUserId}}/download
Authorization: Bearer {{hr_token}}
```

**As admin:**
```http
GET http://localhost:3000/api/jobs/123/resume/{{studentUserId}}/download
Authorization: Bearer {{admin_token}}
```

### Error Response (HR trying to access other company's job resumes)

```json
{
  "success": false,
  "message": "Access denied"
}
```

---

## Rate Limiting

All download endpoints are rate-limited to **60 requests per minute** per user+IP combination.

### Rate Limit Headers

Every response includes:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 2025-10-21T12:35:00.000Z
```

### When Rate Limited

**Status**: 429 Too Many Requests

```json
{
  "success": false,
  "message": "Too many download requests. Please try again later.",
  "retryAfter": 45
}
```

The `retryAfter` field indicates seconds until the rate limit resets.

---

## Testing Scenarios

### Scenario 1: Student Downloads Own Resume

1. Upload resume as student
2. Download using `/download` endpoint
3. ✅ Should succeed with 200 OK and file

### Scenario 2: Unauthorized Access Attempt

1. Student A uploads resume
2. Student B tries to download Student A's resume
3. ❌ Should fail with 403 Forbidden
4. Check server logs for audit entry

### Scenario 3: Admin Access

1. Student uploads resume
2. Admin downloads student's resume using admin token
3. ✅ Should succeed with 200 OK and file

### Scenario 4: HR Downloads Applicant Resume

1. Student applies to job (uploads job-specific resume)
2. HR (job owner) downloads applicant's resume
3. ✅ Should succeed
4. Different HR tries to download same resume
5. ❌ Should fail with 403

### Scenario 5: Rate Limiting

1. Make 60 download requests rapidly
2. Request #61 should return 429
3. Wait 1 minute
4. Request should work again

### Scenario 6: S3 Signed URL (if using S3)

1. Make download request
2. Receive 302 redirect
3. Postman follows to signed URL
4. File downloads successfully
5. Copy signed URL
6. Wait 6 minutes
7. Try using old signed URL → Should fail (expired)

---

## Postman Collection Setup

### Environment Variables

Create environment with these variables:

```
base_url: http://localhost:3000
student_token: eyJhbGc...
employer_token: eyJhbGc...
admin_token: eyJhbGc...
studentUserId: user-123
employerUserId: user-456
jobId: 1
```

### Collection Structure

```
📁 Document Downloads
  📂 Student Documents
    ├─ Download Own Resume (200)
    ├─ Download Other Student Resume (403)
    ├─ Download Own Transcript (200)
  📂 Employer Documents
    ├─ Download Own Verification (200)
    ├─ Download as Admin (200)
  📂 Job Resumes
    ├─ Student Downloads Own (200)
    ├─ HR Downloads Applicant (200)
    ├─ HR Downloads Other Company Applicant (403)
    ├─ Admin Downloads Any (200)
  📂 Rate Limiting
    ├─ Trigger Rate Limit (429)
```

### Pre-request Script (Optional)

Add to collection to check rate limit headers:

```javascript
pm.sendRequest({
    url: pm.environment.get('base_url') + '/api/documents/resume/' + pm.environment.get('studentUserId') + '/download',
    method: 'GET',
    header: {
        'Authorization': 'Bearer ' + pm.environment.get('student_token')
    }
}, function (err, res) {
    console.log('Rate Limit Remaining:', res.headers.get('X-RateLimit-Remaining'));
});
```

### Test Script Example

Add to download requests to validate response:

```javascript
// Check successful download
pm.test("Status code is 200 or 302", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 302]);
});

// Check rate limit headers present
pm.test("Rate limit headers present", function () {
    pm.expect(pm.response.headers.has('X-RateLimit-Limit')).to.be.true;
    pm.expect(pm.response.headers.has('X-RateLimit-Remaining')).to.be.true;
});

// Check security headers (for 200 responses)
if (pm.response.code === 200) {
    pm.test("Security headers present", function () {
        pm.expect(pm.response.headers.get('Cache-Control')).to.include('no-store');
        pm.expect(pm.response.headers.get('X-Content-Type-Options')).to.equal('nosniff');
    });
}

// For unauthorized attempts
if (pm.response.code === 403) {
    pm.test("Access denied message", function () {
        const json = pm.response.json();
        pm.expect(json.success).to.be.false;
        pm.expect(json.message).to.equal('Access denied');
    });
}
```

---

## Audit Logs

Check server console for audit entries:

```
[AUDIT] 2025-10-21T12:30:00.000Z | SUCCESS | User: user-123 | Action: download | 
Document: resume (owner: user-123) | IP: 127.0.0.1

[AUDIT] 2025-10-21T12:30:05.000Z | DENIED | User: user-456 | Action: download | 
Document: resume (owner: user-123) | IP: 127.0.0.1 - Access denied
```

Every download attempt (successful or failed) is logged with:
- Timestamp
- User performing the action
- Document owner
- Success/failure
- IP address
- Failure reason (if denied)

---

## Troubleshooting

### Issue: 401 Unauthorized

**Cause**: Token expired or invalid

**Solution**: 
1. Re-login to get fresh token
2. Update `{{student_token}}` in environment variables

### Issue: 404 Not Found

**Cause**: Document not uploaded yet

**Solution**:
1. Upload document first using POST endpoint
2. Then try download

### Issue: File downloads as text instead of binary

**Cause**: Postman displaying response as text

**Solution**:
1. Click "Save Response" → "Save to a file"
2. Or use "Send and Download" instead of "Send"

### Issue: 429 Rate Limit even though just started testing

**Cause**: Previous test run consumed rate limit quota

**Solution**:
1. Wait 1 minute for quota to reset
2. Or restart server to clear in-memory rate limit store

---

## Comparison: Old vs New

### Old Method (Insecure) ❌

```http
# Step 1: Get URL
GET /api/documents/resume/user-123
Response: { "url": "/uploads/resumes/file.pdf" }

# Step 2: Access file directly (NO AUTH!)
GET /uploads/resumes/file.pdf
Response: PDF file

# Problem: Anyone with URL can access file!
```

### New Method (Secure) ✅

```http
# Single request with auth
GET /api/documents/resume/user-123/download
Authorization: Bearer <token>

# Response: File or redirect
# Authorization checked on EVERY request
# Audit log created
# Rate limiting applied
```

---

## Production Considerations

### Before Going Live

1. ✅ Test all authorization rules
2. ✅ Verify rate limiting works
3. ✅ Check audit logs are being written
4. ⚠️ Set up Redis for distributed rate limiting
5. ⚠️ Configure persistent audit log storage
6. ⚠️ Set up CloudFront for S3 (optional performance boost)
7. ⚠️ Monitor for suspicious download patterns

### Monitoring Alerts

Set up alerts for:
- High rate limit violation rate (potential abuse)
- Many 403 errors from same IP (potential attack)
- Unusual download volumes
- Audit log anomalies

---

**Last Updated**: October 21, 2025  
**Status**: Ready for testing  
**Security Level**: ✅ Production-ready
