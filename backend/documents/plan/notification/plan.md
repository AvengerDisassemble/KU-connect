# KU-Connect: Bidirectional User Notification System (Implementation Plan)

This plan delivers a user-to-user notification feature with email delivery that fits the current backend (Express + Prisma, CommonJS) and is explicitly compatible with the updated Admin Announcement notification model in this branch (the one slated for merge).

## Scope
- Student → Employer: notify employer when a student applies to a job.
- Employer → Student: notify student when an employer qualifies/rejects an application.
- Persist in DB (in-app), email the recipient, list by user, mark as read.
- Keep compatible with existing Admin Announcement notifications.

## Key Constraints and Conventions
- Backend is CommonJS; use `module.exports/require` (not ES modules).
- Auto route registration under `src/routes` maps folder structure to `/api/...`.
- Admin notifications in this branch use `Announcement` + `Notification` (fan-out with fields `announcementId`, `userId`, `isRead`, `createdAt`). We MUST NOT repurpose or alter this model to avoid regressions.
- Reuse `src/utils/emailUtils.sendEmail` for SMTP/Ethereal support.
- Use existing middlewares: `authMiddleware`, `verifiedUserMiddleware`, `roleMiddleware`, and `rateLimitMiddleware`.

## Data Model
Because `Notification` is already tied to `Announcement` in this branch, introduce a parallel model for direct user notifications.

Prisma additions (new model, minimal surface, FK to User):

```prisma
model UserNotification {
  id             String   @id @default(cuid())
  recipientId    String
  senderId       String?
  type           String   // e.g. 'EMPLOYER_APPLICATION', 'APPLICATION_STATUS'
  title          String
  message        String
  read           Boolean  @default(false)
  createdAt      DateTime @default(now())
  // optional linking for future deep queries (non-blocking now)
  jobId          String?  // FK to Job.id (optional)
  applicationId  String?  // FK to Application.id (optional)

  recipient      User     @relation(fields: [recipientId], references: [id])
  sender         User?    @relation(fields: [senderId], references: [id])
}

// Helpful indexes
@@index([recipientId, createdAt])
@@index([recipientId, read])
```

Notes:
- Keeps existing `Notification` (announcement fan-out) untouched.
- Adds optional job/application linkage for future UI; can be omitted if we want the smallest change.

Migration steps:
- Update `backend/prisma/schema.prisma` with `UserNotification` (generator already outputs to `src/generated/prisma`).
- Run migration and regenerate client (see How to Run below) to update the committed client under `src/generated/prisma`.

## Service Layer: `src/services/notificationService.js`
Create a dedicated service with small, testable functions that encapsulate DB + email. Contracts below:

- notifyEmployerOfApplication({ studentUserId, jobId })
  - Resolve employer’s `userId` via `Job.hr.userId`.
  - Build title/message using student’s `User.name` + `User.surname` and `Job.title`.
  - Insert `UserNotification` with type `EMPLOYER_APPLICATION`.
  - Send email to employer (lookup `User.email` by employer userId) via `sendEmail`.
  - Return created notification.

- notifyStudentOfApproval({ employerUserId, studentUserId, jobId, status, applicationId })
  - Build title/message including job title and status (lowercased for readability; `status` matches `ApplicationStatus` enum: `QUALIFIED` | `REJECTED`).
  - Insert `UserNotification` with type `APPLICATION_STATUS`.
  - Send email to student (lookup `User.email` by student userId) via `sendEmail`.
  - Return created notification.

- getNotificationsForUser(userId, { page=1, limit=20 })
  - Paginates by createdAt desc where recipientId=userId

- markAsRead({ id, userId })
  - Sets read=true only if recipientId matches `userId` (prevents privilege escalation)

- Internal helpers
  - createUserNotification(data)
  - sendEmailNotification(toUserId, subject, text) → resolve `User.email` then call `sendEmail`.

Compatibility placeholders:
- Add TODO blocks where we could later forward to a unified notification API if the admin branch introduces one post-merge.

Error modes:
- If email fails, log and continue (don’t fail DB persist).
- Throw 404 on missing job/employer/student as appropriate.

## Controllers: `src/controllers/notificationController.js`
Expose thin HTTP controllers that call the service:
- notifyEmployerOfApplication(req, res, next)
- notifyStudentOfApproval(req, res, next)
- getUserNotifications(req, res)
- markAsRead(req, res)

Notes:
- For runtime triggers we’ll prefer calling the service directly from job flows (see Integration). The POST trigger routes are optional/internal for decoupling or future event-ingestion.

## Routes
Create folder structure to align with the prompt and the auto-router:

- `src/routes/notifications/index.js` → base `/api/notifications`
  - GET `/` → list current user’s notifications
  - PATCH `/:id/read` → mark as read (recipient-only)

- `src/routes/notifications/employer/application.js` → `/api/notifications/employer/application`
  - POST → internal/system trigger to notify employer (guarded; see Security)

- `src/routes/notifications/student/approval.js` → `/api/notifications/student/approval`
  - POST → internal/system trigger to notify student (guarded)

Middlewares:
- All routes use `authMiddleware`.
- GET/PATCH additionally use `verifiedUserMiddleware`.
- Trigger POST routes are protected (see Security below) and rate-limited (use `writeLimiter`).

## Security
- Authorization: Only the recipient can read/mark their notifications.
- Internal trigger endpoints: protect with either of:
  - Role-based: restrict to `ADMIN` only, or
  - API key header check (simple HMAC/API key via env) if needed for system-to-system calls.
- In the main happy path, we will call service methods directly from existing controllers, avoiding public trigger endpoints entirely for user actions.

## Email Integration
Reuse `sendEmail` from `src/utils/emailUtils.js`.

Templates (plain text acceptable initially; HTML optional):
- Employer: `New Job Application` → "<student name> <surname> has applied for your job post \"<job title>\"."
- Student: `Application Update` → "Your job application for \"<job title>\" has been <approved/rejected>."

If SMTP is not configured, Ethereal preview links will be logged (already implemented).

## Integration Points in Existing Flows
- In `jobController.applyToJob` (after successful creation), call:
  - `notificationService.notifyEmployerOfApplication({ studentUserId: req.user.id, jobId })`

- In `jobController.manageApplication` (after successful status update), call:
  - Resolve `studentUserId` from the updated `Application` (join `Application.student.userId`).
  - `notificationService.notifyStudentOfApproval({ employerUserId: req.user.id, studentUserId, jobId, status, applicationId })`

Note: Implement via controller-level calls to keep service boundaries clear and minimize coupling inside `jobService`.

## Validation
Add `src/validators/notificationValidator.js` for POST triggers:
- employerApplicationSchema: { studentId: string, jobId: string }
- studentApprovalSchema: { employerId: string, studentId: string, jobId: string, status: enum('QUALIFIED','REJECTED') }

GET/PATCH rely on params and auth; use simple param checks in controller.

## Tests (Jest)
New tests mirror existing structure and style (CommonJS):

- `tests/src/routes/notifications/index.test.js`
  - POST employer/application sends in-app + email (mock `sendEmail`)
  - POST student/approval sends in-app + email (mock `sendEmail`)
  - GET /api/notifications returns only current user’s items
  - PATCH /api/notifications/:id/read sets read=true only for recipient

- `tests/src/services/notificationService.test.js`
  - Unit-test service methods with Prisma test DB; mock `sendEmail` to avoid network

Test scaffolding:
- Use existing `tests/src/utils/testHelpers.js` for users and cleanups; extend to `prisma.userNotification.deleteMany()` in cleanup.
- Seed minimal Job/HR/Student/Application per test case.

## Performance and Limits
- Index on (recipientId, createdAt) and (recipientId, read) to speed up inbox and unread counts.
- Rate-limit internal trigger endpoints (`writeLimiter`).
- Optional future: unread counter per user (cached) if needed.

## Rollout Steps
1) Schema: add `UserNotification` to `backend/prisma/schema.prisma` and run migration + generate (client outputs to `src/generated/prisma`).
2) Service: add `src/services/notificationService.js`.
3) Controller: add `src/controllers/notificationController.js`.
4) Routes: add `src/routes/notifications/...` per structure above.
5) Validators: add `src/validators/notificationValidator.js`.
6) Wire integration calls in `jobController.applyToJob` and `jobController.manageApplication` (resolve IDs using schema relations: `job.hr.userId`, `application.student.userId`).
7) Tests: add controller + service tests; mock email; update test cleanup to delete from `userNotification`.
8) Docs: this plan.

## Backward/Forward Compatibility
- No changes to existing `Notification`/`Announcement` behavior in this branch.
- All new functionality isolated under `UserNotification` and the `notifications` API.
- TODO (post-merge): consider unifying both notification types under a polymorphic design:
  - Either single table with nullable `announcementId` and/or `recipientId`, or
  - View/resolver layer that aggregates Admin + Direct notifications for the UI.

## Minimal Pseudo-APIs (for clarity)
- Create
  - `POST /api/notifications/employer/application` (internal)
  - `POST /api/notifications/student/approval` (internal)
- Read
  - `GET /api/notifications` → current user’s inbox
  - `PATCH /api/notifications/:id/read` → mark read

## Edge Cases
- Employer not found for job (deleted HR/user): 404
- Student not found for application: 404
- Duplicate application events: allow multiple notifications (idempotency in future if desired)
- Email failure: log + continue
- Access control: prevent marking others’ notifications as read

## Success Criteria
- DB rows created for each event and emails attempted
- Authenticated users see only their notifications and can mark them read
- Tests cover both flows and endpoints
- No regression to admin announcement notification system

## How to Run (Developer)
- After changes:
  - Install deps if needed
  - Run Prisma migration and generate
  - Run tests

Optional commands (PowerShell):
```powershell
cd backend

# Run migrations and generate client (output configured to src/generated/prisma)
npx prisma migrate dev --name add_user_notification
npx prisma generate

# Run tests
npm test
```

That’s the full plan. Next steps: apply schema, implement service/controllers/routes/validators, wire job flows, and add tests.
