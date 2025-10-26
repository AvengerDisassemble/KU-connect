# Document Upload API Endpoints

## Overview
This document provides comprehensive API endpoint documentation for the document upload and management system. All endpoints require authentication via Bearer token.

**Security Note:** All file access is through protected download endpoints only. Direct URL access has been disabled for enhanced security. All downloads require proper authentication, authorization, and are subject to rate limiting and audit logging.

---

## Quick Reference: Field Names for Uploads

| Endpoint | Field Name | File Types | Max Size |
|----------|-----------|------------|----------|
| `POST /api/profile/avatar` | **`avatar`** | JPEG, PNG, GIF, WebP | 2 MB |
| `POST /api/documents/resume` | **`resume`** | PDF | 10 MB |
| `POST /api/documents/transcript` | **`transcript`** | PDF | 10 MB |
| `POST /api/documents/employer-verification` | **`verification`** | PDF, JPEG, PNG | 10 MB |
| `POST /api/documents/student-verification` | **`verification`** | PDF, JPEG, PNG | 10 MB |
| `POST /api/jobs/:jobId/resume` | **`resume`** | PDF | 10 MB |

**Important:** Field names must be exact (case-sensitive). In Postman, select **form-data** in the Body tab and set the type to **File** for the key.

---

## Table of Contents
1. [Quick Reference: Field Names](#quick-reference-field-names-for-uploads)
2. [User Profile](#user-profile)
   - [Avatar Upload](#avatar-upload)
3. [Profile Documents](#profile-documents)
   - [Student Resume](#student-resume)
   - [Student Transcript](#student-transcript)
   - [Employer Verification](#employer-verification)
4. [Student Verification](#student-verification)
5. [Job-Specific Documents](#job-specific-documents)
6. [Authentication](#authentication)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)
9. [Notes](#notes)

---

## User Profile

### Avatar Upload

#### Upload Avatar
Upload or replace user profile picture/avatar.

**Endpoint:** `POST /api/profile/avatar`

**Authentication:** Required (Bearer Token)

**Authorization:** Any authenticated user (all roles)

**File Requirements:**
- **Field Name:** `avatar` (must be exact)
- **File Types:** Any image format (JPEG, PNG, GIF, WebP, etc.)
- **Max Size:** 2 MB

**Request:**
```http
POST /api/profile/avatar HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data

avatar: <Image file>
```

**Postman Setup:**
1. Select **POST** method
2. URL: `http://localhost:3000/api/profile/avatar`
3. **Headers** tab: Add `Authorization: Bearer <your_token>`
4. **Body** tab: Select **form-data**
5. Add key: `avatar`, Type: **File**, then select your image file

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "fileKey": "avatars/user-123-avatar-1729876543210.jpg"
  }
}
```

**Errors:**
- `400` - No file uploaded or invalid file type (not an image)
- `401` - Unauthorized (missing/invalid token)
- `413` - File too large (exceeds 2 MB)

---

#### Download Avatar
Securely download a user's avatar image.

**Endpoint:** `GET /api/profile/avatar/:userId/download`

**Authentication:** Required (Bearer Token)

**Authorization:** Any authenticated user can view any avatar

**Request:**
```http
GET /api/profile/avatar/user-123/download HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
```

**Response (200 OK):**
- Content-Type: image/jpeg, image/png, image/gif, etc.
- Content-Disposition: inline; filename="avatar.jpg"
- Cache-Control: public, max-age=3600 (cached for 1 hour)
- X-Content-Type-Options: nosniff
- Body: Image file stream

**Errors:**
- `401` - Unauthorized
- `404` - Avatar not found or user doesn't exist

---

## Profile Documents

### Student Resume

#### Upload Resume
Upload or replace a student's profile resume.

**Endpoint:** `POST /api/documents/resume`

**Authentication:** Required (Bearer Token)

**Authorization:** STUDENT role only

**File Requirements:**
- **Field Name:** `resume` (must be exact)
- **File Type:** PDF only
- **Max Size:** 10 MB

**Request:**
```http
POST /api/documents/resume HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data

resume: <PDF file>
```

**Postman Setup:**
1. Select **POST** method
2. URL: `http://localhost:3000/api/documents/resume`
3. **Headers** tab: Add `Authorization: Bearer <your_token>`
4. **Body** tab: Select **form-data**
5. Add key: `resume`, Type: **File**, then select your PDF file

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "data": {
    "fileKey": "resumes/user-123-resume-1729876543210.pdf"
  }
}
```

**Errors:**
- `400` - No file uploaded or invalid file type (not PDF)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not a student)
- `404` - Student profile not found

---

#### Download Resume
Securely download a student's resume.

**Endpoint:** `GET /api/documents/resume/:userId/download`

**Authentication:** Required (Bearer Token)

**Authorization:** 
- Student (own resume only)
- Admin (any resume)

**Rate Limiting:** 60 requests per minute per user

**Request:**
```http
GET /api/documents/resume/user-123/download HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
```

**Response (200 OK):**
- Content-Type: application/pdf
- Content-Disposition: inline; filename="resume.pdf"
- Cache-Control: no-store, no-cache, must-revalidate, private
- X-Content-Type-Options: nosniff
- Body: PDF file stream

**Errors:**
- `401` - Unauthorized
- `403` - Access denied
- `404` - Resume not found
- `429` - Too many requests (rate limit exceeded)

---

### Student Transcript

#### Upload Transcript
Upload or replace a student's transcript.

**Endpoint:** `POST /api/documents/transcript`

**Authentication:** Required (Bearer Token)

**Authorization:** STUDENT role only

**File Requirements:**
- **Field Name:** `transcript` (must be exact)
- **File Type:** PDF only
- **Max Size:** 10 MB

**Request:**
```http
POST /api/documents/transcript HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data

transcript: <PDF file>
```

**Postman Setup:**
1. Select **POST** method
2. URL: `http://localhost:3000/api/documents/transcript`
3. **Headers** tab: Add `Authorization: Bearer <your_token>`
4. **Body** tab: Select **form-data**
5. Add key: `transcript`, Type: **File**, then select your PDF file

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Transcript uploaded successfully",
  "data": {
    "fileKey": "transcripts/user-123-transcript-1729876543210.pdf"
  }
}
```

**Errors:**
- `400` - No file uploaded or invalid file type (not PDF)
- `401` - Unauthorized
- `403` - Forbidden (not a student)
- `404` - Student profile not found

---

#### Download Transcript
Securely download a student's transcript.

**Endpoint:** `GET /api/documents/transcript/:userId/download`

**Authentication:** Required (Bearer Token)

**Authorization:** 
- Student (own transcript only)
- Admin (any transcript)

**Rate Limiting:** 60 requests per minute per user

**Request:**
```http
GET /api/documents/transcript/user-123/download HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
```

**Response (200 OK):**
- Content-Type: application/pdf
- Content-Disposition: inline; filename="transcript.pdf"
- Body: PDF file stream

---

### Employer Verification

#### Upload Employer Verification Document
Upload or replace employer verification document (company registration, tax ID, etc.).

**Endpoint:** `POST /api/documents/employer-verification`

**Authentication:** Required (Bearer Token)

**Authorization:** EMPLOYER role only

**File Requirements:**
- **Field Name:** `verification` (must be exact)
- **File Types:** PDF, JPEG, PNG
- **Max Size:** 10 MB

**Request:**
```http
POST /api/documents/employer-verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data

verification: <PDF/JPEG/PNG file>
```

**Postman Setup:**
1. Select **POST** method
2. URL: `http://localhost:3000/api/documents/employer-verification`
3. **Headers** tab: Add `Authorization: Bearer <your_token>`
4. **Body** tab: Select **form-data**
5. Add key: `verification`, Type: **File**, then select your PDF/JPEG/PNG file

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employer verification document uploaded successfully",
  "data": {
    "fileKey": "employer-docs/user-456-verification-1729876543210.pdf"
  }
}
```

**Errors:**
- `400` - No file uploaded or invalid file type (must be PDF, JPEG, or PNG)
- `401` - Unauthorized
- `403` - Forbidden (not an employer)
- `404` - HR profile not found

---

#### Download Employer Verification
Securely download employer verification document.

**Endpoint:** `GET /api/documents/employer-verification/:userId/download`

**Authentication:** Required (Bearer Token)

**Authorization:** 
- Employer (own document only)
- Admin (any document)

**Rate Limiting:** 60 requests per minute per user

**Request:**
```http
GET /api/documents/employer-verification/user-456/download HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
```

**Response (200 OK):**
- Content-Type: application/pdf or image/jpeg or image/png
- Content-Disposition: inline; filename="verification.pdf"
- Body: File stream

---

## Student Verification

### Upload Student Verification Document
Upload verification document for unverified student accounts (student ID, enrollment letter, etc.).

**Endpoint:** `POST /api/documents/student-verification`

**Authentication:** Required (Bearer Token)

**Authorization:** STUDENT role only (unverified accounts)

**File Requirements:**
- **Field Name:** `verification` (must be exact)
- **File Types:** PDF, JPEG, PNG
- **Max Size:** 10 MB

**Request:**
```http
POST /api/documents/student-verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data

verification: <PDF/JPEG/PNG file>
```

**Postman Setup:**
1. Select **POST** method
2. URL: `http://localhost:3000/api/documents/student-verification`
3. **Headers** tab: Add `Authorization: Bearer <your_token>`
4. **Body** tab: Select **form-data**
5. Add key: `verification`, Type: **File**, then select your PDF/JPEG/PNG file

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student verification document uploaded successfully. Pending admin review."
}
```

**Errors:**
- `400` - No file uploaded, invalid file type, or account already verified
- `401` - Unauthorized
- `403` - Forbidden (not a student)
- `404` - Student profile not found

**Note:** This endpoint will reject already verified students with a 400 error.

---

### Download Student Verification
Securely download student verification document.

**Endpoint:** `GET /api/documents/student-verification/:userId/download`

**Authentication:** Required (Bearer Token)

**Authorization:** 
- Student (own document only)
- Admin (any document)

**Rate Limiting:** 60 requests per minute per user

**Request:**
```http
GET /api/documents/student-verification/user-789/download HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
```

**Response (200 OK):**
- Content-Type: application/pdf or image/jpeg or image/png
- Content-Disposition: inline; filename="student-verification.pdf"
- Body: File stream

---

## Job-Specific Documents

### Upload Job Resume
Upload or update a resume for a specific job application (separate from profile resume).

**Endpoint:** `POST /api/jobs/:jobId/resume`

**Authentication:** Required (Bearer Token)

**Authorization:** STUDENT role only

**File Requirements:**
- **Field Name:** `resume` (must be exact, when uploading a new file)
- **File Type:** PDF only
- **Max Size:** 10 MB

**Options:**
1. **Upload a new resume** - Use multipart/form-data with a PDF file
2. **Use profile resume** - Send without file (uses resume from your profile)

**Request (Upload New Resume):**
```http
POST /api/jobs/42/resume HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data

resume: <PDF file>
```

**Postman Setup (Upload New Resume):**
1. Select **POST** method
2. URL: `http://localhost:3000/api/jobs/42/resume` (replace `42` with actual job ID)
3. **Headers** tab: Add `Authorization: Bearer <your_token>`
4. **Body** tab: Select **form-data**
5. Add key: `resume`, Type: **File**, then select your PDF file

**Request (Use Profile Resume):**
```http
POST /api/jobs/42/resume HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "source": "PROFILE"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Job resume saved successfully",
  "data": {
    "jobId": 42,
    "link": "job-resumes/student-123-job-42-resume.pdf",
    "source": "UPLOADED"
  }
}
```

**Query Parameters:**
- `source` (optional): "PROFILE" or "UPLOADED"
  - `PROFILE`: Uses the resume from student's profile
  - `UPLOADED`: Uploads a new resume specific to this job

---

### Download Job Resume
Securely download job-specific resume.

**Endpoint:** `GET /api/jobs/:jobId/resume/:studentUserId/download`

**Authentication:** Required (Bearer Token)

**Authorization:** 
- Student (own resume only)
- Job HR/Employer (for their job postings)
- Admin (any resume)

**Rate Limiting:** 60 requests per minute per user

**Request:**
```http
GET /api/jobs/42/resume/user-123/download HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
```

**Response (200 OK):**
- Content-Type: application/pdf
- Content-Disposition: inline; filename="job-resume.pdf"
- Body: PDF file stream

---

### Delete Job Resume
Delete a job-specific resume.

**Endpoint:** `DELETE /api/jobs/:jobId/resume`

**Authentication:** Required (Bearer Token)

**Authorization:** STUDENT role only (own resume)

**Request:**
```http
DELETE /api/jobs/42/resume HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your_access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Job resume deleted successfully"
}
```

---

## Authentication

All endpoints require a valid JWT Bearer token in the Authorization header:

```http
Authorization: Bearer <your_access_token>
```

### How to obtain a token:

**Endpoint:** `POST /api/auth/login`

**Request:**
```http
POST /api/auth/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "student@example.com",
      "role": "STUDENT"
    }
  }
}
```

---

## Rate Limiting

All download endpoints are rate-limited to prevent abuse:

- **Limit:** 60 requests per minute per user
- **Headers included in response:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: When the rate limit resets (ISO 8601 timestamp)

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "message": "Too many download requests. Please try again later.",
  "retryAfter": 45
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input, validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## File Constraints

### File Size Limits
- **Avatar Images:** 2 MB maximum
- **PDF Documents:** 10 MB maximum
- **Verification Images (JPEG/PNG):** 10 MB maximum

### Accepted File Types

| Endpoint Type | Accepted Formats |
|--------------|------------------|
| Avatar | Any image (JPEG, PNG, GIF, WebP, etc.) |
| Resume | PDF only |
| Transcript | PDF only |
| Employer Verification | PDF, JPEG, PNG |
| Student Verification | PDF, JPEG, PNG |
| Job Resume | PDF only |

---

## Security Features

### Audit Logging
All document access attempts are logged with:
- User ID
- Document type
- Document owner
- Action (download)
- Success/failure
- IP address
- Timestamp

### File Storage
- Files are stored with unique keys to prevent collisions
- Old files are automatically deleted when replaced
- Support for both local storage and AWS S3

### Access Control
- Role-based authorization on all endpoints
- Owner-only access for most documents
- Admin override for all documents
- Job HR can access applicant resumes for their postings

---

## Testing with Postman

### Setting Up Environment Variables

Create an environment in Postman with these variables:

```json
{
  "base_url": "http://localhost:3000",
  "access_token": "<your_token_here>",
  "user_id": "<your_user_id>",
  "job_id": "42",
  "student_id": "<student_user_id>"
}
```

### Example Collection Structure

```
📁 KU-Connect Document API
├── 📁 Authentication
│   └── Login
├── 📁 User Profile
│   ├── Upload Avatar
│   └── Download Avatar
├── 📁 Profile Documents
│   ├── 📁 Resume
│   │   ├── Upload Resume
│   │   └── Download Resume
│   ├── 📁 Transcript
│   │   ├── Upload Transcript
│   │   └── Download Transcript
│   └── 📁 Employer Verification
│       ├── Upload Verification
│       └── Download Verification
├── 📁 Student Verification
│   ├── Upload Student Verification
│   └── Download Student Verification
└── 📁 Job Documents
    ├── Upload Job Resume
    ├── Download Job Resume
    └── Delete Job Resume
```

### Pre-request Script for Authentication

Add this to your collection's Pre-request Script:

```javascript
// Auto-set Authorization header if access_token exists
const token = pm.environment.get("access_token");
if (token) {
    pm.request.headers.add({
        key: "Authorization",
        value: `Bearer ${token}`
    });
}
```

---

## Examples

### Example 1: User Uploads Avatar

```bash
curl -X POST http://localhost:3000/api/profile/avatar \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "avatar=@/path/to/profile-picture.jpg"
```

### Example 2: Student Uploads Profile Resume

```bash
curl -X POST http://localhost:3000/api/documents/resume \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "resume=@/path/to/resume.pdf"
```

### Example 3: User Downloads Another User's Avatar

```bash
curl -X GET http://localhost:3000/api/profile/avatar/user-123/download \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -o avatar.jpg
```

### Example 4: Admin Downloads Student's Transcript

```bash
curl -X GET http://localhost:3000/api/documents/transcript/user-123/download \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -o transcript.pdf
```

### Example 5: Unverified Student Uploads Verification Document

```bash
curl -X POST http://localhost:3000/api/documents/student-verification \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "verification=@/path/to/student-id.jpg"
```

### Example 5: Unverified Student Uploads Verification Document

```bash
curl -X POST http://localhost:3000/api/documents/student-verification \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "verification=@/path/to/student-id.jpg"
```

### Example 6: Student Uploads Job-Specific Resume

```bash
curl -X POST http://localhost:3000/api/jobs/42/resume \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "resume=@/path/to/job-resume.pdf" \
  -F "source=UPLOADED"
```

### Example 7: Employer Downloads Applicant's Job Resume

```bash
curl -X GET http://localhost:3000/api/jobs/42/resume/user-123/download \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -o applicant-resume.pdf
```

---

## Notes

1. **Security Enhancement:** Direct file URL access has been removed. All file downloads must go through the protected `/download` endpoints with proper authentication and authorization.
2. **File Replacement:** Uploading a new file automatically deletes the old one
3. **Resume Source:** Job resumes can use profile resume or upload a new one
4. **Verification Status:** Only unverified students can upload verification documents
5. **Storage Providers:** System supports both local filesystem and AWS S3
6. **Download Security:** All downloads use secure streaming with proper headers
7. **Audit Trail:** All document access is logged for security and compliance
8. **Rate Limiting:** Download endpoints are rate-limited to 60 requests per minute per user

---

## Support

For issues or questions, please contact the development team or create an issue in the repository.

**Version:** 1.0.0  
**Last Updated:** October 25, 2025
