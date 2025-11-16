
# PROJECT CONTEXT
We are building **KU Connect**, a job platform for Kasetsart University where:
- Students manage profiles and apply for jobs.
- Employers manage and approve job postings.
- Admins moderate and manage global notifications.

**Backend stack:**
- Express.js + Prisma ORM (PostgreSQL)
- JWT authentication
- RESTful API
- JavaScript Standard Style + JSDoc documentation

**Folder structure:** (see constitution.txt)
- /src/controllers → API endpoints
- /src/services → business logic
- /src/models → Prisma models
- /src/routes → API routes
- /tests → mirrors /src

---

# CURRENT STATUS
- The **admin notification system** (for global or role-based notifications) is **in development** in a separate branch: `feature/admin-notification`.
- The new notification feature must be **fully compatible** with that admin system and reuse its design (same schema, email helper, and notification logic where possible).
- If admin-related functions aren’t finished, define **temporary stub methods** with clear TODO markers.

---

# OBJECTIVE
Implement a **bidirectional, user-specific notification system** with **email delivery**:
1. **Student → Employer:** When a student applies for a job.
2. **Employer → Student:** When an employer approves or rejects a job posting or application.

Every notification should:
- Target a **specific recipient** (`recipientId`)
- Be stored in the database (in-app notification)
- Send an **email** to that recipient
- Be queryable by user
- Be markable as “read”

---

# FEATURE FLOWS

### 1. Student applies for a job
**Trigger:** Inside `jobApplicationController` (after successful application)
**Recipient:** Employer of the job post  
**Notification:**  
- Title: “New Job Application”  
- Message: “<student name> has applied for your job post '<job title>'.”  
**Action:**  
- Create in-app notification for the employer  
- Send email to the employer  

---

### 2. Employer approves or rejects a job posting or a student’s application
**Trigger:** Inside `jobApprovalController` or `employerController` (after employer approval/rejection)  
**Recipient:** Student who owns the application or related job post  
**Notification:**  
- Title: “Application Update” or “Job Post Approved/Rejected”  
- Message: “Your job application for '<job title>' has been approved/rejected.”  
**Action:**  
- Create in-app notification for the student  
- Send email to the student  

---

# DATA MODEL (ensure compatibility with admin branch)

If not defined yet, ensure the `Notification` model supports user-specific notifications:

```prisma
model Notification {
  id              String   @id @default(cuid())
  recipientId     String   // FK -> User.id
  senderId        String?  // FK -> User.id (who triggered it)
  type            String   // e.g. 'EMPLOYER_APPLICATION', 'APPLICATION_STATUS', 'SYSTEM_ANNOUNCEMENT'
  title           String
  message         String
  read            Boolean  @default(false)
  createdAt       DateTime @default(now())
  recipient       User     @relation(fields: [recipientId], references: [id])
  sender          User?    @relation(fields: [senderId], references: [id])
}
````

---

# SERVICE LAYER

Extend or create `/src/services/notificationService.js`:

```js
/**
 * Notify employer when a student applies for a job.
 */
export async function notifyEmployerOfApplication({ studentId, jobId }) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { employer: { select: { userId: true, companyName: true } } }
  })
  if (!job?.employer) throw new Error('Employer not found')

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { firstName: true, lastName: true }
  })

  const title = 'New Job Application'
  const message = `${student.firstName} ${student.lastName} has applied for your job post "${job.title}".`

  await createNotification({
    recipientId: job.employer.userId,
    senderId: studentId,
    type: 'EMPLOYER_APPLICATION',
    title,
    message
  })

  await sendEmailNotification(job.employer.userId, title, message)
}

/**
 * Notify student when employer approves or rejects their application or job post.
 */
export async function notifyStudentOfApproval({ employerId, studentId, jobId, status }) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { title: true } })
  const employer = await prisma.user.findUnique({ where: { id: employerId }, select: { firstName: true, lastName: true } })

  const title = 'Application Update'
  const message = `Your job application for "${job.title}" has been ${status.toLowerCase()} by ${employer.firstName} ${employer.lastName}.`

  await createNotification({
    recipientId: studentId,
    senderId: employerId,
    type: 'APPLICATION_STATUS',
    title,
    message
  })

  await sendEmailNotification(studentId, title, message)
}

// TODO: Replace these with admin-notification service imports when merged
async function createNotification(data) { /* stub for compatibility */ }
async function sendEmailNotification(userId, subject, message) { /* stub for compatibility */ }
```

---

# API ENDPOINTS

Add routes in `/src/routes/notificationRoutes.js`:

| Method  | Endpoint                                  | Description                                                 | Access             | Controller                                           |
| ------- | ----------------------------------------- | ----------------------------------------------------------- | ------------------ | ---------------------------------------------------- |
| `POST`  | `/api/notifications/employer/application` | Trigger employer notification when a student applies        | Internal/System    | `notificationController.notifyEmployerOfApplication` |
| `POST`  | `/api/notifications/student/approval`     | Trigger student notification when employer approves/rejects | Internal/System    | `notificationController.notifyStudentOfApproval`     |
| `GET`   | `/api/notifications`                      | Fetch current user’s notifications                          | Any logged-in user | `notificationController.getUserNotifications`        |
| `PATCH` | `/api/notifications/:id/read`             | Mark notification as read                                   | Any logged-in user | `notificationController.markAsRead`                  |

Example controller:

```js
/**
 * @desc Notify employer when student applies
 */
export async function notifyEmployerOfApplication(req, res, next) {
  try {
    const { studentId, jobId } = req.body
    await NotificationService.notifyEmployerOfApplication({ studentId, jobId })
    res.status(200).json({ message: 'Employer notified.' })
  } catch (err) {
    next(err)
  }
}

/**
 * @desc Notify student when employer approves or rejects
 */
export async function notifyStudentOfApproval(req, res, next) {
  try {
    const { employerId, studentId, jobId, status } = req.body
    await NotificationService.notifyStudentOfApproval({ employerId, studentId, jobId, status })
    res.status(200).json({ message: 'Student notified.' })
  } catch (err) {
    next(err)
  }
}
```

---

# TESTS

Under `/tests/controllers/notificationController.test.js` and `/tests/services/notificationService.test.js`:

* ✅ Student applying triggers employer notification (in-app + email)
* ✅ Employer approving triggers student notification (in-app + email)
* ✅ `GET /api/notifications` returns user-specific notifications
* ✅ `PATCH /api/notifications/:id/read` updates read status correctly

---

# GOAL

Produce backend code that:

* Implements **bidirectional user-specific notifications**
* Sends **both in-app and email alerts**
* Integrates cleanly with **admin-notification** system once merged
* Provides **complete API endpoints** and **test coverage**
* Includes clear **TODO markers** for post-merge integration

