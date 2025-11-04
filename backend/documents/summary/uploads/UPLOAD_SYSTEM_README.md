# File Upload System

Complete implementation of the storage provider pattern for handling user document uploads.

## Features

- **Multiple document types supported:**
  - Profile avatars (images, 2 MB max)
  - Student resumes (PDF, 10 MB max)
  - Student transcripts (PDF, 10 MB max)
  - Employer verification documents (JPEG/PNG/PDF, 10 MB max)

- **Provider-based architecture:**
  - Local file system storage (development)
  - AWS S3 storage (production)
  - Easy to extend with new providers

- **Security:**
  - Role-based access control
  - File type validation
  - Size limits enforced
  - Secure file naming (UUID-based)

## Setup

### 1. Install Dependencies

```bash
npm install
```

Required packages: `multer`, `uuid`, `mime-types`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `dotenv`

### 2. Run Database Migration

```bash
npx prisma migrate dev --name add_user_and_profile_docs_keys
```

This adds the following fields:

- `User.avatarKey`
- `Student.resumeKey`
- `Student.transcriptKey`
- `HR.verificationDocKey`

### 3. Configure Environment Variables

Create or update `.env`:

```env
# Storage provider: 'local' or 's3'
STORAGE_PROVIDER=local

# For S3 provider only:
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_REGION=us-east-1
# AWS_BUCKET_NAME=your-bucket-name

# Server config
PORT=3000
NODE_ENV=development
```

### 4. Local Storage Setup

When using `STORAGE_PROVIDER=local`, files are stored in `<project>/uploads/`. The server automatically serves this directory in development mode.

Directory structure:

```
uploads/
  avatars/
  resumes/
  transcripts/
  employer-docs/
```

### 5. S3 Setup (Production)

1. Create an S3 bucket
2. Set up IAM user with permissions for:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
3. Add credentials to `.env`
4. Set `STORAGE_PROVIDER=s3`

## API Endpoints

### Avatar Endpoints

**Upload Avatar**

```http
POST /api/profile/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: avatar (file, image/*, max 2MB)
```

**Get Avatar URL**

```http
GET /api/profile/avatar/:userId
Authorization: Bearer <token>
```

### Resume Endpoints (Students only)

**Upload Resume**

```http
POST /api/documents/resume
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: resume (file, PDF, max 10MB)
```

**Get Resume URL**

```http
GET /api/documents/resume/:userId
Authorization: Bearer <token>
```

_Access: Owner or ADMIN_

### Transcript Endpoints (Students only)

**Upload Transcript**

```http
POST /api/documents/transcript
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: transcript (file, PDF, max 10MB)
```

**Get Transcript URL**

```http
GET /api/documents/transcript/:userId
Authorization: Bearer <token>
```

_Access: Owner or ADMIN_

### Employer Verification Endpoints (HR only)

**Upload Verification Document**

```http
POST /api/documents/employer-verification
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: verification (file, JPEG/PNG/PDF, max 10MB)
```

**Get Verification Document URL**

```http
GET /api/documents/employer-verification/:userId
Authorization: Bearer <token>
```

_Access: Owner or ADMIN_

### Job-Specific Resume Endpoints (Students)

**Upsert Job Application Resume**

```http
POST /api/jobs/:jobId/resume
Authorization: Bearer <token>
Content-Type: multipart/form-data OR application/json

Option 1 - Upload new resume:
Body: resume (file, PDF, max 10MB)

Option 2 - Use profile resume:
Body: { "mode": "profile" }
```

_Access: STUDENT only_

**Get Job Application Resume URL**

```http
GET /api/jobs/:jobId/resume/:studentUserId
Authorization: Bearer <token>
```

_Access: Owner student, job's HR owner, or ADMIN_

**Get Own Job Application Resume URL (convenience)**

```http
GET /api/jobs/:jobId/resume/self
Authorization: Bearer <token>
```

_Access: STUDENT only (returns current user's resume)_

**Delete Job Application Resume**

```http
DELETE /api/jobs/:jobId/resume
Authorization: Bearer <token>
```

_Access: STUDENT only (owner)_

**Note:** Each student can have only one resume per job. The endpoint supports two modes:

- **UPLOAD mode**: Upload a PDF resume specifically for this job (stored in `resumes/job-applications/{jobId}/`)
- **PROFILE mode**: Use the student's profile resume (references existing `Student.resumeKey`)

When switching modes or uploading a new file, the old uploaded file is automatically cleaned up (profile resumes are never deleted).

## Testing

```bash
npm test
```

Test files:

- `tests/services/storage/interface.test.js` - Provider interface compliance
- `tests/services/storage/localStorageProvider.test.js` - Local storage operations
- `tests/services/storage/s3StorageProvider.test.js` - S3 operations (requires AWS credentials)
- `tests/controllers/documentsController.test.js` - Profile document API endpoint tests
- `tests/controllers/jobDocumentController.test.js` - Job-specific resume API endpoint tests

**Note:** S3 tests are skipped if AWS credentials are not configured.

## Architecture

### Storage Provider Interface

```javascript
class StorageProvider {
  async uploadFile(buffer, filename, mimeType, userId, options)
  async getFileUrl(fileKey)
  async deleteFile(fileKey)
}
```

### Local Provider

- Stores files in `uploads/<prefix>/`
- Returns URL: `/uploads/<prefix>/<filename>`
- File naming: `<uuid>.<ext>`
- Prefixes used:
  - `avatars/` - User profile pictures
  - `resumes/` - Student profile resumes
  - `transcripts/` - Student transcripts
  - `employer-docs/` - Employer verification documents
  - `resumes/job-applications/{jobId}/` - Job-specific resumes

### S3 Provider

- Stores in S3 bucket with prefix
- Returns signed URLs (valid 5 minutes)
- Uses AWS SDK v3

### Factory Pattern

`storageFactory.js` creates the appropriate provider based on `STORAGE_PROVIDER` env variable.

## Security Notes

1. **File Validation:** MIME types checked before upload
2. **Access Control:** Role-based permissions enforced
3. **Size Limits:** Enforced via multer configuration
4. **Secure Naming:** UUIDs prevent path traversal
5. **Old File Cleanup:** Previous files deleted on new upload (best-effort)

## Switching Providers

To switch from local to S3:

1. Update `.env`: `STORAGE_PROVIDER=s3`
2. Add AWS credentials to `.env`
3. Restart server

**No code changes needed!** The factory pattern handles provider selection automatically.

## Troubleshooting

**Multer errors:**

- Check file size limits
- Verify MIME type matches allowed types
- Ensure field name matches API docs

**S3 errors:**

- Verify AWS credentials
- Check bucket permissions
- Ensure region is correct
- Check bucket exists

**Local storage errors:**

- Verify write permissions on `uploads/` directory
- Check disk space
- Ensure `STORAGE_PROVIDER=local` is set
