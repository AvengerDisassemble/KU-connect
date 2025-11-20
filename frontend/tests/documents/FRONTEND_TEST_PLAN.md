# KU Connect Frontend Test Plan

| | |
| :--- | :--- |
| **Version:** | 1.1 |
| **Prepared by:** | Frontend QA Team – AvengerDisassemble |
| **Date:** | November 2025 |
| **Status:** | For Internal Testing Use |

---

## 1. Introduction

### 1.1 Purpose
Define the frontend testing approach for **KU Connect (web)**, ensuring UI flows meet the Functional/Non-Functional Requirements in the SRS and align with our Frontend Standards & Guidelines.

### 1.2 Scope
Covers **browser-based Employer, Student, Professor and Admin workflows (React + Vite + TS)**, routing/guards, form validation, accessibility basics, and network error handling.
Excludes backend API correctness and mobile views.

### 1.3 References
* KU Connect SRS v1.0 (Sept 2025)
* KU Connect Frontend Standards & Guidelines

---

## 2. Test Objectives
* Validate critical UI workflows for all roles (**Employer, Student, Professor, Admin**) match the SRS.
* Verify **auth guards**, role-based access, and navigation.
* Confirm **client-side validations** (required, formats, file constraints).
* Ensure **resilience** (empty/loading/error states) and **basic accessibility**.
* Provide reliable **smoke/regression automation** with **Playwright**.

---

## 3. Test Scope & Modules
Modules covered by this test plan include:
* Auth & Route Guards (all roles)
* Employer Job Management (create/edit/delete, applicants)
* Student Job Discovery & Applications (browse, apply, bookmarks, status)
* Profile Management (Employer & Student profiles)
* Professor Dashboard & Insights (student/job statistics, trends)
* Admin Management (employer verification, user management, lookup/config data)
* Notifications & System Messages (basic notifications across roles)
* Resilience & Accessibility (loading, empty, error states; basic a11y)

---

## 4. Test Strategy
The frontend testing strategy for KU Connect follows a layered and risk-based approach to ensure comprehensive coverage across the user interface, functional logic, and end-to-end workflows. Testing will be divided into the following levels:

* **Component Testing:** Focuses on verifying the functionality and behavior of isolated React components (e.g., input fields, buttons, modals, validation utilities). Unit tests are written using **Vitest** or **React Testing Library** to ensure proper rendering, event handling, and validation logic.
* **Integration Testing:** Validates interactions between multiple components, including form submission, routing guards, and API response handling. These tests confirm that data flows correctly across components and that validation, navigation, and rendering work together seamlessly.
* **System / End-to-End (E2E) Testing:** Conducted using **Playwright** in a real browser environment. These tests simulate user behavior across full workflows—such as logging in, creating and managing jobs, or submitting applications—to ensure that the entire system functions as intended from the end user’s perspective.
* **Regression Testing:** Periodic reruns of previously validated tests after updates or bug fixes to verify that no existing features are broken.
    * Regression suites will be organized using Playwright test tags:
        * **@smoke** – critical path scenarios (executed on every build/PR).
        * **@negative** – validation and edge case handling.
        * **@regression** – full feature and stability checks for major releases or pre-deployment runs.
    * All automated suites will be integrated into the **CI/CD pipeline** for continuous quality feedback.
    * Test results, including trace logs and video recordings, will be retained for post-run analysis.

---

## 5. Test Environment
Frontend testing will be executed in controlled environments to ensure consistency and isolation from production data.

| Environment | Purpose | Description |
| :--- | :--- | :--- |
| **Local (Developer Machine)** | Rapid validation | Used for quick execution of component, integration, and smoke tests. APIs are intercepted or mocked within Playwright to prevent writing to real databases. |
| **Test/Staging Environment** | Full system integration | Connected to the staging backend or mock servers for realistic end-to-end testing. Used for regression and pre-release validation. |
| **CI/CD Pipeline** | Automated execution | Configured to run Playwright tests in headless mode on Chrome and Firefox browsers. Video and trace artifacts are automatically generated for debugging. |

**Additional Configuration Notes:**
* Default browsers: Chromium and Firefox (WebKit optional).
* Playwright settings: `trace: on-first-retry`, `video: retain-on-failure`.
* Test data isolation: All POST/PUT/DELETE requests intercepted to avoid database writes.
* Sensitive credentials and tokens stored via environment variables.
* Test results automatically exported to HTML report and CI summary.

---

## 6. Coverage by Role

| Role | Primary Features & Workflows | Description |
| :--- | :--- | :--- |
| **Employer** | Login → Dashboard → Create/Edit/Delete Job → Profile & Verification View → Job Validation (required fields, min≤max salary, phone sanitize) → View Applicants → Approve/Reject → View Notifications → Logout | Validates end-to-end Employer capabilities including authentication, profile/verification visibility, CRUD job posting, validation logic, applicant review actions, and notification updates. Ensures guard enforcement, field-level form checks, state updates, resilience to network delays, and correct UI reflection of backend changes. |
| **Student** | Login → Complete/Update Profile → Browse/Search/Filter Jobs → Pagination → Apply → File Upload Validation → View Application Status → Bookmark/Unbookmark Jobs → View Notifications → Logout | Ensures seamless job discovery, application submission, duplicate-prevention, file upload correctness, and persistent browsing/bookmark behavior. Validates pagination, filtering, profile completion, status tracking, and notification rendering. Includes UX validation and resilience during slow network or errors. |
| **Professor** | Login → Dashboard Overview → View Student/Job Statistics → View Insights (Daily/Monthly Trends, Job Types, Top Companies, Metrics) → Logout | Validates Professor access controls and analytics features including application trends, job posting metrics, job-type distribution, and employer trend visuals. Ensures correct chart rendering, accurate loading/empty/error states, and strict guard enforcement for Professor-only pages. |
| **Admin** | Login → Dashboard → Review Employer Verification Requests → Approve/Reject → Manage User Accounts (roles/status) → Manage Lookup/Config Data (job tags/categories) → Logout | Ensures Admin can manage core platform operations including employer verification, user account edits, and system metadata updates. Validates guard protections, correctness of verification queue, user-role updates, config changes, and UI reflection of modified data. Includes resilience testing for form errors and state changes. |

---

## 7. Test Scenarios

### 7.1 Employer

| Scenario ID | Area | Title | Description | Priority | Tags |
| :--- | :--- | :--- | :--- | :--- | :--- |
| EMP-TS-001 | Auth / Guard | Redirect unauthenticated | Unauthenticated user hits Employer pages → redirect to Sign-In | P0 | @smoke |
| EMP-TS-002 | Auth / Guard | Block wrong role | Student hits Employer pages → blocked/redirected with message | P0 | @smoke |
| EMP-TS-003 | Auth | Employer registration | Register employer with company email/info; account shown as pending verification. | P1 | @regression |
| EMP-TS-004 | Auth | Employer login (happy) | Employer signs in and reaches Profile | P0 | @smoke |
| EMP-TS-005 | Profile | Profile management | Edit employer profile, upload company logo and verification documents, and view verification status. | P1 | @regression |
| EMP-TS-006 | Job Posting | Create job | Create job successfully with valid inputs | P0 | @smoke |
| EMP-TS-007 | Job Posting | Create job validation | Required fields, salary (min≤max), phone sanitize | P0 | @negative |
| EMP-TS-008 | Job Posting | Manage job | Update or delete existing job; changes reflect | P1 | @regression |
| EMP-TS-009 | Applicants | Approve / Reject | Open applicant modal; approve/reject; status updates | P0 | @smoke |
| EMP-TS-010 | Notifications | View basic notifications | New applications appear in notifications | P2 | @regression |

### 7.2 Student

| Scenario ID | Area | Title | Description | Priority | Tags |
| :--- | :--- | :--- | :--- | :--- | :--- |
| STU-TS-001 | Auth / Guard | Redirect unauthenticated | Unauthenticated user hits Student pages → redirect to Sign-In | P0 | @smoke |
| STU-TS-002 | Auth / Guard | Block wrong role | Employer hits Student pages → blocked/redirected | P0 | @smoke |
| STU-TS-003 | Auth | Student registration | Register new student via KU Gmail; access student home on first login | P1 | @regression |
| STU-TS-004 | Auth | Student login | Student signs in to Home/Dashboard | P0 | @smoke |
| STU-TS-005 | Profile | Complete/update profile | Fill mandatory profile; data persists | P1 | @regression |
| STU-TS-006 | Browsing & Application | Browse job listings and submit a job application (happy) | Filter/search; pagination works Submit Application successfully | P0 | @smoke |
| STU-TS-007 | Application | View application status | Status reflects backend state | P1 | @regression |
| STU-TS-008 | Bookmarks | Save/unsave jobs | Bookmark toggle updates/persists | P2 | @regression |
| STU-TS-009 | Notifications | View basic notifications | Status changes appear in notifications | P2 | @regression |

### 7.3 Professor

| Scenario ID | Area | Title | Description | Priority | Tags |
| :--- | :--- | :--- | :--- | :--- | :--- |
| PROF-TS-001 | Auth / Guard | Redirect unauthenticated | Unauthenticated user hits Professor pages → redirect to Sign-In | P0 | @smoke |
| PROF-TS-002 | Auth / Guard | Block wrong role | Non-professor role hits Professor pages → blocked/redirected with message | P0 | @smoke |
| PROF-TS-003 | Auth | Professor login | Professor logs in with valid account → reaches Professor dashboard/home | P0 | @smoke |
| PROF-TS-004 | Dashboard | View professor dashboard | Professor opens the dashboard to review KPI cards and filter/export student analytics. | P1 | @regression |
| PROF-TS-005 | Insights | View student insights | Professor views student insights / application trends | P1 | @regression |

### 7.4 Admin

| Scenario ID | Area | Title | Description | Priority | Tags |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ADM-TS-001 | Auth / Guard | Redirect unauthenticated | Unauthenticated user hits Admin pages → redirect to Sign-In | P0 | @smoke |
| ADM-TS-002 | Auth / Guard | Block wrong role | Non-admin role hits Admin pages → blocked/redirected with message | P0 | @smoke |
| ADM-TS-003 | Auth | Admin login | Admin logs in with valid account → reaches Admin dashboard/home | P0 | @smoke |
| ADM-TS-004 | Verification | Review employer verification | Admin reviews employer verification requests → approve/reject; status updates | P1 | @regression |
| ADM-TS-005 | Announcement | Announcement Management | Admin create announcement → can see and manage announcement | P1 | @regression |
| ADM-TS-006 | Moderation | Admin review reported jobs | Admin resolves reported job → can keep post or remove while closing report | P1 | @regression |

---

## 8. Non-Functional Criteria (Frontend)
The following non-functional checks apply to the KU Connect frontend:
* **Performance:** Key pages (Sign-In, Dashboard, Job Detail) should load within acceptable time and remain responsive during interactions.
* **Usability:** Forms must be intuitive, include clear validation feedback, and maintain consistent UI behavior.
* **Compatibility:** Core flows must work on latest **Chrome and Firefox**. WebKit/Safari basic sanity only.
* **Resilience:** UI must not crash during network delays or failures; error and empty states should appear correctly.
* **Security (UI-side):** Protected routes must not render without authentication; sensitive data must not be exposed in console logs.

---

## 9. Entry & Exit Criteria

### Entry
Testing begins when:
* Core frontend features for each role (**Employer, Student, Professor, Admin**) are implemented.
* Auth guard and routing behavior are functional.
* Mock API or test/staging environment is available.
* No **blocker defects** exist for navigation or authentication.

### Exit
Testing is considered complete when:
* All **P0** and selected **P1** scenarios pass.
* No open **blocker/high-severity defects** remain.
* Smoke suite **(@smoke)** passes consistently.
* Frontend Test Summary is completed.
