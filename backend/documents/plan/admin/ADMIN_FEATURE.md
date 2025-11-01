
# 🧭 ADMIN FEATURE TODO – KU CONNECT BACKEND

> **Purpose:**  
> Track all tasks required to implement the **Admin Feature** (user account management + announcement system + dashboard).  
> Read the `constitution/context.md` to understand the context.
> Follow the **development & authentication guides** inside `backend/documents` before implementing.

---

## ⚙️ OVERVIEW

The Admin Feature will enable:
- 👤 **Account Management** with four statuses:  
  `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- 📰 **Announcement System** with audience targeting:
  `ALL`, `STUDENTS`, `EMPLOYERS`, `PROFESSORS`, `ADMINS`
- 📊 **Dashboard** for platform insights and system statistics.

---

## 🧱 DATABASE TASKS

- [ ] **Add Enums**
  ```prisma
  enum UserStatus {
    PENDING
    APPROVED
    REJECTED
    SUSPENDED
  }

  enum AnnouncementAudience {
    ALL
    STUDENTS
    EMPLOYERS
    PROFESSORS
    ADMINS
  }

  enum NotificationPriority {
    LOW
    MEDIUM
    HIGH
  }
````

* [ ] **Update User model**

  ```prisma
  model User {
    id        String      @id @default(cuid())
    name      String
    surname   String
    email     String      @unique
    password  String
    role      Role
    status    UserStatus  @default(PENDING)
    createdAt DateTime    @default(now())
    updatedAt DateTime    @updatedAt
    ...
  }
  ```
* [ ] **Add Announcement model**

  ```prisma
  model Announcement {
    id            String               @id @default(cuid())
    title         String
    content       String
    audience      AnnouncementAudience
    priority      NotificationPriority @default(MEDIUM)
    isActive      Boolean              @default(true)
    createdBy     String
    creator       User                 @relation(fields: [createdBy], references: [id])
    createdAt     DateTime             @default(now())
    expiresAt     DateTime?
    notifications Notification[]
  }
  ```
* [ ] Run migration

  ```bash
  npx prisma migrate dev --name add_admin_features
  ```

---

## 💼 ACCOUNT MANAGEMENT TASKS

| Step | File                                 | Description                                                                                                                              | Status |
| ---- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1    | `src/services/authService.js`        | Set default user `status = 'PENDING'` upon registration.                                                                                 | [ ]    |
| 2    | `src/services/userService.js`        | Implement functions:<br>• `listPendingUsers()`<br>• `updateUserStatus()`<br>• `suspendUser()`<br>• `activateUser()`                      | [ ]    |
| 3    | `src/controllers/adminController.js` | Add routes for approve/reject/suspend/reactivate users and dashboard stats.                                                              | [ ]    |
| 4    | `src/routes/admin.js`                | Add endpoints:<br>`/users/pending`, `/users/:id/approve`, `/users/:id/reject`, `/users/:id/suspend`, `/users/:id/activate`, `/dashboard` | [ ]    |
| 5    | `src/validators/adminValidator.js`   | Joi schema validation for `status` field changes.                                                                                        | [ ]    |

**Expected Output:**
✅ Admin can view, approve, reject, suspend, or reactivate users via REST API.
✅ Database reflects correct `UserStatus` transitions.

---

## 📰 ANNOUNCEMENT SYSTEM TASKS

| Step | File                                        | Description                                                                                              | Status |
| ---- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------ |
| 1    | `src/services/announcementService.js`       | CRUD operations for announcements (create, getAll, update, delete) with audience filtering.              | [ ]    |
| 2    | `src/controllers/announcementController.js` | Connects service functions to API endpoints.                                                             | [ ]    |
| 3    | `src/routes/admin.js`                       | Add endpoints:<br>`/announcements` (POST, GET)<br>`/announcements/:id` (PATCH, DELETE)                   | [ ]    |
| 4    | `src/validators/adminValidator.js`          | Joi schema for validating announcement fields (`title`, `content`, `audience`, `priority`, `expiresAt`). | [ ]    |

**Expected Output:**
✅ Admin can post announcements to **specific user roles or everyone**.
✅ Each announcement includes `priority`, `isActive`, and optional `expiresAt`.
✅ Filtered results show only relevant announcements per user role.

---

## 📊 DASHBOARD TASKS

| Step | File                                 | Description                                                                          | Status |
| ---- | ------------------------------------ | ------------------------------------------------------------------------------------ | ------ |
| 1    | `src/controllers/adminController.js` | Add `getDashboardStats()` endpoint.                                                  | [ ]    |
| 2    | `src/services/userService.js`        | Add helper queries for aggregate counts (total users, pending users, jobs, reports). | [ ]    |

**Expected Output:**
✅ Admin dashboard API returns system statistics in JSON format:

```json
{
  "success": true,
  "data": {
    "totalUsers": 128,
    "pendingUsers": 5,
    "activeJobs": 32,
    "reports": 3
  }
}
```

---

## 🧩 INTEGRATION TASKS

| Step | File                          | Description                                                                                                             | Status |
| ---- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| 1    | `src/app.js`                  | Mount new route: `app.use('/api/admin', require('./routes/admin'))`                                                     | [ ]    |
| 2    | `/tests/routes/admin.test.js` | Write integration tests for:<br>• User status transitions<br>• Audience-filtered announcements<br>• Dashboard endpoint. | [ ]    |
| 3    | Run lint & tests              | Ensure JS Standard Style + passing Jest tests.                                                                          | [ ]    |

**Expected Output:**
✅ All tests green, no lint errors, all new routes authenticated with `role('ADMIN')`.

---

## ✅ FINAL DELIVERABLES CHECKLIST

* [ ] Prisma schema updated and migrated
* [ ] `/api/admin` endpoints working (user management, announcements, dashboard)
* [ ] Announcement audience targeting implemented
* [ ] Controllers, services, routes documented with JSDoc
* [ ] Code passes linting (JavaScript Standard Style)
* [ ] Integration tests pass successfully

---

**Estimated File Impact:**

* 8 files changed / 4 new files created
* ~400 lines of new code (services, controllers, routes, validators)

---

🧠 *Reminder:*
All coding must follow:

1. **JavaScript Standard Style** – no semicolons, 2-space indent.
2. **JSDoc** – for all public functions/modules.
3. **“Why”, not “what”** comments only.
4. Use centralized error handling via `errorHandler.js`.
5. Protect all endpoints using `authMiddleware` + `roleMiddleware('ADMIN')`.

---

✅ **Done Definition**

> The Admin Feature is considered *done* when all new endpoints function correctly, follow the required coding standards, pass all tests, and integrate seamlessly with existing authentication and job moderation systems.

```
