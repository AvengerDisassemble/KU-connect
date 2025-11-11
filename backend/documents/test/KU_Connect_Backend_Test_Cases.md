# KU Connect Backend Test Cases

---

## Document Information

| Field | Details |
|-------|---------|
| **Document Version** | 2.0 |
| **Prepared by** | Backend QA Team – AvengerDisassemble |
| **Date** | November 10, 2025 |
| **Status** | Enhanced - Critical & High Priority Additions |
| **Total Test Cases** | 67 |
| **Critical Tests** | 1 |
| **High Priority** | 45 |
| **Medium Priority** | 19 |
| **Low Priority** | 2 |

---

## Table of Contents

1. [Authentication & Registration](#authentication--registration)
2. [Profile Management](#profile-management)
3. [Job Browsing & Applications](#job-browsing--applications)
4. [Job Posting Management](#job-posting-management)
5. [Notifications & Reporting](#notifications--reporting)
6. [Admin Management](#admin-management)
7. [Professor Analytics](#professor-analytics)
8. [Database Testing](#database-testing)
9. [Security Testing](#security-testing)
10. [Performance Testing](#performance-testing)
11. [Edge Cases & Boundary Conditions](#edge-cases--boundary-conditions)
12. [FR/NFR Mapping Table](#frnfr-mapping-table)
13. [Test Coverage Summary](#test-coverage-summary)

---

## Authentication & Registration

---

#### AUTH-TC-001: Student/Alumni Registration via KU Gmail

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-1.1, FR-1.2, FR-1.3, FR-1.4 |
| **Description** | Verify student/alumni registration using KU Gmail via Google OAuth creates an unverified account with required fields. |
| **Precondition** | Google OAuth configured; email not yet registered. |

**Test Steps:**
1. Register as STUDENT with `student@ku.th` via OAuth.
2. Approve consent and submit form.
3. Validate new record in database.

**Expected Result:**
- HTTP Status: `201 Created`
- User role correctly assigned
- Account verification status: `isVerified = false`
- Test data: `ske.student01@ku.th`

---

#### AUTH-TC-002: Alumni Registration Requires Transcript

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | FR-1.3 |
| **Description** | Verify alumni accounts require transcript validation before registration approval. |
| **Precondition** | OAuth configured; alumni email domain recognized. |

**Test Steps:**
1. Register as ALUMNI without uploading transcript.
2. Register again with valid transcript file.

**Expected Result:**
- Without transcript: `400 Bad Request` with error message
- With transcript: `201 Created`, status `PENDING_VERIFICATION`

---

#### AUTH-TC-003: Employer Registration with Company Email

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-1.5–FR-1.7 |
| **Description** | Verify employer registration and company document upload validation. |
| **Precondition** | Employer domain configured and allowed (`@company.com`). |

**Test Steps:**
1. Initiate OAuth login with `hr@company.com`.
2. Fill company information form.
3. Upload company registration documents.
4. Submit registration.

**Expected Result:**
- HTTP Status: `201 Created`
- Employer account status: `PENDING_VERIFICATION`
- Documents securely stored and linked to account

---

#### AUTH-TC-004: Secure Login (All Roles)

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-1.8, NFR-1.1 |
| **Description** | Verify secure login process generates valid JWT tokens with proper role assignment. |

**Test Steps:**
1. POST request to `/api/auth/login` with valid credentials.
2. Examine JWT token payload.
3. Validate token signature.

**Expected Result:**
- HTTP Status: `200 OK`
- JWT contains valid role and expiration time
- No sensitive data (password) in token payload

---

#### AUTH-TC-005: Unverified or Suspended Login Blocked

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | FR-1.4, FR-6.3 |
| **Description** | Verify unverified and suspended accounts cannot log in. |

**Test Steps:**
1. Attempt login with unverified account credentials.
2. Attempt login with suspended account credentials.

**Expected Result:**
- HTTP Status: `403 Forbidden`
- Clear error message provided to user
- No token issued

---

#### AUTH-TC-006: Invalid Token Access

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | NFR-1.1 |
| **Description** | Verify protected routes reject invalid or missing authentication tokens. |

**Test Steps:**
1. Access protected route without authentication token.
2. Access protected route with malformed token.
3. Access protected route with invalid token.

**Expected Result:**
- HTTP Status: `401 Unauthorized`
- Error message specifies missing/invalid token

---

#### AUTH-TC-007: OAuth Account Linking

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-1.1 |
| **Description** | Verify Google account linking to existing email-based user accounts. |
| **Precondition** | User already exists with password-based authentication. |

**Test Steps:**
1. Create user with `student@ku.th` via traditional password registration.
2. Login with same email via Google OAuth.

**Expected Result:**
- HTTP Status: `200 OK`
- OAuth account linked to existing user record
- No duplicate user created
- Account credentials merged seamlessly

---

#### AUTH-TC-008: Prevent Password Login for OAuth-Only Users

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | FR-1.8, NFR-1.1 |
| **Description** | Verify OAuth-only users cannot log in using password authentication. |

**Test Steps:**
1. Register account via Google OAuth (no password set).
2. Attempt POST request to `/api/auth/login` with email and arbitrary password.

**Expected Result:**
- HTTP Status: `400 Bad Request`
- Error message: "This account uses Google Sign-In only"
- No token issued

---

#### AUTH-TC-009: Refresh Token Mechanism

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | NFR-1.1 |
| **Description** | Verify refresh token flow enables session persistence without re-authentication. |

**Test Steps:**
1. Complete login process and receive access + refresh tokens.
2. Wait for access token expiration time.
3. Send POST request to `/api/auth/refresh` with refresh token.

**Expected Result:**
- HTTP Status: `200 OK`
- New valid access token issued
- Refresh token remains valid for subsequent refreshes
- User session maintained seamlessly

---

#### AUTH-TC-010: Refresh Token Invalidation on Logout

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | NFR-1.1 |
| **Description** | Verify refresh tokens become invalid after user logout. |

**Test Steps:**
1. Complete login and obtain refresh token.
2. Send POST request to `/api/auth/logout`.
3. Attempt to use old refresh token.

**Expected Result:**
- Logout: HTTP Status `200 OK`, token invalidated
- Refresh attempt: HTTP Status `401 Unauthorized`
- User must re-authenticate to obtain new tokens

---

## Profile Management

---

#### PROFILE-TC-001: Student Profile CRUD Operations

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-2.1 |
| **Description** | Verify complete profile lifecycle: create, read, update, delete. |

**Test Steps:**
1. POST request to `/api/profiles` with valid student profile data.
2. Verify profile creation response.
3. PUT request to `/api/profiles/:id` to modify profile information.
4. Verify updates persist in database.

**Expected Result:**
- Create: HTTP Status `201 Created`, profile record stored
- Update: HTTP Status `200 OK`, changes reflected in database

---

#### PROFILE-TC-002: Student Document Upload Constraints

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive/Negative |
| **Requirements** | FR-2.2, FR-2.3, NFR-7.1 |
| **Description** | Verify document upload validation (file type, size restrictions). |

**Test Steps:**
1. Upload valid PDF document (< 5MB).
2. Upload executable file (`.exe`).
3. Upload oversized file (> 5MB).
4. Verify file validation rules.

**Expected Result:**
- Valid PDF upload: HTTP Status `200 OK`
- Invalid file types/sizes: HTTP Status `400 Bad Request` with descriptive error

---

#### PROFILE-TC-003: Employer Company Profile

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Positive |
| **Requirements** | FR-2.4 |
| **Description** | Verify employer company profile creation and management. |

**Test Steps:**
1. POST request to `/api/employer/profile` with company information.
2. Verify company data storage.

**Expected Result:**
- HTTP Status: `201 Created`
- Company data persists in database

---

#### PROFILE-TC-004: Replace Existing Documents

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-2.2, FR-2.3 |
| **Description** | Verify users can update and replace previously uploaded documents. |

**Test Steps:**
1. Upload initial resume file (resume_v1.pdf).
2. Upload replacement resume file (resume_v2.pdf).
3. Verify document access.

**Expected Result:**
- HTTP Status: `200 OK`
- Old resume replaced; version history managed
- Only latest version accessible via standard queries

---

#### PROFILE-TC-005: Document Download Access Control

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Security |
| **Requirements** | NFR-1.2 |
| **Description** | Verify document access restrictions based on user role and permissions. |

**Test Steps:**
1. Student A uploads transcript document.
2. Student B attempts to download Student A's transcript.
3. HR representative attempts to download (after job application).

**Expected Result:**
- Student B: HTTP Status `403 Forbidden`
- HR (authorized): HTTP Status `200 OK`

---

#### PROFILE-TC-006: Malicious File Content Detection

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | NFR-1.2 |
| **Description** | Verify system protects against malware and suspicious file content. |

**Test Steps:**
1. Upload PDF with embedded JavaScript code.
2. Upload file with deceptive extension (resume.pdf.exe).
3. Verify file scanning results.

**Expected Result:**
- HTTP Status: `400 Bad Request`
- File rejected with security warning message

---

## Job Browsing & Applications

---

#### JOB-TC-001: Browse & Filter Jobs

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-3.1 |
| **Description** | Verify job search functionality with various filter options. |

**Test Steps:**
1. GET request to `/api/jobs` without filters.
2. GET request to `/api/jobs` with filter parameters (category, salary, location).
3. Verify filtered results accuracy.

**Expected Result:**
- HTTP Status: `200 OK`
- Results paginated and accurate
- Filters applied correctly

---

#### JOB-TC-002: View Job Details

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-3.2 |
| **Description** | Verify complete job posting information retrieval. |

**Test Steps:**
1. GET request to `/api/jobs/:id` with valid job ID.
2. Verify all job details present.
3. Verify employer information included.

**Expected Result:**
- HTTP Status: `200 OK`
- Complete job details returned with employer contact information

---

#### APP-TC-001: Apply to Job (One-Click & Manual)

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-3.3, FR-3.4 |
| **Description** | Verify job application submission with existing or uploaded documents. |
| **Precondition** | Student logged in; profile is complete with documents. |

**Test Steps:**
1. Apply using existing resume from profile.
2. Apply using manual document upload.
3. Alumni applies (transcript auto-attached).
4. Verify application submission.

**Expected Result:**
- HTTP Status: `201 Created`
- Application record created with correct documents
- Confirmation notification sent

---

#### APP-TC-002: Save & View Saved Jobs

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Positive |
| **Requirements** | FR-3.5 |
| **Description** | Verify bookmark/save job functionality for later review. |

**Test Steps:**
1. POST request to `/api/saved-jobs` with job ID.
2. GET request to `/api/saved-jobs` to retrieve saved list.
3. Verify saved job appears once (no duplicates).

**Expected Result:**
- HTTP Status: `201 Created` for save operation
- Saved job visible in user's saved jobs list

---

#### APP-TC-003: Track Application Status

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Positive |
| **Requirements** | FR-3.6 |
| **Description** | Verify students can track all submitted applications. |

**Test Steps:**
1. Submit multiple job applications.
2. GET request to `/api/applications/student/me`.
3. Verify all applications listed with current status.

**Expected Result:**
- HTTP Status: `200 OK`
- All applications displayed with accurate status values

---

#### APP-TC-004: Withdraw Application

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Positive |
| **Requirements** | FR-3.7 |
| **Description** | Verify students can withdraw pending applications. |

**Test Steps:**
1. Submit job application (status: PENDING).
2. DELETE request to `/api/applications/:id`.
3. Verify withdrawal success.

**Expected Result:**
- HTTP Status: `200 OK`
- Application record marked as withdrawn

---

#### APP-TC-005: Employer Access to Applications

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Access Control |
| **Requirements** | FR-3.8–FR-3.10, NFR-1.2 |
| **Description** | Verify access control for employer job applications. |

**Test Steps:**
1. Employer A retrieves applications for their own job posting.
2. Employer B attempts to access Employer A's applications.
3. Employer updates application status.

**Expected Result:**
- Employer A: Authorized access granted
- Employer B: HTTP Status `403 Forbidden`
- Status updates: Only job owner authorized

---

#### APP-TC-006: Application Status Lifecycle

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Workflow |
| **Requirements** | FR-3.6, FR-3.9 |
| **Description** | Verify all valid status transitions and prevent invalid transitions. |

**Test Steps:**
1. Create application (initial status: PENDING).
2. HR updates application to REVIEWING.
3. HR updates to INTERVIEWED.
4. HR updates to ACCEPTED or REJECTED.
5. Attempt invalid transition: ACCEPTED → REJECTED.

**Expected Result:**
- Valid transitions: HTTP Status `200 OK`
- Invalid transitions: HTTP Status `400 Bad Request`

---

#### APP-TC-007: Application Deadline Enforcement

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | FR-4.3 |
| **Description** | Verify system rejects applications submitted after deadline. |

**Test Steps:**
1. Create job with deadline: November 10, 2025 at 23:59.
2. Attempt application on November 11, 2025 at 00:01.
3. Verify rejection.

**Expected Result:**
- HTTP Status: `400 Bad Request`
- Error message: "Application deadline has passed"

---

## Job Posting Management

---

#### JOBP-TC-001: Create Job Posting

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-4.1, FR-4.5 |
| **Description** | Verify employer can create new job postings. |

**Test Steps:**
1. POST request to `/api/jobs` with complete job data.
2. Verify job creation response.
3. Verify job linked to employer account.

**Expected Result:**
- HTTP Status: `201 Created`
- Job posting stored in database
- Properly linked to employer profile

---

#### JOBP-TC-002: Edit, Deadline, and Close Job

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-4.2–FR-4.5 |
| **Description** | Verify job posting lifecycle management (edit, set deadline, close). |

**Test Steps:**
1. PUT request to `/api/jobs/:id` with updated information.
2. PATCH request to `/api/jobs/:id/status` with status CLOSED.
3. Verify final status.

**Expected Result:**
- Edit: HTTP Status `200 OK`, changes persisted
- Close: HTTP Status `200 OK`, job marked closed

---

#### JOBP-TC-003: Job Template Availability

| Property | Value |
|----------|-------|
| **Priority** | 🟢 Low |
| **Type** | Positive |
| **Requirements** | FR-4.6 |
| **Description** | Verify standardized job posting template available. |

**Test Steps:**
1. Verify job schema/template availability.
2. Validate required and optional fields.

**Expected Result:**
- Standardized structure present and documented

---

## Notifications & Reporting

---

#### NOTIF-TC-001: Student Notifications & History

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-5.1, FR-5.5 |
| **Description** | Verify notification retrieval and read status tracking. |

**Test Steps:**
1. GET request to `/api/notifications`.
2. PATCH request to `/api/notifications/:id/read`.
3. Verify notification status updated.

**Expected Result:**
- HTTP Status: `200 OK` for both requests
- `isRead` field properly updated

---

#### NOTIF-TC-002: Employer Alert on Application

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-5.4 |
| **Description** | Verify employer receives notification when student applies. |

**Test Steps:**
1. Student submits job application.
2. Employer checks notification list.
3. Verify notification created and delivered.

**Expected Result:**
- HTTP Status: `200 OK`
- Employer notification contains applicant details

---

#### NOTIF-TC-003: Email Confirmation on Application

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Positive |
| **Requirements** | FR-5.3, NFR-4.1, NFR-2.4 |
| **Description** | Verify confirmation email sent after job application. |

**Test Steps:**
1. Submit job application.
2. Inspect outbound email log.
3. Verify email delivery.

**Expected Result:**
- Email delivered within seconds
- Contains relevant application details

---

#### NOTIF-TC-004: Application Status Change Notification

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-5.1 |
| **Description** | Verify student receives notification when application status changes. |
| **Precondition** | Student has pending application. |

**Test Steps:**
1. HR updates application status to ACCEPTED.
2. GET request to `/api/notifications` for student.
3. Verify notification created.

**Expected Result:**
- HTTP Status: `200 OK`
- Notification with title: "Application Status Updated"

---

#### NOTIF-TC-005: Mark Notification as Read

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-5.5 |
| **Description** | Verify notification read status toggle functionality. |

**Test Steps:**
1. PATCH request to `/api/notifications/:id/read`.
2. Verify response contains updated `isRead` field.
3. Verify unread count decremented.

**Expected Result:**
- HTTP Status: `200 OK`
- `isRead` field changed to `true`
- Unread count updated

---

#### EMAIL-TC-001: Email Service Failure Handling

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | NFR-4.1 |
| **Description** | Verify application succeeds even if email service fails. |

**Test Steps:**
1. Simulate email service unavailability.
2. Student submits job application.
3. Verify application creation succeeds.

**Expected Result:**
- HTTP Status: `201 Created`
- Application recorded successfully
- Error logged (not shown to user)

---

#### REPORT-TC-001: Student Report Job

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-5.2 |
| **Description** | Verify inappropriate content reporting system. |

**Test Steps:**
1. POST request to `/api/reports` with job ID and reason.
2. Verify report creation.

**Expected Result:**
- HTTP Status: `201 Created`
- Report status: `PENDING`

---

## Admin Management

---

#### ADMIN-TC-001: View & Approve Pending Users

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-6.1, FR-6.2 |
| **Description** | Verify admin user verification workflow. |

**Test Steps:**
1. GET request to `/api/admin/pending-verifications`.
2. PATCH request to `/api/admin/verify-user/:id` to approve/reject.
3. Verify status update.

**Expected Result:**
- HTTP Status: `200 OK`
- User verification status updated

---

#### ADMIN-TC-002: Suspend & Reactivate Users

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-6.3 |
| **Description** | Verify admin can suspend/reactivate user accounts. |

**Test Steps:**
1. PATCH request to `/api/admin/users/:id/suspend`.
2. Attempt login with suspended user.
3. Verify access blocked.

**Expected Result:**
- HTTP Status: `200 OK` for suspension
- Suspended user cannot login

---

#### ADMIN-TC-003: Remove Inappropriate Content

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Positive |
| **Requirements** | FR-6.4 |
| **Description** | Verify admin content moderation capabilities. |

**Test Steps:**
1. DELETE request to `/api/admin/jobs/:id`.
2. Verify deletion.

**Expected Result:**
- HTTP Status: `200 OK`
- Content removed from system

---

#### ADMIN-TC-004: Announcement Management

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Positive |
| **Requirements** | FR-6.5 |
| **Description** | Verify admin announcement creation and display. |

**Test Steps:**
1. POST request to `/api/admin/announcements`.
2. GET request to `/api/admin/announcements`.

**Expected Result:**
- HTTP Status: `201 Created` for creation
- Announcement visible in listings

---

#### ADMIN-TC-005: Handle Reports

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-6.6 |
| **Description** | Verify report review and resolution workflow. |

**Test Steps:**
1. GET request to `/api/reports`.
2. PATCH request to report with status RESOLVED or DISMISSED.
3. Verify authorization.

**Expected Result:**
- HTTP Status: `200 OK`
- Status updated; only admin authorized

---

#### ADMIN-TC-006: Dashboard Statistics

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Positive |
| **Requirements** | FR-6.7 |
| **Description** | Verify admin dashboard metrics retrieval. |

**Test Steps:**
1. GET request to `/api/admin/dashboard/stats`.
2. Verify metrics returned.

**Expected Result:**
- HTTP Status: `200 OK`
- System metrics and statistics displayed

---

#### ADMIN-TC-007: Bulk User Actions

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-6.2 |
| **Description** | Verify admin can perform bulk user approval/rejection. |

**Test Steps:**
1. Select 10 pending users.
2. POST request to `/api/admin/users/bulk-approve` with user IDs.
3. Verify all users verified.

**Expected Result:**
- HTTP Status: `200 OK`
- All 10 users verified
- Notification emails sent

---

## Professor Analytics

---

#### PROF-TC-001: Career Progress Dashboard

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-7.1 |
| **Description** | Verify employment statistics and career progress analytics display. |

**Test Steps:**
1. GET request to `/api/analytics/career-progress`.
2. Verify data aggregation and calculation.

**Expected Result:**
- HTTP Status: `200 OK`
- Employment statistics displayed accurately

---

#### PROF-TC-002: Industry Trends

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Positive |
| **Requirements** | FR-7.2 |
| **Description** | Verify industry employment distribution analysis. |

**Test Steps:**
1. GET request to `/api/analytics/industry-trends`.
2. Verify industry ranking accuracy.

**Expected Result:**
- HTTP Status: `200 OK`
- Industry rankings returned in descending order

---

#### PROF-TC-003: Skills Demand Analysis

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Positive |
| **Requirements** | FR-7.3 |
| **Description** | Verify skills demand metrics calculation. |

**Test Steps:**
1. GET request to `/api/analytics/skills-analysis`.
2. Verify skill frequency counts.

**Expected Result:**
- HTTP Status: `200 OK`
- Returns skill demand metrics and rankings

---

#### PROF-TC-004: Access Control

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | NFR-1.2 |
| **Description** | Verify only professors can access analytics endpoints. |

**Test Steps:**
1. Non-professor attempts access to analytics endpoints.
2. Professor attempts access to analytics endpoints.

**Expected Result:**
- Non-professor: HTTP Status `403 Forbidden`
- Professor: HTTP Status `200 OK`

---

#### PROF-TC-005: Career Progress Filter by Degree

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-7.1 |
| **Description** | Verify analytics filtering by degree type. |

**Test Steps:**
1. GET request to `/api/analytics/career-progress?degreeType=BACHELOR`.
2. Verify filtered statistics.

**Expected Result:**
- HTTP Status: `200 OK`
- Statistics filtered to Bachelor's graduates only

---

#### PROF-TC-006: Industry Distribution Analysis

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-7.2 |
| **Description** | Verify industry distribution returns ranked percentage breakdown. |

**Test Steps:**
1. GET request to `/api/analytics/industry-trends`.
2. Verify ranked list format.

**Expected Result:**
- HTTP Status: `200 OK`
- Returns ranked list (e.g., IT_SOFTWARE: 45%, FINANCE: 20%)

---

#### PROF-TC-007: In-Demand Skills Ranking

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Positive |
| **Requirements** | FR-7.3 |
| **Description** | Verify skill demand analysis returns ranked skills by frequency. |

**Test Steps:**
1. GET request to `/api/analytics/skills-analysis`.
2. Verify ranking accuracy.

**Expected Result:**
- HTTP Status: `200 OK`
- Returns ranked skills (e.g., JavaScript: 85 postings, Python: 72 postings)

---

## Database Testing

---

#### DB-TC-001: Schema & Constraints

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Structural |
| **Requirements** | NFR-7.1, NFR-7.2 |
| **Description** | Verify database schema integrity and constraint enforcement. |

**Test Steps:**
1. Validate primary key constraints.
2. Validate foreign key relationships.
3. Validate unique constraints.

**Expected Result:**
- All constraints properly enforced
- Schema integrity validated

---

#### DB-TC-002: Transaction Integrity on Application

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Reliability |
| **Requirements** | NFR-4.3, NFR-7.2 |
| **Description** | Verify transaction rollback on failure (ACID compliance). |

**Test Steps:**
1. Simulate mid-transaction failure during application submission.
2. Verify rollback occurs.

**Expected Result:**
- No partial records created
- Complete transaction rollback on failure

---

## Security Testing

---

#### SEC-TC-001: SQL Injection Protection

| Property | Value |
|----------|-------|
| **Priority** | 🔴 Critical |
| **Type** | Negative |
| **Requirements** | NFR-1.2, NFR-7.2 |
| **Description** | Verify SQL injection attack prevention. |

**Test Steps:**
1. Attempt SQL injection payload: `' OR '1'='1`.
2. Verify injection prevented.

**Expected Result:**
- No SQL injection execution
- No data leakage

---

#### SEC-TC-002: XSS & HTML Injection

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | NFR-1.2 |
| **Description** | Verify Cross-Site Scripting protection. |

**Test Steps:**
1. Submit `<script>alert(1)</script>` to profile field.
2. Verify output escaping.

**Expected Result:**
- Script escaped and not executed
- Safe rendering confirmed

---

#### SEC-TC-003: JWT Validation & Expiry

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | NFR-1.1 |
| **Description** | Verify JWT validation and expiration handling. |

**Test Steps:**
1. Use expired JWT token.
2. Use forged JWT token.

**Expected Result:**
- HTTP Status: `401 Unauthorized`

---

#### SEC-TC-004: Role-Based Access Control

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | NFR-1.2 |
| **Description** | Verify role-based authorization enforcement. |

**Test Steps:**
1. Student attempts access to admin endpoint.
2. Verify access denied.

**Expected Result:**
- HTTP Status: `403 Forbidden`

---

#### SEC-TC-005: Sensitive Data Handling

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Audit |
| **Requirements** | NFR-7.1 |
| **Description** | Verify no plaintext PII or passwords stored. |

**Test Steps:**
1. Review database contents.
2. Review application logs.

**Expected Result:**
- No plaintext passwords or PII
- All sensitive data properly encrypted/hashed

---

#### SEC-TC-006: CSRF Protection

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | NFR-1.2 |
| **Description** | Verify Cross-Site Request Forgery protection. |

**Test Steps:**
1. Craft malicious POST request from external site.
2. Attempt to create job posting without CSRF token (if implemented).

**Expected Result:**
- HTTP Status: `403 Forbidden`
- Request blocked

---

#### SEC-TC-007: Insecure Direct Object Reference (IDOR)

| Property | Value |
|----------|-------|
| **Priority** | 🔴 CRITICAL |
| **Type** | Negative |
| **Requirements** | NFR-1.2 |
| **Description** | **CRITICAL:** Verify users cannot access other users' data via ID manipulation. |

**Test Steps:**
1. Student A retrieves own profile: `/api/profile/user-123`.
2. Student A attempts to access: `/api/profile/user-456` (Student B's ID).

**Expected Result:**
- HTTP Status: `403 Forbidden` or `404 Not Found`
- User data properly isolated

---

#### SEC-TC-008: API Rate Limiting

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Security |
| **Requirements** | NFR-1.3 |
| **Description** | Verify rate limiting prevents brute force and DoS attacks. |

**Test Steps:**
1. Make 100 requests to `/api/login` within 10 seconds.
2. Monitor response after threshold.

**Expected Result:**
- After threshold (e.g., 10 requests): HTTP Status `429 Too Many Requests`

---

#### SEC-TC-009: Path Traversal Attack Prevention

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Negative |
| **Requirements** | NFR-1.2 |
| **Description** | Verify directory traversal attack prevention on file downloads. |

**Test Steps:**
1. GET request to `/api/documents/resume/../../../etc/passwd`.
2. Verify path sanitization.

**Expected Result:**
- HTTP Status: `400 Bad Request`
- Path sanitized; unauthorized file access prevented

---

## Performance Testing

---

#### PERF-TC-001: Response Time Under Normal Load

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Load Test |
| **Requirements** | NFR-2.1 |
| **Description** | Verify acceptable response times under normal user load. |

**Test Steps:**
1. Simulate 20 concurrent users.
2. Monitor response time distribution.
3. Measure 95th percentile response time.

**Expected Result:**
- 95% of requests complete within 3 seconds
- System remains stable

---

#### PERF-TC-002: Concurrent Users Load Test

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Load/Stress Test |
| **Requirements** | NFR-2.2, NFR-2.5 |
| **Description** | Verify system stability under heavy concurrent load. |

**Test Steps:**
1. Simulate 100 concurrent users.
2. Monitor system metrics.
3. Verify no service degradation.

**Expected Result:**
- System remains stable and responsive
- No connection timeouts

---

#### PERF-TC-003: Notification Delivery Latency

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Performance |
| **Requirements** | NFR-2.4, FR-5.3, FR-5.4 |
| **Description** | Verify notification and email delivery speed. |

**Test Steps:**
1. Trigger notification event.
2. Measure delay for email delivery.
3. Measure in-app notification display.

**Expected Result:**
- Email delivered within SLA (typically 5-30 seconds)
- In-app notification immediate

---

#### PERF-TC-004: Query Efficiency

| Property | Value |
|----------|-------|
| **Priority** | 🟡 Medium |
| **Type** | Performance |
| **Requirements** | NFR-7.2 |
| **Description** | Verify filtered queries perform efficiently on large datasets. |

**Test Steps:**
1. Create 10,000+ job records.
2. Execute filtered `/api/jobs` query with multiple filters.
3. Measure query execution time.

**Expected Result:**
- Query execution: < 1 second average

---

#### PERF-TC-005: Database Connection Pool

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Load Test |
| **Requirements** | NFR-2.2 |
| **Description** | Verify connection pool handles high concurrency effectively. |

**Test Steps:**
1. Simulate 200 concurrent database queries.
2. Monitor connection pool status.
3. Verify no connection exhaustion.

**Expected Result:**
- No connection errors
- All queries complete successfully

---

#### PERF-TC-006: Search Query Performance

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Performance |
| **Requirements** | NFR-2.1 |
| **Description** | Verify complex search queries execute within acceptable timeframe. |

**Test Steps:**
1. Execute complex search: `keyword=developer&location=Bangkok&jobType=full-time&minSalary=40000`.
2. Measure response time.

**Expected Result:**
- Response time < 1.5 seconds

---

## Edge Cases & Boundary Conditions

---

#### EDGE-TC-001: Concurrent Job Application

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Race Condition |
| **Requirements** | NFR-4.3 |
| **Description** | Verify system handles simultaneous applications when slots limited. |

**Test Steps:**
1. Configure job with 1 remaining opening.
2. Two students apply simultaneously.
3. Verify atomic transaction handling.

**Expected Result:**
- First application: HTTP Status `201 Created`
- Second application: HTTP Status `400 Bad Request` with "Job full" message
- No over-booking occurs

---

#### EDGE-TC-002: Duplicate Simultaneous Requests

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Race Condition |
| **Requirements** | NFR-4.3 |
| **Description** | Verify duplicate prevention for concurrent identical requests. |

**Test Steps:**
1. Submit application twice within 100ms window.
2. Monitor for duplicate creation.

**Expected Result:**
- First request: HTTP Status `201 Created`
- Second request: HTTP Status `400 Bad Request` with "Already applied" message

---

#### EDGE-TC-003: Special Characters in User Input

| Property | Value |
|----------|-------|
| **Priority** | 🔴 High |
| **Type** | Edge Case |
| **Requirements** | NFR-1.2 |
| **Description** | Verify system safely handles special and reserved characters. |

**Test Steps:**
1. Register with name: `O'Brien <script>alert(1)</script>`.
2. Submit application with special characters: `@#$%^&*()`.
3. Verify sanitization and safe storage.

**Expected Result:**
- Special characters properly escaped/sanitized
- XSS prevention confirmed
- Data integrity maintained

---

## FR/NFR Mapping Table

| ID | Requirement Summary | Associated Test Cases |
|----|--------------------|----------------------|
| **FR-1.1** | Student registration via OAuth | AUTH-TC-001, AUTH-TC-007 |
| **FR-1.2** | Employer registration flow | AUTH-TC-003 |
| **FR-1.3** | Alumni registration with transcript | AUTH-TC-002 |
| **FR-1.4** | Account verification system | AUTH-TC-005 |
| **FR-1.5–1.7** | Employer setup and verification | AUTH-TC-003, ADMIN-TC-001 |
| **FR-1.8** | Secure login and token generation | AUTH-TC-004, AUTH-TC-008 |
| **FR-2.1–2.4** | Profile CRUD and document management | PROFILE-TC-001–006 |
| **FR-3.1–3.10** | Job browsing, filtering, applications | JOB-TC-001–002, APP-TC-001–007 |
| **FR-4.1–4.6** | Employer job posting lifecycle | JOBP-TC-001–003 |
| **FR-5.1–5.6** | Notifications, reporting, emails | NOTIF-TC-001–005, EMAIL-TC-001, REPORT-TC-001 |
| **FR-6.1–6.7** | Admin user and content management | ADMIN-TC-001–007 |
| **FR-7.1–7.3** | Professor analytics dashboards | PROF-TC-001–007 |
| **NFR-1.1–1.2** | Security, authentication, access control | AUTH-TC-004–010, SEC-TC-001–009, EDGE-TC-003 |
| **NFR-1.3** | API rate limiting | SEC-TC-008 |
| **NFR-2.1–2.5** | Performance, scalability, load handling | PERF-TC-001–006 |
| **NFR-4.1–4.3** | Reliability, transactions, fault tolerance | NOTIF-TC-003, EMAIL-TC-001, DB-TC-002, EDGE-TC-001–002 |
| **NFR-7.1–7.3** | Database integrity and constraints | PROFILE-TC-002, DB-TC-001–002, SEC-TC-005 |

---

## Test Coverage Summary

---

### Executive Summary

This document specifies **67 comprehensive test cases** covering all functional and non-functional requirements for the KU Connect platform. The test suite ensures robust authentication, secure data handling, reliable performance, and complete feature functionality.

### Test Case Distribution

| Category | Count | Priority Breakdown |
|----------|-------|-------------------|
| **Authentication & Registration** | 10 | 10 High |
| **Profile Management** | 6 | 6 High |
| **Job Browsing & Applications** | 7 | 7 High |
| **Job Posting Management** | 3 | 2 High, 1 Low |
| **Notifications & Reporting** | 7 | 5 High, 2 Medium |
| **Admin Management** | 7 | 4 High, 3 Medium |
| **Professor Analytics** | 7 | 5 High, 2 Medium |
| **Database Testing** | 2 | 2 High |
| **Security Testing** | 9 | 1 Critical, 8 High |
| **Performance Testing** | 6 | 4 High, 2 Medium |
| **Edge Cases & Boundary** | 3 | 3 High |
| **TOTAL** | **67** | **1 Critical, 45 High, 19 Medium, 2 Low** |

### Coverage Improvements

**New Test Cases Added (Critical & High Priority):**

| Section | Previous | Current | Improvement |
|---------|----------|---------|-------------|
| Authentication & Security | 6 | 10 | +67% |
| Profile Management | 3 | 6 | +100% |
| Job Applications | 5 | 7 | +40% |
| Notifications | 3 | 5 | +67% |
| Admin Features | 6 | 7 | +17% |
| Professor Analytics | 4 | 7 | +75% |
| Security Testing | 5 | 9 | +80% |
| Performance Testing | 4 | 6 | +50% |
| Edge Cases | 0 | 3 | **New Section** |
| **Total** | **42** | **67** | **+60%** |

### Critical Test Case

**SEC-TC-007: Insecure Direct Object Reference (IDOR)** - Marked as CRITICAL priority due to high security risk. This test prevents unauthorized access to other users' personal data.

### Execution Guidelines

**Recommended Test Execution Order:**
1. First: Security tests (SEC-TC-001 to SEC-TC-009)
2. Second: Authentication tests (AUTH-TC-001 to AUTH-TC-010)
3. Third: Core functional tests (Profile, Jobs, Applications)
4. Fourth: Performance and load tests
5. Finally: Edge cases and integration scenarios

**Test Environment Requirements:**
- Jest 30.2.0+ with Supertest
- PostgreSQL test database with cleanup fixtures
- Test user accounts with production-compatible JWT tokens
- Email service mock/stub for notification tests
- File upload sandbox directory for document tests

### Success Criteria

- ✅ All 67 test cases must pass
- ✅ Critical IDOR test (SEC-TC-007) must pass
- ✅ All security tests must pass (9/9)
- ✅ All authentication tests must pass (10/10)
- ✅ Code coverage minimum: 80% for services, 90% for critical paths
- ✅ Performance targets: 95% of requests < 3s, 100% < 5s

---

**Document Last Updated:** November 10, 2025  
**Version:** 2.0  
**Status:** Ready for Implementation & Execution

---
