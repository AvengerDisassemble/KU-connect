# KU Connect Frontend Test Cases

## Document Information

| | |
| :--- | :--- |
| **Document Version** | 1.0 |
| **Prepared by** | Frontend QA Team – KU Connect |
| **Date** | November 2025 |
| **Status** | Ready for Implementation & Execution |

---

## Table of Contents
* 1. Employer Frontend Test Cases
* 2. Student Frontend Test Cases
* 3. Professor Frontend Test Cases
* 4. Admin Frontend Test Cases

---

## Employer Frontend Test Cases

### EMP-TS-001-TC01: redirect unauthenticated from /employer (dashboard) to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-001
* **Test Case No.:** TC01
* **Description:** redirect unauthenticated from /employer (dashboard) to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Go to `/employer` without login | Redirected to `/login`; login form visible |

### EMP-TS-001-TC02: redirect unauthenticated from /employer/profile/:userId to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-001
* **Test Case No.:** TC02
* **Description:** redirect unauthenticated from /employer/profile/:userId to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Go to `/employer/profile/:id` without login | Redirect to `/login`; login form visible |

### EMP-TS-001-TC03: redirect unauthenticated from create job page to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-001
* **Test Case No.:** TC03
* **Description:** redirect unauthenticated from create job page to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Go to `/employer/job-postings/create` without login | Redirect to `/login`; login form visible |

### EMP-TS-001-TC04: redirect unauthenticated from edit job page to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-001
* **Test Case No.:** TC04
* **Description:** redirect unauthenticated from edit job page to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Go to `/employer/job-postings/:jobId/edit` without login | Redirect to `/login`; login form visible |

### EMP-TS-002-TC01: student login succeeds but not on employer profile
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-002
* **Test Case No.:** TC01
* **Description:** student login succeeds but not on employer profile
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as student | Student login OK but Employer UI not visible; URL not `/employer` |

### EMP-TS-002-TC02: student cannot access /employer dashboard
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-002
* **Test Case No.:** TC02
* **Description:** student cannot access /employer dashboard
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as student 2. Try to navigate to `/employer` | Access blocked; final URL not `/employer` |

### EMP-TS-002-TC03: student cannot access create job page
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-002
* **Test Case No.:** TC03
* **Description:** student cannot access create job page
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as student 2. Try to open `/employer/job-postings/create` | Access blocked; Employer UI not visible |

### EMP-TS-002-TC04: student cannot access edit job page
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-002
* **Test Case No.:** TC04
* **Description:** student cannot access edit job page
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as student 2. Try to open `/employer/job-postings/:jobId/edit` | Access blocked; Employer UI not visible |

### EMP-TS-003-TC01: register employer account (pending verification)
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** EMP-TS-003
* **Test Case No.:** TC01
* **Description:** register employer account (pending verification)
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Open Sign Up → Employer tab 2. Multi-step form: personal, company, contact → Submit | Success toast; redirected showing 'Awaiting verification' |

### EMP-TS-004-TC1: login with valid credentials
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-004
* **Test Case No.:** TC1
* **Description:** login with valid credentials
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Open home → Login 2. Fill valid employer credentials → Submit | Login succeeds; redirected to Company Profile |

### EMP-TS-004-TC2: login fails with invalid password
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-004
* **Test Case No.:** TC2
* **Description:** login fails with invalid password
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Open home → Login 2. Fill email + wrong password → Submit | 'Invalid credentials' shown; not redirected |

### EMP-TS-005-TC01: view pre-filled employer profile
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** EMP-TS-005
* **Test Case No.:** TC01
* **Description:** view pre-filled employer profile
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as employer 2. Go to Company Profile page 3. Inspect main fields | Profile pre-filled from mock API |

### EMP-TS-005-TC02: update employer profile and persist after reload
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** EMP-TS-005
* **Test Case No.:** TC02
* **Description:** update employer profile and persist after reload
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login & open profile 2. Edit fields 3. Save and reload | Fields persist after reload |

### EMP-TS-006-TC01: create job posting successfully
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-006
* **Test Case No.:** TC01
* **Description:** create job posting successfully
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login & open Create Job 2. Fill required fields 3. Post Job | POST /job OK; job appears |

### EMP-TS-007-TC02: salary validation toasts appear
* **Priority:** P0
* **Tag:** @negative
* **Scenario ID:** EMP-TS-007
* **Test Case No.:** TC02
* **Description:** salary validation toasts appear
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login & open Create Job 2. Fill Min > Max salary 3. Confirm | Toast 'Min Salary must be <= Max Salary' |

### EMP-TS-007-TC03: text length validation appears
* **Priority:** P0
* **Tag:** @negative
* **Scenario ID:** EMP-TS-007
* **Test Case No.:** TC03
* **Description:** text length validation appears
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login & open Create Job 2. Fill short title/description/location 3. Confirm | Validation toasts shown |

### EMP-TS-008-TC01: employer updates an existing job
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** EMP-TS-008
* **Test Case No.:** TC01
* **Description:** employer updates an existing job
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login & open dashboard 2. Edit job 3. Save | Job updated successfully |

### EMP-TS-008-TC02: employer deletes a job
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** EMP-TS-008
* **Test Case No.:** TC02
* **Description:** employer deletes a job
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login & open dashboard 2. Delete job | Job deleted; card removed |

### EMP-TS-009-TC01: approve applicant updates status
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-009
* **Test Case No.:** TC01
* **Description:** approve applicant updates status
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login & open Applicants Inbox 2. Approve applicant | 'Qualified' status shown |

### EMP-TS-009-TC02: reject applicant updates status
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** EMP-TS-009
* **Test Case No.:** TC02
* **Description:** reject applicant updates status
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login & open Applicants Inbox 2. Reject applicant | 'Rejected' status shown |

### EMP-TS-010-TC01: employer views notifications
* **Priority:** P2
* **Tag:** @regression
* **Scenario ID:** EMP-TS-010
* **Test Case No.:** TC01
* **Description:** employer views notifications
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login & open dashboard 2. Open notifications tray 3. Filter / mark read | Notifications visible and updated |

---

## Student Frontend Test Cases

### STU-TS-001-TC01: redirect unauthenticated from /student to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** STU-TS-001
* **Test Case No.:** TC01
* **Description:** redirect unauthenticated from /student to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Go to `/student` without login | Redirect to `/login`; login form visible |

### STU-TS-001-TC02: redirect unauthenticated from /student/profile/:id to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** STU-TS-001
* **Test Case No.:** TC02
* **Description:** redirect unauthenticated from /student/profile/:id to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Go to `/student/profile/:id` without login | Redirect to `/login`; login form visible |

### STU-TS-001-TC03: redirect unauthenticated from /student/browse-jobs to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** STU-TS-001
* **Test Case No.:** TC03
* **Description:** redirect unauthenticated from /student/browse-jobs to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Go to `/student/browse-jobs` without login | Redirect to `/login`; login form visible |

### STU-TS-002-TC01: employer cannot access student dashboard
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** STU-TS-002
* **Test Case No.:** TC01
* **Description:** employer cannot access student dashboard
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as employer 2. Go to `/student` | Redirect to `/403`; error page visible |

### STU-TS-003-TC01: alumni registration submits and lands on student home
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** STU-TS-003
* **Test Case No.:** TC01
* **Description:** alumni registration submits and lands on student home
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Open site → Register as Alumni 2. Fill registration form 3. Click Create Account | POST OK; welcome message visible; lands on student home |

### STU-TS-004-TC01: student logs in and reaches browse jobs
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** STU-TS-004
* **Test Case No.:** TC01
* **Description:** student logs in and reaches browse jobs
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Sign in 2. Fill credentials → Login | Login succeeds; lands on `/student/browse-jobs` |

### STU-TS-004-TC02: login fails with invalid password
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** STU-TS-004
* **Test Case No.:** TC02
* **Description:** login fails with invalid password
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Sign in 2. Fill valid email + wrong password → Login | Invalid credentials shown; no redirect |

### STU-TS-005-TC01: student updates profile information and uploads resume
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** STU-TS-005
* **Test Case No.:** TC01
* **Description:** student updates profile information and uploads resume
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login & open profile page 2. Edit fields → Save 3. Upload resume | Profile updated; values persist; resume replaced successfully |

### STU-TS-006-TC01: student filters, paginates, and applies to a job
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** STU-TS-006
* **Test Case No.:** TC01
* **Description:** student filters, paginates, and applies to a job
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as student 2. Search/filter jobs 3. Open job → Upload resume → Apply | Application submitted; success toast; button shows Applied |

### STU-TS-007-TC01: student sees dashboard statuses that match the API payload
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** STU-TS-007
* **Test Case No.:** TC01
* **Description:** student sees dashboard statuses that match the API payload
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as student 2. Go to My applications | Statuses match API payload |

### STU-TS-009-TC01: student reviews notification feed and filters unread items
* **Priority:** P2
* **Tag:** @regression
* **Scenario ID:** STU-TS-009
* **Test Case No.:** TC01
* **Description:** student reviews notification feed and filters unread items
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as student 2. Open notifications tray 3. Toggle unread / mark read | Notifications visible; unread filter works |

---

## Professor Frontend Test Cases

### PROF-TS-001-TC01: unauthenticated professor routes redirect to login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** PROF-TS-001
* **Test Case No.:** TC01
* **Description:** unauthenticated professor routes redirect to login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Clear session 2. Visit professor-only routes without login | Redirect to `/login`; Login hero text visible |

### PROF-TS-002-TC01: wrong role gets redirected away from professor pages
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** PROF-TS-002
* **Test Case No.:** TC01
* **Description:** wrong role gets redirected away from professor pages
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as employer (wrong role) 2. Visit professor routes (`/professor`, `/analytics`...) | Guard redirects to `/403`; error page shown; Professor UI hidden |

### PROF-TS-003-TC01: professor logs in and lands on dashboard
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** PROF-TS-003
* **Test Case No.:** TC01
* **Description:** professor logs in and lands on dashboard
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Open site → Sign in 2. Fill professor credentials → Login | Login accepted; redirected to `/professor`; Student Analytics visible |

### PROF-TS-003-TC02: login fails with invalid password
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** PROF-TS-003
* **Test Case No.:** TC02
* **Description:** login fails with invalid password
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Open sign-in 2. Fill email + wrong password → Login | Invalid credentials visible; no redirect |

### PROF-TS-004-TC01: professor sees dashboard stats and student list
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** PROF-TS-004
* **Test Case No.:** TC01
* **Description:** professor sees dashboard stats and student list
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as professor 2. Land on `/professor` 3. View KPI cards, search, and student rows | KPI cards visible; search visible; seeded student rows shown |

### PROF-TS-004-TC02: professor filters students and exports data
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** PROF-TS-004
* **Test Case No.:** TC02
* **Description:** professor filters students and exports data
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login → apply filters 2. Search to narrow list 3. Export filtered CSV | Filters narrow results; export triggers download |

### PROF-TS-005-TC01: professor reviews insights overview
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** PROF-TS-005
* **Test Case No.:** TC01
* **Description:** professor reviews insights overview
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as professor 2. Go to Insights view 3. Inspect KPI cards and charts | KPI cards and charts render; labels visible |

### PROF-TS-005-TC02: professor interacts with insight charts
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** PROF-TS-005
* **Test Case No.:** TC02
* **Description:** professor interacts with insight charts
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login and open Insights 2. Inspect charts 3. Hover/interact | Charts visible; tooltips appear |

---

## Admin

### ADM-TS-001-TC01: redirect unauthenticated from /admin (dashboard) to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** ADM-TS-001
* **Test Case No.:** TC01
* **Description:** redirect unauthenticated from /admin (dashboard) to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Visit `/admin` without login | Redirect to `/login`; login form visible |

### ADM-TS-001-TC02: redirect unauthenticated from /admin/users to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** ADM-TS-001
* **Test Case No.:** TC02
* **Description:** redirect unauthenticated from /admin/users to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Visit `/admin/users` without login | Redirect to `/login`; login form visible |

### ADM-TS-001-TC03: redirect unauthenticated from /admin/announcements to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** ADM-TS-001
* **Test Case No.:** TC03
* **Description:** redirect unauthenticated from /admin/announcements to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Visit `/admin/announcements` without login | Redirect to `/login`; login form visible |

### ADM-TS-001-TC04: redirect unauthenticated from /admin/reports to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** ADM-TS-001
* **Test Case No.:** TC04
* **Description:** redirect unauthenticated from /admin/reports to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Visit `/admin/reports` without login | Redirect to `/login`; login form visible |

### ADM-TS-001-TC05: redirect unauthenticated from /admin/browse-jobs to /login
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** ADM-TS-001
* **Test Case No.:** TC05
* **Description:** redirect unauthenticated from /admin/browse-jobs to /login
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Visit `/admin/browse-jobs` without login | Redirect to `/login`; login form visible |

### ADM-TS-002-TC01: employer login does not land on admin area
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** ADM-TS-002
* **Test Case No.:** TC01
* **Description:** employer login does not land on admin area
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as employer (non-admin) | Employer login OK but URL not `/admin`; Admin UI hidden |

### ADM-TS-002-TC02: employer cannot access admin routes
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** ADM-TS-002
* **Test Case No.:** TC02
* **Description:** employer cannot access admin routes
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as employer 2. Visit admin routes | Redirected to `/403` for admin routes; Admin UI hidden |

### ADM-TS-003-TC01: admin login lands on dashboard
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** ADM-TS-003
* **Test Case No.:** TC01
* **Description:** admin login lands on dashboard
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Sign in with admin credentials | Login accepted; redirected to `/admin`; dashboard visible |

### ADM-TS-003-TC02: admin login fails with invalid password
* **Priority:** P0
* **Tag:** @smoke
* **Scenario ID:** ADM-TS-003
* **Test Case No.:** TC02
* **Description:** admin login fails with invalid password
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Fill admin email + wrong password → Login | Invalid credentials shown; stays on login |

### ADM-TS-004-TC01: create announcements and filter by audience/status
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** ADM-TS-004
* **Test Case No.:** TC01
* **Description:** create announcements and filter by audience/status
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as admin 2. Go to Announcement Management 3. Create announcements 4. Use filters | Announcements created; filters work correctly |

### ADM-TS-004-TC02: approve and reject employer verification requests
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** ADM-TS-004
* **Test Case No.:** TC02
* **Description:** approve and reject employer verification requests
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as admin 2. Go to User Management 3. Preview verification 4. Approve & Reject | Statuses updated; toast messages shown |

### ADM-TS-006-TC01: resolve report without deleting job
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** ADM-TS-006
* **Test Case No.:** TC01
* **Description:** resolve report without deleting job
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as admin 2. Open Report Management 3. Open report 4. Mark as Resolved | Report resolved; row removed; others remain |

### ADM-TS-006-TC02: delete job and resolve report
* **Priority:** P1
* **Tag:** @regression
* **Scenario ID:** ADM-TS-006
* **Test Case No.:** TC02
* **Description:** delete job and resolve report
* **Preconditions:** User is not logged in (if applicable).

| Test Steps: | Expected Results: |
| :--- | :--- |
| 1. Login as admin 2. Open Report Management 3. Open report 4. Delete Job & Resolve | Job removed; report resolved |