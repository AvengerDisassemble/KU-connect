# Job Resume API Quick Reference

## Endpoints

### POST /api/jobs/:jobId/resume

**Upload or select resume for job application**

**Auth:** STUDENT role required

**Request (Upload Mode):**

```http
POST /api/jobs/1/resume
Authorization: Bearer <token>
Content-Type: multipart/form-data

resume: <PDF file>
```

**Request (Profile Mode):**

```http
POST /api/jobs/1/resume
Authorization: Bearer <token>
Content-Type: application/json

{
  "mode": "profile"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Job resume saved successfully",
  "data": {
    "jobId": 1,
    "link": "resumes/job-applications/1/abc-123.pdf",
    "source": "UPLOADED"
  }
}
```

**Errors:**

- 400: Invalid mode, no file, or missing profile resume
- 404: Job or student not found
- 401: Not authenticated
- 403: Not a student

---

### GET /api/jobs/:jobId/resume/:studentUserId

**Get job resume URL**

**Auth:** Owner student, job's HR owner, or ADMIN

**Request:**

```http
GET /api/jobs/1/resume/cuid123
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Job resume URL retrieved successfully",
  "data": {
    "url": "https://example.com/resume.pdf",
    "source": "PROFILE"
  }
}
```

**Errors:**

- 403: Access denied
- 404: Job, student, or resume not found

---

### GET /api/jobs/:jobId/resume/self

**Get current user's job resume URL (convenience)**

**Auth:** STUDENT role required

**Request:**

```http
GET /api/jobs/1/resume/self
Authorization: Bearer <token>
```

**Response:** Same as above

---

### DELETE /api/jobs/:jobId/resume

**Delete job application resume**

**Auth:** STUDENT role required (owner only)

**Request:**

```http
DELETE /api/jobs/1/resume
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Job resume deleted successfully"
}
```

**Errors:**

- 404: Resume not found
- 403: Not the owner

---

## Database Schema

### Resume Model

```prisma
model Resume {
  id        Int          @id @default(autoincrement())
  studentId Int
  jobId     Int
  link      String       // Storage key
  source    ResumeSource @default(UPLOADED)

  student   Student @relation(...)
  job       Job     @relation(...)

  @@unique([studentId, jobId])
}

enum ResumeSource {
  PROFILE
  UPLOADED
}
```

---

## Business Rules

1. **One resume per student per job** (enforced by unique constraint)
2. **Two modes:**
   - PROFILE: References `Student.resumeKey` (no file upload)
   - UPLOAD: Stores new file in `resumes/job-applications/{jobId}/`
3. **Automatic cleanup:** Old uploaded files deleted when:
   - Switching from UPLOAD to PROFILE
   - Replacing an uploaded file
   - Deleting the resume
4. **Profile resume never deleted** by job resume operations
5. **Access control:**
   - POST/DELETE: Student owner only
   - GET: Student owner, job's HR owner, or ADMIN

---

## Storage

**Prefix:** `resumes/job-applications/{jobId}/`

**Example keys:**

- UPLOADED: `resumes/job-applications/42/d4e5f6a7-8b9c-1d2e-3f4a-5b6c7d8e9f0a.pdf`
- PROFILE: `resumes/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d.pdf` (references existing)

Both work with local and S3 storage providers transparently.

---

## Testing

**Test file:** `tests/controllers/jobDocumentController.test.js`

**Run:**

```bash
npm test tests/controllers/jobDocumentController.test.js
```

**Coverage:**

- ✅ Upload mode
- ✅ Profile mode
- ✅ Missing profile resume error
- ✅ File replacement & cleanup
- ✅ Access control (all roles)
- ✅ Delete with cleanup
- ✅ Non-existent resources

---

## Common Patterns

### Student applies with profile resume

```javascript
await fetch(`/api/jobs/${jobId}/resume`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ mode: "profile" }),
});
```

### Student uploads custom resume

```javascript
const formData = new FormData();
formData.append("resume", pdfFile);

await fetch(`/api/jobs/${jobId}/resume`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

### HR views applicant's resume

```javascript
const response = await fetch(`/api/jobs/${jobId}/resume/${studentUserId}`, {
  headers: { Authorization: `Bearer ${hrToken}` },
});
const { data } = await response.json();
// Use data.url to download/display resume
```

### Student views their application resume

```javascript
const response = await fetch(`/api/jobs/${jobId}/resume/self`, {
  headers: { Authorization: `Bearer ${studentToken}` },
});
const { data } = await response.json();
console.log(`Using ${data.source} resume`);
```
