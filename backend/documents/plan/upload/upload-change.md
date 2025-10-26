# Job-specific resume uploads and selection — Implementation plan

This plan adds per-job application resumes while keeping the existing profile resume intact. A student can either:

- Use their profile resume for a specific job application, or
- Upload a different resume just for that job.

The design reuses the existing storage providers and Prisma models with minimal schema changes.

## Goals

- Allow 1 resume per (student, job) application.
- Two modes: use profile resume OR upload a PDF specifically for that job.
- Keep using the existing provider pattern (local/S3) with consistent prefixes.
- Enforce access control so only the student, the job’s HR owner, or ADMIN can access a job-application resume.
- Provide idempotent “upsert” semantics (changing source should clean up old uploaded files when safe).

## Data model

Existing schema (excerpt):

- `Student.resumeKey`: the student’s profile resume (PDF).
- `Resume` model: `{ id, studentId, jobId, link }` — already relates a resume to a job and student.

Recommended adjustments:

1) Add a composite unique constraint to ensure only one resume per (studentId, jobId):

```prisma
model Resume {
  id        Int     @id @default(autoincrement())
  student   Student @relation(fields: [studentId], references: [id])
  studentId Int
  job       Job     @relation(fields: [jobId], references: [id])
  jobId     Int
  link      String

  @@unique([studentId, jobId])
}
```

2) Optional but helpful: track the source used for a job-specific resume.

```prisma
enum ResumeSource {
  PROFILE
  UPLOADED
}

model Resume {
  // ...existing fields
  source ResumeSource @default(UPLOADED)
}
```

Notes:
- We’ll store the storage file key in `Resume.link` (same as other docs). For PROFILE mode, `link` points to `Student.resumeKey`.
- If the optional `source` isn’t added, we can still infer source by comparing `Resume.link === Student.resumeKey` on reads; however, the explicit field simplifies maintenance.

## Storage layout

- Keep using the existing providers (`storageFactory`, `localStorageProvider`, `s3StorageProvider`).
- New prefix for uploaded job-application resumes: `resumes/job-applications/<jobId>`.
  - Example key: `resumes/job-applications/42/b3d0b6a8-... .pdf`
- For PROFILE mode, no new upload occurs and no file is duplicated; the `Resume.link` references the existing `Student.resumeKey`.

## API design

Base: authenticated routes. Student role required for create/update; read permissions vary (see Access control).

1) Create or replace job application resume (upsert)

- Method/Path: `POST /api/jobs/:jobId/resume`
- Auth: `STUDENT`
- Content types:
  - Use profile resume: `application/json` with body `{ "mode": "profile" }`
  - Upload new resume: `multipart/form-data` with field `resume` (PDF), optional body `mode=upload` (default when file present)
- Behavior:
  - Validate job exists.
  - Ensure exactly one resume per (student, job) using upsert.
  - PROFILE mode: require `Student.resumeKey` exists; set `Resume.link = Student.resumeKey` and `source=PROFILE` (if present). If an older uploaded file exists for this pair, delete that file (but never delete the profile resume).
  - UPLOAD mode: validate PDF (10 MB); upload with prefix `resumes/job-applications/<jobId>`; set `Resume.link` to returned key and `source=UPLOADED`. If a previous uploaded file exists for this pair and is different, delete the old uploaded file.
- Responses:
  - 200: `{ success, message, data: { jobId, link, source } }`
  - 400: invalid mode or missing profile resume for PROFILE mode; invalid file (size/type)
  - 404: job not found or student profile missing

2) Get job application resume URL

- Method/Path: `GET /api/jobs/:jobId/resume/:studentUserId`
- Auth: owner student OR job owner employer OR ADMIN
- Behavior: resolve `(studentId, jobId)` to `Resume.link`; `storageProvider.getFileUrl(link)`; return signed or local URL.
- Responses: 200 with URL, 404 if not found or not created yet.

3) Remove job application resume (optional)

- Method/Path: `DELETE /api/jobs/:jobId/resume`
- Auth: `STUDENT` (owner)
- Behavior: If current record is UPLOADED and the file exists, delete it; remove the `Resume` row. If using PROFILE, just delete the `Resume` row.

Convenience route (optional):

- `GET /api/jobs/:jobId/resume/self` → returns the current student’s job resume URL (avoids passing `studentUserId`).

## Access control

- POST/DELETE: only the authenticated student who owns the resume for that job.
- GET: allowed if any of below is true:
  - The authenticated user is the owner student.
  - The authenticated user is `ADMIN`.
  - The authenticated user is `EMPLOYER` and owns the job (i.e., their `HR.id` matches the job’s `hrId`).

## Validation and constraints

- Job existence check via Prisma `job.findUnique`.
- Student existence via `student.findUnique({ where: { userId: req.user.id } })`.
- PDF only, 10 MB limit using multer config already used by resume uploads.
- One-per-pair enforced via Prisma `@@unique([studentId, jobId])` (migrate) plus application-level upsert.
- Robust cleanup: when switching from UPLOADED to PROFILE or replacing an uploaded file, delete the old uploaded file key if and only if it is not equal to `Student.resumeKey`.

## Controller sketch

Create a folder called `document-controler` and put the  `documentsController.js` in and create `jobDocumentController.js` to hold the code. Pseudocode for upsert:

```js
async function upsertJobResume(req, res) {
  const { jobId } = req.params
  const userId = req.user.id // student

  // Validate job and student
  const [job, student] = await Promise.all([
    prisma.job.findUnique({ where: { id: Number(jobId) }, select: { id: true, hrId: true } }),
    prisma.student.findUnique({ where: { userId }, select: { id: true, resumeKey: true } })
  ])
  if (!job) return 404
  if (!student) return 404

  const mode = req.body?.mode || (req.file ? 'upload' : 'profile')
  if (!['profile', 'upload'].includes(mode)) return 400

  let fileKey
  let source = 'UPLOADED'

  if (mode === 'profile') {
    if (!student.resumeKey) return 400
    fileKey = student.resumeKey
    source = 'PROFILE'
  } else {
    if (!req.file) return 400
    // validate mimetype is application/pdf (multer layer)
    fileKey = await storageProvider.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      { prefix: `resumes/job-applications/${job.id}` }
    )
  }

  // Check prior resume for cleanup
  const existing = await prisma.resume.findUnique({
    where: { studentId_jobId: { studentId: student.id, jobId: job.id } },
    select: { link: true }
  }).catch(() => null)

  // Upsert
  const saved = await prisma.resume.upsert({
    where: { studentId_jobId: { studentId: student.id, jobId: job.id } },
    create: { studentId: student.id, jobId: job.id, link: fileKey, ...(prismaHasSource && { source }) },
    update: { link: fileKey, ...(prismaHasSource && { source }) }
  })

  // Cleanup old uploaded file (if different from profile)
  if (mode === 'upload' && existing?.link && existing.link !== student.resumeKey && existing.link !== fileKey) {
    try { await storageProvider.deleteFile(existing.link) } catch (_) {}
  }
  if (mode === 'profile' && existing?.link && existing.link !== student.resumeKey) {
    try { await storageProvider.deleteFile(existing.link) } catch (_) {}
  }

  return res.status(200).json({ success: true, message: 'Job resume saved', data: { jobId: job.id, link: saved.link, source } })
}
```

For GET (URL):

```js
async function getJobResumeUrl(req, res) {
  const { jobId, studentUserId } = req.params
  const me = req.user

  const [job, student] = await Promise.all([
    prisma.job.findUnique({ where: { id: Number(jobId) }, select: { id: true, hrId: true } }),
    prisma.student.findUnique({ where: { userId: studentUserId }, select: { id: true, userId: true, user: { select: { id: true } } } })
  ])
  if (!job || !student) return 404

  // Access: owner, ADMIN, or HR owner of job
  if (!(me.id === student.userId || me.role === 'ADMIN' || await isHrOwnerOfJob(me, job))) return 403

  const resume = await prisma.resume.findUnique({
    where: { studentId_jobId: { studentId: student.id, jobId: job.id } },
    select: { link: true }
  })
  if (!resume) return 404

  const url = await storageProvider.getFileUrl(resume.link)
  return res.status(200).json({ success: true, message: 'OK', data: { url } })
}
```

Helper `isHrOwnerOfJob(me, job)` can query the employer’s HR id and compare with `job.hrId`.

## Routes

Add a jobs sub-router, e.g. `src/routes/jobs/resume.js`.

- `POST /api/jobs/:jobId/resume` → `upsertJobResume` (multer PDF middleware)
- `GET /api/jobs/:jobId/resume/:studentUserId` → `getJobResumeUrl`
- `DELETE /api/jobs/:jobId/resume` → `deleteJobResume` (optional)

Wire in `src/routes/index.js` under `/api/jobs`.

Multer config can reuse the existing `pdfUpload` from documents routes (10 MB, PDF only) or create a dedicated instance identical to it.

## Tests

- Controller unit tests (mock prisma + storageProvider):
  - PROFILE mode succeeds; fails when student has no `resumeKey`.
  - UPLOAD mode enforces PDF and size; uploads and stores prefix with `jobId`.
  - Upsert semantics: second call replaces prior; old uploaded file is deleted when appropriate.
  - Access control for GET: owner, ADMIN, job HR owner allowed; others forbidden.
- Integration tests for routes with in-memory SQLite (`TEST_DATABASE_URL` already present) and local storage provider.
- Test the added routes as well.

## Migrations

1) Add composite unique on `Resume (studentId, jobId)`.
2) (Optional) Add `ResumeSource` enum and `Resume.source` field with default `UPLOADED`.

Migration name suggestion: `add_job_resume_unique_and_source`.

## Rollout and compatibility

- Backward compatible with existing profile resume endpoints.
- No change required for existing profile resume storage.
- If `source` is added, defaulting to `UPLOADED` maintains compatibility; existing rows can be backfilled by comparing against `Student.resumeKey` if needed.

## Open questions / assumptions

- We assume “applying” to a job is represented by presence of a `Resume` row (and/or `StudentInterest`). This plan does not require `StudentInterest`, but it can coexist.
- We assume employers (HR) should be able to view applicants’ resumes for their own jobs.
- We do not duplicate bytes for PROFILE mode; we reference the same file key to save storage.

## Next steps

1) Add Prisma migration(s) described above and regenerate client.
2) Implement controller and routes as outlined; reuse existing multer PDF config.
3) Add unit/integration tests.
4) Update `documents/uploads/UPLOAD_SYSTEM_README.md` to document new endpoints and behavior.
