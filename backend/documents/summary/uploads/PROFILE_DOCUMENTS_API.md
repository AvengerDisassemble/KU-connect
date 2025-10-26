# Profile Documents API Reference

This document provides a quick reference for all user document upload endpoints including profile pictures (avatars), resumes, transcripts, and employer verification documents.

---

## Table of Contents
- [Authentication](#authentication)
- [Profile Picture (Avatar) API](#profile-picture-avatar-api)
- [Resume API](#resume-api)
- [Transcript API](#transcript-api)
- [Employer Verification Document API](#employer-verification-document-api)

---

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

---

## Profile Picture (Avatar) API

### 1. Upload Profile Picture

**Endpoint:** `POST /api/profile/avatar`

**Authorization:** Required (Any authenticated user)

**Content-Type:** `multipart/form-data`

**File Requirements:**
- Field name: `avatar`
- Allowed types: Any image (JPEG, PNG, GIF, WebP, etc.)
- Max size: 2 MB
- Single file only

**Request Example:**
```http
POST /api/profile/avatar HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="avatar"; filename="profile-photo.jpg"
Content-Type: image/jpeg

<binary image data>
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "fileKey": "avatars/user-123e4567-e89b-12d3-a456-426614174000/1729506000000-profile-photo.jpg"
  }
}
```

**Error Responses:**

*400 Bad Request - No file uploaded:*
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

*400 Bad Request - Invalid file type:*
```json
{
  "success": false,
  "message": "Only image files are allowed for avatars"
}
```

*413 Payload Too Large:*
```json
{
  "success": false,
  "message": "File size exceeds the 2 MB limit"
}
```

---

### 2. Get Profile Picture URL

**Endpoint:** `GET /api/profile/avatar/:userId`

**Authorization:** Required (Any authenticated user can view any avatar)

**Path Parameters:**
- `userId` (string, required): The ID of the user whose avatar to retrieve

**Request Example:**
```http
GET /api/profile/avatar/user-123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Avatar URL retrieved successfully",
  "data": {
    "url": "http://localhost:3000/uploads/avatars/user-123e4567-e89b-12d3-a456-426614174000/1729506000000-profile-photo.jpg"
  }
}
```

**Error Responses:**

*404 Not Found - User not found:*
```json
{
  "success": false,
  "message": "User not found"
}
```

*404 Not Found - No avatar uploaded:*
```json
{
  "success": false,
  "message": "No avatar found for this user",
  "data": {
    "url": null
  }
}
```

---

## Resume API

### 3. Upload Student Resume (Profile Resume)

**Endpoint:** `POST /api/documents/resume`

**Authorization:** Required (STUDENT role only)

**Content-Type:** `multipart/form-data`

**File Requirements:**
- Field name: `resume`
- Allowed types: PDF only
- Max size: 10 MB
- Single file only

**Request Example:**
```http
POST /api/documents/resume HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="resume"; filename="john-doe-resume.pdf"
Content-Type: application/pdf

<binary PDF data>
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "data": {
    "fileKey": "resumes/user-123e4567-e89b-12d3-a456-426614174000/1729506000000-john-doe-resume.pdf"
  }
}
```

**Error Responses:**

*400 Bad Request - No file uploaded:*
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

*400 Bad Request - Invalid file type:*
```json
{
  "success": false,
  "message": "Only PDF files are allowed"
}
```

*403 Forbidden - Not a student:*
```json
{
  "success": false,
  "message": "Access denied"
}
```

*404 Not Found - Student profile not found:*
```json
{
  "success": false,
  "message": "Student profile not found"
}
```

---

### 4. Get Student Resume URL

**Endpoint:** `GET /api/documents/resume/:userId`

**Authorization:** Required (Owner or ADMIN only)

**Access Control:**
- Students can only view their own resume
- Admins can view any student's resume

**Path Parameters:**
- `userId` (string, required): The ID of the user whose resume to retrieve

**Request Example:**
```http
GET /api/documents/resume/user-123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Resume URL retrieved successfully",
  "data": {
    "url": "http://localhost:3000/uploads/resumes/user-123e4567-e89b-12d3-a456-426614174000/1729506000000-john-doe-resume.pdf"
  }
}
```

**Error Responses:**

*403 Forbidden - Access denied:*
```json
{
  "success": false,
  "message": "Access denied"
}
```

*404 Not Found - Student profile not found:*
```json
{
  "success": false,
  "message": "Student profile not found"
}
```

*404 Not Found - No resume uploaded:*
```json
{
  "success": false,
  "message": "No resume found for this student",
  "data": {
    "url": null
  }
}
```

---

## Transcript API

### 5. Upload Student Transcript

**Endpoint:** `POST /api/documents/transcript`

**Authorization:** Required (STUDENT role only)

**Content-Type:** `multipart/form-data`

**File Requirements:**
- Field name: `transcript`
- Allowed types: PDF only
- Max size: 10 MB
- Single file only

**Request Example:**
```http
POST /api/documents/transcript HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="transcript"; filename="academic-transcript-2024.pdf"
Content-Type: application/pdf

<binary PDF data>
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Transcript uploaded successfully",
  "data": {
    "fileKey": "transcripts/user-123e4567-e89b-12d3-a456-426614174000/1729506000000-academic-transcript-2024.pdf"
  }
}
```

**Error Responses:**

*400 Bad Request - No file uploaded:*
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

*400 Bad Request - Invalid file type:*
```json
{
  "success": false,
  "message": "Only PDF files are allowed"
}
```

*403 Forbidden - Not a student:*
```json
{
  "success": false,
  "message": "Access denied"
}
```

*404 Not Found - Student profile not found:*
```json
{
  "success": false,
  "message": "Student profile not found"
}
```

---

### 6. Get Student Transcript URL

**Endpoint:** `GET /api/documents/transcript/:userId`

**Authorization:** Required (Owner or ADMIN only)

**Access Control:**
- Students can only view their own transcript
- Admins can view any student's transcript

**Path Parameters:**
- `userId` (string, required): The ID of the user whose transcript to retrieve

**Request Example:**
```http
GET /api/documents/transcript/user-123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Transcript URL retrieved successfully",
  "data": {
    "url": "http://localhost:3000/uploads/transcripts/user-123e4567-e89b-12d3-a456-426614174000/1729506000000-academic-transcript-2024.pdf"
  }
}
```

**Error Responses:**

*403 Forbidden - Access denied:*
```json
{
  "success": false,
  "message": "Access denied"
}
```

*404 Not Found - Student profile not found:*
```json
{
  "success": false,
  "message": "Student profile not found"
}
```

*404 Not Found - No transcript uploaded:*
```json
{
  "success": false,
  "message": "No transcript found for this student",
  "data": {
    "url": null
  }
}
```

---

## Employer Verification Document API

### 7. Upload Employer Verification Document

**Endpoint:** `POST /api/documents/employer-verification`

**Authorization:** Required (EMPLOYER role only)

**Content-Type:** `multipart/form-data`

**File Requirements:**
- Field name: `verification`
- Allowed types: JPEG, PNG, or PDF
- Max size: 10 MB
- Single file only

**Request Example:**
```http
POST /api/documents/employer-verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="verification"; filename="company-certificate.pdf"
Content-Type: application/pdf

<binary PDF data>
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Alternative File Types Example:**
```http
POST /api/documents/employer-verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="verification"; filename="business-license.jpg"
Content-Type: image/jpeg

<binary JPEG data>
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Employer verification document uploaded successfully",
  "data": {
    "fileKey": "employer-docs/user-123e4567-e89b-12d3-a456-426614174000/1729506000000-company-certificate.pdf"
  }
}
```

**Error Responses:**

*400 Bad Request - No file uploaded:*
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

*400 Bad Request - Invalid file type:*
```json
{
  "success": false,
  "message": "Only JPEG, PNG, or PDF files are allowed"
}
```

*403 Forbidden - Not an employer:*
```json
{
  "success": false,
  "message": "Access denied"
}
```

*404 Not Found - HR profile not found:*
```json
{
  "success": false,
  "message": "HR profile not found"
}
```

---

### 8. Get Employer Verification Document URL

**Endpoint:** `GET /api/documents/employer-verification/:userId`

**Authorization:** Required (Owner or ADMIN only)

**Access Control:**
- Employers can only view their own verification document
- Admins can view any employer's verification document

**Path Parameters:**
- `userId` (string, required): The ID of the user whose verification document to retrieve

**Request Example:**
```http
GET /api/documents/employer-verification/user-123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Employer verification URL retrieved successfully",
  "data": {
    "url": "http://localhost:3000/uploads/employer-docs/user-123e4567-e89b-12d3-a456-426614174000/1729506000000-company-certificate.pdf"
  }
}
```

**Error Responses:**

*403 Forbidden - Access denied:*
```json
{
  "success": false,
  "message": "Access denied"
}
```

*404 Not Found - HR profile not found:*
```json
{
  "success": false,
  "message": "HR profile not found"
}
```

*404 Not Found - No verification document uploaded:*
```json
{
  "success": false,
  "message": "No verification document found for this employer",
  "data": {
    "url": null
  }
}
```

---

## Summary Table

| Endpoint | Method | Role | File Field | File Types | Max Size |
|----------|--------|------|------------|------------|----------|
| `/api/profile/avatar` | POST | Any | `avatar` | Images (JPEG, PNG, GIF, etc.) | 2 MB |
| `/api/profile/avatar/:userId` | GET | Any | - | - | - |
| `/api/documents/resume` | POST | STUDENT | `resume` | PDF | 10 MB |
| `/api/documents/resume/:userId` | GET | Owner/ADMIN | - | - | - |
| `/api/documents/transcript` | POST | STUDENT | `transcript` | PDF | 10 MB |
| `/api/documents/transcript/:userId` | GET | Owner/ADMIN | - | - | - |
| `/api/documents/employer-verification` | POST | EMPLOYER | `verification` | JPEG, PNG, PDF | 10 MB |
| `/api/documents/employer-verification/:userId` | GET | Owner/ADMIN | - | - | - |

---

## Common Notes

### File Upload Behavior
- **Replacement:** Uploading a new file automatically replaces the previous file
- **Deletion:** Old files are deleted from storage when replaced (best-effort)
- **Storage:** Files are stored with timestamps and organized by user ID

### Access Control Patterns
1. **Public Read (Avatar):** Any authenticated user can view any user's avatar
2. **Private Read (Documents):** Only the owner or ADMIN can view documents
3. **Role-Based Write:** Upload permissions are restricted by role (STUDENT, EMPLOYER)

### File Key Format
All file keys follow the pattern:
```
<prefix>/<userId>/<timestamp>-<original-filename>
```

Examples:
- `avatars/user-123/1729506000000-profile.jpg`
- `resumes/user-456/1729506100000-resume.pdf`
- `transcripts/user-456/1729506200000-transcript.pdf`
- `employer-docs/user-789/1729506300000-verification.pdf`

### Error Handling
- All endpoints return JSON responses
- Success responses have `success: true`
- Error responses have `success: false` and descriptive `message`
- HTTP status codes follow REST conventions (200, 400, 403, 404, 500)

---

## Example Usage Workflows

### Student Onboarding Flow
1. Register as STUDENT
2. Upload avatar: `POST /api/profile/avatar`
3. Upload resume: `POST /api/documents/resume`
4. Upload transcript: `POST /api/documents/transcript`

### Employer Verification Flow
1. Register as EMPLOYER
2. Upload avatar: `POST /api/profile/avatar`
3. Upload verification: `POST /api/documents/employer-verification`
4. Wait for ADMIN approval

### Document Update Flow
1. Retrieve current document: `GET /api/documents/{type}/:userId`
2. Upload new version: `POST /api/documents/{type}`
3. Old file is automatically replaced

### Admin Review Flow
1. List all profiles: `GET /api/profile/` (ADMIN only)
2. View user avatar: `GET /api/profile/avatar/:userId`
3. Review documents: `GET /api/documents/{type}/:userId`
4. Approve/reject user verification

---

## Storage Configuration

The application supports two storage providers:
- **Local Storage:** Files stored in `backend/uploads/` directory
- **AWS S3:** Files stored in configured S3 bucket

Storage provider is configured via environment variables:
```env
STORAGE_PROVIDER=local  # or 's3'
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

---

## Security Considerations

1. **Authentication Required:** All endpoints require valid JWT token
2. **Role-Based Access:** Upload permissions enforced by role middleware
3. **File Type Validation:** Only allowed MIME types are accepted
4. **File Size Limits:** Enforced at upload time to prevent abuse
5. **Access Control:** Documents protected by owner/admin access rules
6. **URL Expiration:** Generated URLs may expire based on storage provider (S3 default: 1 hour)

---

## Troubleshooting

### "No file uploaded" Error
- Ensure the file field name matches the endpoint requirement
- Verify Content-Type is `multipart/form-data`
- Check that file is properly attached to request

### "Only [TYPE] files are allowed" Error
- Verify file MIME type matches allowed types
- For avatars: any image type is allowed
- For PDFs: ensure file is actually a PDF (not renamed)

### "File size exceeds limit" Error
- Check file size before upload:
  - Avatars: max 2 MB
  - Documents: max 10 MB
- Compress or optimize file if necessary

### "Profile not found" Error
- Ensure user has completed profile setup
- Students must have Student profile created
- Employers must have HR profile created

### "Access denied" Error
- Verify JWT token is valid and not expired
- Check user has correct role for endpoint
- For GET requests, ensure requesting own resource or have ADMIN role

---

## Next Steps

After implementing these endpoints in Postman:
1. Test complete user registration and document upload flow
2. Verify file replacement behavior
3. Test access control (try accessing other users' private documents)
4. Test with different file types and sizes
5. Verify storage provider configuration (local vs S3)

For job-specific resume uploads, see [POSTMAN_JOB_RESUME_API.md](./POSTMAN_JOB_RESUME_API.md).
