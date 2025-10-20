# User Documents & Avatars — Storage Provider Implementation Plan

This plan adds a provider-based file storage layer for multiple user documents (Resume/Portfolio, Transcript, Employer Verification Documents) and profile avatars, wiring it into the existing Express + Prisma backend so the frontend/API remain unchanged when switching storage backends.

## Context and constraints
- Runtime: Node.js, Express 5, CommonJS modules ("type": "commonjs")
- ORM: Prisma with generated client in `src/generated/prisma`
- Auth: JWT, `req.user.id` is available on authenticated routes
- Current schema has no `avatarKey` field on `User`
- Requirements:
  - Avatar: one per user, images only, max 2 MB
  - Resume/Portfolio: PDF only, max 10 MB, one per student
  - Transcript: PDF preferred, max 10 MB, one per student
  - Employer Verification Document: JPEG/PNG/PDF, max 10 MB, one per HR

## Deliverables
- Storage Provider Interface + concrete providers (local, S3)
- Provider factory selected by `STORAGE_PROVIDER`
- Endpoints (proposed):
  - Avatar: `POST /api/profile/avatar`, `GET /api/profile/avatar/:userId`
  - Resume: `POST /api/documents/resume`, `GET /api/documents/resume/:userId`
  - Transcript: `POST /api/documents/transcript`, `GET /api/documents/transcript/:userId`
  - Employer Verification: `POST /api/documents/employer-verification`, `GET /api/documents/employer-verification/:userId`
- Static `/uploads` served only in development for local provider
- Optional test stubs under `tests/services/storage/`

---

## Step 0 — Dependencies and project configuration
- Add runtime dependencies:
  - `multer` (memoryStorage + validation)
  - `fs-extra` (already present) for local provider
  - `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` for S3 provider
  - `mime-types` (for robust mime/ext handling)
  - `uuid` (for unique keys)
  - Ensure `dotenv` is in dependencies (server uses it already)

Notes:
- Keep code CommonJS (`require/module.exports`).
- Follow JavaScript Standard Style: single quotes, no semicolons.

---

## Step 1 — Prisma schema update
- File: `backend/prisma/schema.prisma`
- Add to `model User`:
  - `avatarKey String?`  // nullable, stores provider-specific key
- Add to `model Student`:
  - `resumeKey String?`
  - `transcriptKey String?`
- Add to `model HR`:
  - `verificationDocKey String?`
- Migration:
  - Run: `npx prisma migrate dev -n add_user_and_profile_docs_keys`
- No service changes required for reads—Prisma will include `avatarKey` on `User` by default. If any explicit `select` is used elsewhere, update it to include `avatarKey` if needed.

---

## Step 2 — Storage Provider Interface
- File: `src/services/storage/storageProvider.js`
- Export an abstract base class with async methods:
  - `uploadFile(buffer, filename, mimeType, userId, options) -> Promise<string>` returns a fileKey
    - `options`: `{ prefix?: 'avatars' | 'resumes' | 'transcripts' | 'employer-docs' }`
    - Backward compatible default: `'avatars'` if omitted
  - `getFileUrl(fileKey) -> Promise<string>` returns accessible URL
  - `deleteFile(fileKey) -> Promise<void>` deletes by key
- Document the contract with JSDoc:
  - fileKey is provider-specific (e.g., `avatars/uuid.ext` for S3, `avatars/uuid.ext` for local when we include prefix in fileKey)
  - Providers must be idempotent and throw informative errors

---

## Step 3 — Local storage provider
- File: `src/services/storage/localStorageProvider.js`
- Behavior:
  - Root folder: `<project>/uploads`
  - Ensure directory with `fs.ensureDir`
  - Generate `fileKey` using `uuid` + original extension (derived via `mime-types` or `path.extname`), and prepend prefix
    - e.g., `avatars/uuid.ext`, `resumes/uuid.pdf`, `transcripts/uuid.pdf`, `employer-docs/uuid.ext`
  - `uploadFile` writes the buffer to disk under `uploads/<fileKey>`
  - `getFileUrl` returns `'/uploads/' + fileKey` (works when static mount is enabled)
  - `deleteFile` removes the file if exists (no error if already missing)
- Security considerations:
  - Do not trust client filename; derive extension from mime when possible
  - Never allow path traversal; only write under the `/uploads` folder with enforced prefixes

---

## Step 4 — S3 storage provider
- File: `src/services/storage/s3StorageProvider.js`
- Env required:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_BUCKET_NAME`
- Behavior:
  - Key prefixes: `avatars/`, `resumes/`, `transcripts/`, `employer-docs/`
  - Generate key via `uuid` + extension from mime
  - `uploadFile` uses `PutObjectCommand` to `AWS_BUCKET_NAME`
    - Set `ContentType` and `CacheControl: 'public, max-age=31536000'` (optional)
  - `getFileUrl` returns a signed URL (GetObject) valid for 300s
  - `deleteFile` uses `DeleteObjectCommand`
- Fail fast on missing envs with clear error messages

---

## Step 5 — Provider factory
- File: `src/services/storageFactory.js`
- Read `process.env.STORAGE_PROVIDER`:
  - `'s3'` -> instantiate S3 provider
  - default `'local'` -> instantiate local provider
- Export a singleton instance to reuse clients/resources

---

## Step 6 — Controller integration
- Files:
  - Avatar in `src/controllers/profileController.js` (as before)
  - New controller `src/controllers/documentsController.js` for resume, transcript, employer verification
- Add handlers:
  1) `uploadAvatar(req, res)`
     - Use `multer.memoryStorage()` middleware in route
     - Validation:
       - `file.mimetype.startsWith('image/')`
       - `limits: { fileSize: 2 * 1024 * 1024 }`
     - Steps:
       - `const userId = req.user.id`
       - Optional: fetch current `avatarKey` and delete it to avoid orphans (best effort)
  - `const fileKey = await storageProvider.uploadFile(file.buffer, file.originalname, file.mimetype, userId, { prefix: 'avatars' })`
       - `await prisma.user.update({ where: { id: userId }, data: { avatarKey: fileKey } })`
       - Return `{ success: true, message, data: { fileKey } }`
  2) `getAvatarUrl(req, res)`
     - Determine `requestedUserId = req.params.userId`
     - Fetch user; if no `avatarKey`, return 404 or `{ url: null }`
    - `const url = await storageProvider.getFileUrl(user.avatarKey)`
     - Return `{ url }`
  3) `uploadResume(req, res)` (students only)
    - Multer: memory storage, limits: 10 MB
    - Validation: `file.mimetype === 'application/pdf'`
    - Upload with `{ prefix: 'resumes' }`; save to `Student.resumeKey`
  4) `getResumeUrl(req, res)`
    - Fetch student by `userId`, ensure `resumeKey` exists, return `{ url }`
  5) `uploadTranscript(req, res)` (students only)
    - Multer: 10 MB; Validation: `application/pdf` (allow only PDF for simplicity)
    - Upload with `{ prefix: 'transcripts' }`; save to `Student.transcriptKey`
  6) `getTranscriptUrl(req, res)`
    - Fetch student by `userId`, ensure `transcriptKey` exists, return `{ url }`
  7) `uploadEmployerVerification(req, res)` (HR only)
    - Multer: 10 MB; Validation: `image/jpeg|image/png|application/pdf`
    - Upload with `{ prefix: 'employer-docs' }`; save to `HR.verificationDocKey`
  8) `getEmployerVerificationUrl(req, res)`
    - Fetch HR by `userId`, ensure `verificationDocKey` exists, return `{ url }`

- Style: Add JSDoc, consistent error responses, and log errors with context
- Access control suggestion:
  - Upload endpoints restricted to owner with proper role: student for resume/transcript, HR for employer verification
  - Get endpoints: owner and ADMIN; consider allowing HR to view student resumes only within application flows (future enhancement)

---

## Step 7 — Routes
- Files:
  - `src/routes/profile/index.js` — add avatar endpoints
  - `src/routes/documents/index.js` — add document endpoints for resume/transcript/employer verification
- Profile routes add:
  - `POST /avatar` (authenticated) -> `multer` middleware -> `profileController.uploadAvatar`
  - `GET /avatar/:userId` (authenticated) -> `profileController.getAvatarUrl`

- Documents routes add (auto-mounted under `/api/documents` by route auto-registrar):
  - `POST /resume` (auth, role: STUDENT) -> `documentsController.uploadResume`
  - `GET /resume/:userId` (auth, owner or ADMIN) -> `documentsController.getResumeUrl`
  - `POST /transcript` (auth, role: STUDENT) -> `documentsController.uploadTranscript`
  - `GET /transcript/:userId` (auth, owner or ADMIN) -> `documentsController.getTranscriptUrl`
  - `POST /employer-verification` (auth, role: EMPLOYER/HR) -> `documentsController.uploadEmployerVerification`
  - `GET /employer-verification/:userId` (auth, owner or ADMIN) -> `documentsController.getEmployerVerificationUrl`
- Keep existing `router.use(auth.authMiddleware)`
- Ensure role checks align with current app policy; by default, avatars are public once URL is obtained (S3 signed URL restricts time-bound access)

---

## Step 8 — Server static mount (development only)
- File: `server.js`
- When `STORAGE_PROVIDER === 'local'` and `NODE_ENV !== 'production'`, add:
  - `const express = require('express')`
  - `const path = require('path')`
  - `app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))`
- Rationale: expose local files for browser access during development; S3 provider doesn’t need this. This serves all prefixes under `/uploads/*`.

---

## Step 9 — Environment variables
- `.env` additions:
  - `STORAGE_PROVIDER=local`  # or `s3`
  - For S3:
    - `AWS_ACCESS_KEY_ID=...`
    - `AWS_SECRET_ACCESS_KEY=...`
    - `AWS_REGION=...`
    - `AWS_BUCKET_NAME=...`
- Confirm `FRONTEND_URL` is set for CORS

---

## Step 10 — Tests (Non-negotiable)
- Folder: `tests/services/storage/`
- Add stubs:
  1) `interface.test.js` — asserts providers implement all required methods
  2) `localStorageProvider.test.js` — uploads a small buffer, expects a key, verifies file exists, then deletes
  3) `s3StorageProvider.test.js` — only runs when S3 env vars are present; uploads, fetches signed URL, and deletes
  4) `documentsController.test.js` — validates mime/size rules and role access (use supertest + in-memory multer)
- Use temporary artifacts and clean up after tests

---

## Error handling and security notes
- Validate mime types strictly (avatars: `image/*`; resume: PDF; transcript: PDF; employer verification: JPEG/PNG/PDF)
- Enforce size caps via `multer` limits (avatars: 2 MB; others: 10 MB)
- Sanitize and generate server-side keys; never reuse raw client filenames
- For S3, set least-privilege IAM for PutObject/GetObject/DeleteObject on the `avatars/*` prefix
- Extend IAM to include `resumes/*`, `transcripts/*`, `employer-docs/*` prefixes
- When replacing documents, best-effort delete the previous key; do not fail the request if deletion fails after successful upload and DB update—log instead

---

## Rollout checklist
- [ ] Install dependencies
- [ ] Add `avatarKey`, `Student.resumeKey`, `Student.transcriptKey`, `HR.verificationDocKey` to Prisma schema and migrate
- [ ] Implement interface + providers + factory
- [ ] Add controller methods and routes (profile + documents)
- [ ] Add server static mount for development
- [ ] Configure `.env` for local and S3
- [ ] Smoke test with `STORAGE_PROVIDER=local`
- [ ] Switch to `s3` and repeat smoke test

---

## Acceptance criteria
- Avatar:
  - `POST /api/profile/avatar` accepts a single image (<2 MB) and stores key in DB
  - `GET /api/profile/avatar/:userId` returns `{ url }` (signed for S3; direct for local)
- Resume:
  - `POST /api/documents/resume` accepts a single PDF (<10 MB) and stores `Student.resumeKey`
  - `GET /api/documents/resume/:userId` returns `{ url }`
- Transcript:
  - `POST /api/documents/transcript` accepts a single PDF (<10 MB) and stores `Student.transcriptKey`
  - `GET /api/documents/transcript/:userId` returns `{ url }`
- Employer Verification:
  - `POST /api/documents/employer-verification` accepts JPEG/PNG/PDF (<10 MB) and stores `HR.verificationDocKey`
  - `GET /api/documents/employer-verification/:userId` returns `{ url }`
- Toggling `STORAGE_PROVIDER` between `local` and `s3` requires no frontend changes
- Files are stored under `uploads/<prefix>` (local) or `<prefix>/` in S3, where prefix ∈ {avatars, resumes, transcripts, employer-docs}
- Static `/uploads` is only served in development
