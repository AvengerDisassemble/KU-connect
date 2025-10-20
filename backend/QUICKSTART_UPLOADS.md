# Quick Start Guide - File Upload System

## Prerequisites

Before you start, ensure you have:
- Node.js installed
- Dependencies installed: `npm install`
- Database set up and migrated

## Step 1: Install New Dependencies

Due to PowerShell execution policy restrictions, you'll need to install dependencies manually:

```powershell
npm install multer uuid mime-types dotenv
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Step 2: Run Database Migration

```powershell
npx prisma migrate dev --name add_user_and_profile_docs_keys
```

This will add fields:
- `User.avatarKey`
- `Student.resumeKey` and `Student.transcriptKey`
- `HR.verificationDocKey`

## Step 3: Configure Environment

Add to your `.env` file:

```env
STORAGE_PROVIDER=local
```

For S3 (production only), also add:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket
```

## Step 4: Test the Implementation

Run tests:
```powershell
npm test
```

## Step 5: Start the Server

```powershell
npm start
```

## Testing with Postman/Thunder Client

### Upload Avatar
```
POST http://localhost:3000/api/profile/avatar
Headers:
  Authorization: Bearer <your_jwt_token>
Body (form-data):
  avatar: <select an image file>
```

### Get Avatar URL
```
GET http://localhost:3000/api/profile/avatar/:userId
Headers:
  Authorization: Bearer <your_jwt_token>
```

### Upload Resume (Students)
```
POST http://localhost:3000/api/documents/resume
Headers:
  Authorization: Bearer <student_jwt_token>
Body (form-data):
  resume: <select a PDF file>
```

### Upload Transcript (Students)
```
POST http://localhost:3000/api/documents/transcript
Headers:
  Authorization: Bearer <student_jwt_token>
Body (form-data):
  transcript: <select a PDF file>
```

### Upload Employer Verification (HR/Employer)
```
POST http://localhost:3000/api/documents/employer-verification
Headers:
  Authorization: Bearer <hr_jwt_token>
Body (form-data):
  verification: <select JPEG/PNG/PDF file>
```

## File Structure

After implementation, your project structure includes:

```
backend/
├── src/
│   ├── controllers/
│   │   ├── profileController.js (updated with avatar methods)
│   │   └── documentsController.js (NEW)
│   ├── routes/
│   │   ├── profile/index.js (updated)
│   │   └── documents/index.js (NEW)
│   └── services/
│       ├── storageFactory.js (NEW)
│       └── storage/
│           ├── storageProvider.js (NEW - interface)
│           ├── localStorageProvider.js (NEW)
│           └── s3StorageProvider.js (NEW)
├── tests/
│   ├── services/storage/ (NEW test files)
│   └── controllers/documentsController.test.js (NEW)
├── uploads/ (created automatically when files are uploaded)
│   ├── avatars/
│   ├── resumes/
│   ├── transcripts/
│   └── employer-docs/
└── prisma/
    └── schema.prisma (updated)
```

## Troubleshooting

### "Module not found" errors
Run: `npm install`

### "Column does not exist" database errors
Run: `npx prisma migrate dev`
Then: `npx prisma generate`

### Multer file upload errors
- Check file size (avatars: 2MB, documents: 10MB)
- Verify MIME type is correct
- Ensure field name matches (avatar/resume/transcript/verification)

### S3 errors
- Verify AWS credentials in `.env`
- Check IAM permissions
- Ensure bucket exists and region is correct

## Security Notes

- All endpoints require JWT authentication
- Role-based access control is enforced
- File types are validated
- Size limits are strictly enforced
- File keys use UUIDs to prevent path traversal

For more details, see `UPLOAD_SYSTEM_README.md`
