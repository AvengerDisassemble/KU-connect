# Professor Analytics Feature - Implementation Plan

**Feature Branch:** `feature/backend/api-professor-feature`  
**Created:** November 1, 2025  
**Estimated Time:** 6-9 hours  
**Target Roles:** PROFESSOR, ADMIN

---

## 📋 Overview

This plan breaks down the implementation of the Professor Analytics Feature into 14 actionable steps across 4 phases. The feature provides read-only analytics and student monitoring capabilities for professors.

**Reference Specification:** `/backend/documents/summary/PROFESSOR_ANALYTICS_FEATURE.md`

---

## 🎯 Implementation Phases

### **Phase 1: Service Layer (Steps 1-4)** 🔧
**Estimated Time:** 2-3 hours  
**Goal:** Build core business logic with no HTTP dependencies

### **Phase 2: HTTP Layer (Steps 5-6)** 🌐
**Estimated Time:** 45 minutes  
**Goal:** Connect services to Express endpoints

### **Phase 3: Testing (Steps 7-11)** 🧪
**Estimated Time:** 2-3 hours  
**Goal:** Ensure reliability and coverage >80%

### **Phase 4: Validation (Steps 12-14)** ✅
**Estimated Time:** 1 hour  
**Goal:** Final checks and commit

---

## 📝 Detailed Implementation Steps

### Phase 1: Service Layer

#### ☐ Step 1: Create utility/helper functions in professorService.js
**File:** `backend/src/services/professorService.js`  
**Estimated Time:** 30 minutes

**Tasks:**
- [ ] Create `calculateStudentYear(expectedGraduationYear)` function
  - Logic: Compare with current year (2025)
  - Return: 1, 2, 3, 4, or "4+" as string
  - Formula:
    ```javascript
    const yearsUntilGraduation = expectedGraduationYear - currentYear
    if (yearsUntilGraduation <= 0) return "4+"
    if (yearsUntilGraduation === 1) return 4
    if (yearsUntilGraduation === 2) return 3
    if (yearsUntilGraduation === 3) return 2
    if (yearsUntilGraduation >= 4) return 1
    ```

- [ ] Create `calculateQualifiedRate(qualifiedCount, totalCount)` function
  - Return: Percentage (0-100) with 1 decimal place
  - Handle division by zero (return 0)
  - Formula: `(qualifiedCount / totalCount) * 100`

- [ ] Create `determineTrend(percentChange)` function
  - Return: "increasing" | "stable" | "decreasing"
  - Logic:
    - If change > 5%: "increasing"
    - If change < -5%: "decreasing"
    - Otherwise: "stable"

- [ ] Create `getDateRange(timePeriod)` function
  - Input: "last7days" | "last30days" | "last90days" | "all" | custom
  - Return: { startDate, endDate } as Date objects
  - Handle custom date range from params

- [ ] Add JSDoc documentation to all functions

**Validation:**
- All functions are pure (no side effects)
- All edge cases handled (null, undefined, zero)
- Return types match specification

---

#### ☐ Step 2: Implement getDashboardAnalytics() service function
**File:** `backend/src/services/professorService.js`  
**Estimated Time:** 1.5-2 hours

**Tasks:**
- [ ] Set up function signature with filters parameter
- [ ] Parse and apply date range filters
- [ ] **Calculate Summary Metrics:**
  - [ ] totalStudents (count all students)
  - [ ] studentsWithApplications (count distinct students with applications)
  - [ ] totalApplications (count all applications)
  - [ ] totalActiveJobs (count jobs where deadline > now)
  - [ ] qualifiedRate (use calculateQualifiedRate helper)

- [ ] **Calculate Application Metrics:**
  - [ ] thisMonth.count (applications in current month)
  - [ ] lastMonth.count (applications in previous month)
  - [ ] thisMonth.percentChange (compare to last month)
  - [ ] thisMonth.trend (use determineTrend helper)
  - [ ] byStatus (group by PENDING/QUALIFIED/REJECTED)
  - [ ] averagePerStudent (total / students with applications)

- [ ] **Calculate Job Metrics:**
  - [ ] activeJobPostings (count active jobs)
  - [ ] thisMonth.newJobs (jobs created this month)
  - [ ] lastMonth.newJobs (jobs created last month)
  - [ ] thisMonth.percentChange
  - [ ] thisMonth.trend
  - [ ] byJobType (group by internship/full-time/part-time/contract)
  - [ ] topCompanies (top 5 by job count and application count)

- [ ] **Calculate Application Trends:**
  - [ ] daily: Last 30 days of application counts and new job counts
  - [ ] monthly: Last 6 months of application counts and new job counts
  - [ ] Group by date/month using Prisma aggregations

- [ ] **Calculate Degree Type Breakdown:**
  - [ ] For each degree type:
    - studentCount
    - applicationCount
    - qualifiedCount
    - qualifiedRate
    - averageGPA (handle null values)

- [ ] **Get Recent Activity:**
  - [ ] Fetch last 10 applications
  - [ ] Include student name, job title, company, timestamp, status
  - [ ] Order by createdAt DESC

- [ ] Apply degreeTypeId filter if provided
- [ ] Handle errors gracefully
- [ ] Add JSDoc documentation

**Prisma Queries Needed:**
```javascript
// Summary
prisma.student.count()
prisma.application.count()
prisma.job.count({ where: { application_deadline: { gt: new Date() } } })

// Applications by status
prisma.application.groupBy({ by: ['status'], _count: true })

// Jobs by type with application counts
prisma.job.groupBy({ by: ['jobType'], _count: true })

// Trends
prisma.application.groupBy({ 
  by: ['createdAt'], 
  _count: true,
  orderBy: { createdAt: 'asc' }
})

// Degree breakdown
prisma.degreeType.findMany({
  include: {
    students: {
      include: {
        applications: true
      }
    }
  }
})
```

**Validation:**
- Response matches specification schema exactly
- All calculations are accurate
- Filters work correctly
- Performance is acceptable (< 2 seconds)

---

#### ☐ Step 3: Implement getStudentList() service function
**File:** `backend/src/services/professorService.js`  
**Estimated Time:** 1-1.5 hours

**Tasks:**
- [ ] Set up function signature with params object
- [ ] **Parse and validate query parameters:**
  - [ ] degreeTypeId (string)
  - [ ] year (string: "1", "2", "3", "4", "4+")
  - [ ] status (enum: PENDING/QUALIFIED/REJECTED)
  - [ ] hasApplications (boolean)
  - [ ] search (string - search name or email)
  - [ ] sortBy (string: name/applications/qualifiedRate/lastActivity/gpa)
  - [ ] order (string: asc/desc)
  - [ ] page (number, default: 1)
  - [ ] limit (number, default: 20, max: 100)

- [ ] **Build Prisma where clause:**
  - [ ] Filter by degreeTypeId if provided
  - [ ] Filter by year (convert to expectedGraduationYear range)
  - [ ] Filter by search (OR on name/surname/email)
  - [ ] Filter by hasApplications (exists check)
  - [ ] Filter by status (nested application status)

- [ ] **Calculate pagination:**
  - [ ] skip = (page - 1) * limit
  - [ ] take = limit
  - [ ] totalCount query
  - [ ] totalPages = Math.ceil(total / limit)

- [ ] **Fetch students with relations:**
  - [ ] Include user (name, surname, email, verified, phoneNumber, createdAt)
  - [ ] Include degreeType
  - [ ] Include applications (all fields)
  - [ ] Apply where clause, skip, take

- [ ] **Transform each student:**
  - [ ] Calculate year using calculateStudentYear()
  - [ ] Calculate applicationStats:
    - total count
    - count by status (pending/qualified/rejected)
    - qualifiedRate using helper
  - [ ] Determine recentStatus (most recent application status)
  - [ ] Get lastApplicationDate (most recent application.createdAt)
  - [ ] Set hasResume, hasTranscript (check for null)
  - [ ] Format response fields

- [ ] **Handle sorting:**
  - [ ] name: Sort by user.name
  - [ ] applications: Sort by application count (computed)
  - [ ] qualifiedRate: Sort by qualified percentage (computed)
  - [ ] lastActivity: Sort by last application date
  - [ ] gpa: Sort by student.gpa

- [ ] Return paginated response with summary
- [ ] Add JSDoc documentation

**Special Handling:**
- Year filtering requires converting "4+" to expectedGraduationYear <= currentYear
- Sorting by computed fields may require post-query sorting in JavaScript
- Search should be case-insensitive

**Validation:**
- Pagination works correctly
- All filters work individually and combined
- Sorting works for all fields
- Search works for partial matches
- Response matches specification

---

#### ☐ Step 4: Implement getStudentDetail() service function
**File:** `backend/src/services/professorService.js`  
**Estimated Time:** 45 minutes

**Tasks:**
- [ ] Set up function signature with studentId parameter
- [ ] **Fetch student with all relations:**
  ```javascript
  prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      degreeType: true,
      applications: {
        include: {
          job: {
            include: {
              hr: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      interests: {
        include: {
          job: true
        }
      }
    }
  })
  ```

- [ ] Check if student exists (throw 404 if not)

- [ ] **Build personalInfo object:**
  - [ ] name, surname, fullName
  - [ ] email, phoneNumber
  - [ ] address
  - [ ] avatarUrl (construct from avatarKey if exists)
  - [ ] verified
  - [ ] joinedAt (user.createdAt)

- [ ] **Build academicInfo object:**
  - [ ] degreeType (id and name)
  - [ ] currentYear (use calculateStudentYear)
  - [ ] expectedGraduationYear
  - [ ] gpa
  - [ ] hasResume, hasTranscript, hasVerificationDoc (boolean checks)

- [ ] **Build applicationStatistics object:**
  - [ ] total count
  - [ ] byStatus counts
  - [ ] qualifiedRate
  - [ ] firstApplicationDate
  - [ ] lastApplicationDate
  - [ ] averageApplicationsPerMonth (calculate from date range)

- [ ] **Build jobPreferences object:**
  - [ ] mostAppliedJobType (mode of application job types)
  - [ ] mostAppliedLocations (top 3 locations)
  - [ ] interestedJobsCount (StudentInterest count)

- [ ] **Build applicationHistory array:**
  - [ ] Map each application to response format
  - [ ] Include job details (title, company, type, location, arrangement)
  - [ ] Format salary as range string
  - [ ] Include status and dates

- [ ] **Build interestedJobs array:**
  - [ ] Map StudentInterest to job details
  - [ ] Check hasApplied (cross-reference with applications)
  - [ ] Include job posted date

- [ ] **Security check:**
  - [ ] Ensure no password field
  - [ ] Ensure no refreshTokens
  - [ ] Ensure no accounts
  - [ ] Only document keys as booleans, not actual keys

- [ ] Add JSDoc documentation

**Validation:**
- 404 error if student not found
- No sensitive data in response
- All nested data properly formatted
- Calculations are accurate

---

### Phase 2: HTTP Layer

#### ☐ Step 5: Create professorController.js with all three handlers
**File:** `backend/src/controllers/professorController.js`  
**Estimated Time:** 30 minutes

**Tasks:**
- [ ] Create file with imports:
  ```javascript
  const professorService = require('../services/professorService')
  ```

- [ ] **Implement getDashboard(req, res, next):**
  - [ ] Extract query params: degreeTypeId, timePeriod, startDate, endDate
  - [ ] Call professorService.getDashboardAnalytics(filters)
  - [ ] Return success response with data
  - [ ] Wrap in try-catch, pass errors to next()

- [ ] **Implement getStudents(req, res, next):**
  - [ ] Extract all query params
  - [ ] Convert string params to correct types (page, limit to numbers, etc.)
  - [ ] Call professorService.getStudentList(params)
  - [ ] Return success response with data
  - [ ] Wrap in try-catch

- [ ] **Implement getStudentById(req, res, next):**
  - [ ] Extract studentId from req.params
  - [ ] Call professorService.getStudentDetail(studentId)
  - [ ] Return success response with data
  - [ ] Handle 404 errors specifically
  - [ ] Wrap in try-catch

- [ ] Export all functions
- [ ] Add JSDoc to all functions

**Response Format:**
```javascript
res.json({
  success: true,
  message: 'Operation completed successfully',
  data: { /* result */ }
})
```

**Error Handling:**
```javascript
try {
  // logic
} catch (error) {
  next(error) // Let error middleware handle it
}
```

**Validation:**
- All query params extracted correctly
- Type conversions handled
- Errors passed to next()
- Response format matches spec

---

#### ☐ Step 6: Create professorRoutes.js with route definitions
**File:** `backend/src/routes/professorRoutes.js`  
**Estimated Time:** 15 minutes

**Tasks:**
- [ ] Create file with imports:
  ```javascript
  const express = require('express')
  const router = express.Router()
  const professorController = require('../controllers/professorController')
  const { authMiddleware } = require('../middlewares/authMiddleware')
  const { roleMiddleware } = require('../middlewares/roleMiddleware')
  ```

- [ ] Create middleware array:
  ```javascript
  const professorOrAdmin = [
    authMiddleware, 
    roleMiddleware(['PROFESSOR', 'ADMIN'])
  ]
  ```

- [ ] **Define routes:**
  - [ ] `GET /analytics/dashboard` → getDashboard
  - [ ] `GET /students` → getStudents
  - [ ] `GET /students/:studentId` → getStudentById

- [ ] Apply professorOrAdmin middleware to all routes

- [ ] Export router

**Note:** Routes are auto-registered by `/src/routes/index.js`. The file will be automatically mounted at `/api/professor` based on the filename `professorRoutes.js`.

**Validation:**
- Middleware order correct (auth before role check)
- Route paths match specification
- All routes protected
- Routes accessible at `/api/professor/*` after server restart

---

### Phase 3: Testing

#### ☐ Step 7: Create test data setup and mocks
**File:** `backend/tests/controllers/professorController.test.js`  
**Estimated Time:** 45 minutes

**Tasks:**
- [ ] **Set up test file structure:**
  ```javascript
  const request = require('supertest')
  const app = require('../../src/app')
  const prisma = require('../../src/generated/prisma')
  ```

- [ ] **Create test data fixtures:**
  - [ ] 3 degree types (Bachelor, Master, Doctor)
  - [ ] 20 test students:
    - Various degree types
    - Various graduation years (2025, 2026, 2027, 2028, 2029)
    - Various GPAs (2.5 - 4.0)
    - Some with resumes/transcripts, some without
  - [ ] 10 test jobs:
    - Various types (internship, full-time, part-time)
    - Various companies
    - Various locations
    - Mix of active and expired deadlines
  - [ ] 50 test applications:
    - Various statuses (PENDING, QUALIFIED, REJECTED)
    - Various dates (last 3 months)
    - Connect students to jobs

- [ ] **Create test users:**
  - [ ] 1 professor user
  - [ ] 1 admin user
  - [ ] 1 student user (for 403 tests)
  - [ ] Generate JWT tokens for each

- [ ] **Set up hooks:**
  - [ ] beforeAll: Create all test data
  - [ ] afterAll: Clean up test data, disconnect Prisma

- [ ] **Helper functions:**
  - [ ] `getAuthToken(role)` - Get token for role
  - [ ] `createStudent(data)` - Create student with defaults
  - [ ] `createApplication(data)` - Create application with defaults

**Validation:**
- Test data is realistic
- All relationships set up correctly
- Cleanup works properly
- No test data leaks between tests

---

#### ☐ Step 8: Write tests for dashboard endpoint
**File:** `backend/tests/controllers/professorController.test.js`  
**Estimated Time:** 45 minutes

**Tasks:**
- [ ] Create describe block: `GET /api/professor/analytics/dashboard`

- [ ] **Test: should return dashboard analytics for professor**
  - [ ] Make request with professor token
  - [ ] Expect 200 status
  - [ ] Verify response structure matches spec
  - [ ] Check all required fields present
  - [ ] Validate data types

- [ ] **Test: should return dashboard analytics for admin**
  - [ ] Make request with admin token
  - [ ] Expect 200 status

- [ ] **Test: should filter by degreeTypeId**
  - [ ] Make request with degreeTypeId param
  - [ ] Verify filtered results only include that degree type

- [ ] **Test: should filter by timePeriod (last30days)**
  - [ ] Make request with timePeriod=last30days
  - [ ] Verify trends array length is appropriate
  - [ ] Check date range is correct

- [ ] **Test: should filter by custom date range**
  - [ ] Make request with startDate and endDate
  - [ ] Verify data within date range

- [ ] **Test: should return 403 for non-professor/admin users**
  - [ ] Make request with student token
  - [ ] Expect 403 status
  - [ ] Verify error message

- [ ] **Test: should return 401 for unauthenticated requests**
  - [ ] Make request without token
  - [ ] Expect 401 status

**Validation:**
- All tests pass
- Edge cases covered
- Response validation thorough

---

#### ☐ Step 9: Write tests for student list endpoint
**File:** `backend/tests/controllers/professorController.test.js`  
**Estimated Time:** 1 hour

**Tasks:**
- [ ] Create describe block: `GET /api/professor/students`

- [ ] **Test: should return paginated student list**
  - [ ] Make request without params
  - [ ] Expect 200 status
  - [ ] Verify pagination object present
  - [ ] Check default page=1, limit=20
  - [ ] Verify students array structure

- [ ] **Test: should filter by degreeTypeId**
  - [ ] Make request with degreeTypeId
  - [ ] Verify all students have that degree type

- [ ] **Test: should filter by year**
  - [ ] Make request with year=4
  - [ ] Verify calculated year matches for all students

- [ ] **Test: should filter by year=4+**
  - [ ] Make request with year=4+
  - [ ] Verify all students have expectedGraduationYear <= current year

- [ ] **Test: should filter by status (QUALIFIED)**
  - [ ] Make request with status=QUALIFIED
  - [ ] Verify all students have at least one QUALIFIED application
  - [ ] Check recentStatus is QUALIFIED

- [ ] **Test: should search by name**
  - [ ] Make request with search="sunthom"
  - [ ] Verify results contain matching names
  - [ ] Test case-insensitive search

- [ ] **Test: should search by email**
  - [ ] Make request with search containing email part
  - [ ] Verify matching results

- [ ] **Test: should sort by applications (desc)**
  - [ ] Make request with sortBy=applications, order=desc
  - [ ] Verify students ordered by application count descending

- [ ] **Test: should sort by qualifiedRate (asc)**
  - [ ] Make request with sortBy=qualifiedRate, order=asc
  - [ ] Verify students ordered by qualified rate ascending

- [ ] **Test: should sort by gpa (desc)**
  - [ ] Make request with sortBy=gpa, order=desc
  - [ ] Verify students ordered correctly
  - [ ] Handle null GPAs

- [ ] **Test: should filter by hasApplications=true**
  - [ ] Make request with hasApplications=true
  - [ ] Verify all students have applicationStats.total > 0

- [ ] **Test: should filter by hasApplications=false**
  - [ ] Make request with hasApplications=false
  - [ ] Verify all students have applicationStats.total = 0

- [ ] **Test: should handle pagination correctly**
  - [ ] Make request with page=2, limit=5
  - [ ] Verify correct skip/take
  - [ ] Check totalPages calculation

- [ ] **Test: should combine multiple filters**
  - [ ] Make request with degreeTypeId + year + hasApplications
  - [ ] Verify all filters applied correctly

- [ ] **Test: should return 403 for non-professor/admin users**
  - [ ] Make request with student token
  - [ ] Expect 403 status

**Validation:**
- All filters work individually
- Filters work in combination
- Sorting works correctly
- Pagination accurate

---

#### ☐ Step 10: Write tests for student detail endpoint
**File:** `backend/tests/controllers/professorController.test.js`  
**Estimated Time:** 30 minutes

**Tasks:**
- [ ] Create describe block: `GET /api/professor/students/:studentId`

- [ ] **Test: should return student detail with full data**
  - [ ] Make request with valid studentId
  - [ ] Expect 200 status
  - [ ] Verify personalInfo object structure
  - [ ] Verify academicInfo object structure
  - [ ] Verify applicationStatistics object structure
  - [ ] Verify jobPreferences object structure
  - [ ] Verify applicationHistory array present
  - [ ] Verify interestedJobs array present
  - [ ] Check all calculations accurate

- [ ] **Test: should not include sensitive data**
  - [ ] Make request with valid studentId
  - [ ] Verify response does NOT contain:
    - password field
    - refreshTokens
    - accounts
    - actual document keys (only booleans)

- [ ] **Test: should include application history sorted by date**
  - [ ] Make request with studentId that has multiple applications
  - [ ] Verify applications sorted descending by appliedAt
  - [ ] Check job details included

- [ ] **Test: should calculate year correctly**
  - [ ] Test multiple students with different graduation years
  - [ ] Verify year calculation matches spec

- [ ] **Test: should handle student with no applications**
  - [ ] Make request with studentId of student with no apps
  - [ ] Verify applicationStatistics has zeros
  - [ ] applicationHistory is empty array

- [ ] **Test: should return 404 for non-existent student**
  - [ ] Make request with invalid studentId
  - [ ] Expect 404 status
  - [ ] Verify error message

- [ ] **Test: should return 403 for non-professor/admin users**
  - [ ] Make request with student token
  - [ ] Expect 403 status

**Validation:**
- No sensitive data leaked
- All nested data correct
- Error handling works
- Calculations accurate

---

#### ☐ Step 11: Run all tests and verify coverage >80%
**File:** N/A  
**Estimated Time:** 30 minutes

**Tasks:**
- [ ] Run test suite:
  ```bash
  npm test tests/controllers/professorController.test.js
  ```

- [ ] Run with coverage:
  ```bash
  npm test tests/controllers/professorController.test.js -- --coverage
  ```

- [ ] **Review coverage report:**
  - [ ] professorService.js coverage > 80%
  - [ ] professorController.js coverage > 80%
  - [ ] professorRoutes.js coverage > 80%

- [ ] **Debug failing tests:**
  - [ ] Identify failure causes
  - [ ] Fix implementation issues
  - [ ] Re-run tests

- [ ] **Add missing test cases if coverage low:**
  - [ ] Identify uncovered branches
  - [ ] Add tests for edge cases
  - [ ] Re-run coverage

- [ ] Verify all tests pass (green)

**Validation:**
- All tests passing
- Coverage > 80%
- No console errors
- Fast execution (< 10 seconds)

---

### Phase 4: Validation

#### ☐ Step 12: Manual API testing with REST client
**File:** N/A (Manual Testing)  
**Estimated Time:** 30 minutes

**Tasks:**
- [ ] **Set up REST client** (Postman/Thunder Client/Insomnia)

- [ ] **Test authentication flow:**
  - [ ] Login as professor user
  - [ ] Save accessToken cookie
  - [ ] Login as admin user
  - [ ] Login as student user

- [ ] **Dashboard Endpoint Tests:**
  - [ ] GET `/api/professor/analytics/dashboard`
    - [ ] Test without params (default view)
    - [ ] Test with degreeTypeId filter
    - [ ] Test with timePeriod=last7days
    - [ ] Test with timePeriod=last30days
    - [ ] Test with custom date range
    - [ ] Verify response matches spec
    - [ ] Check all metrics present
    - [ ] Verify trends data structure

- [ ] **Student List Endpoint Tests:**
  - [ ] GET `/api/professor/students`
    - [ ] Test without params (default pagination)
    - [ ] Test page=2, limit=10
    - [ ] Test degreeTypeId filter
    - [ ] Test year=4 filter
    - [ ] Test year=4+ filter
    - [ ] Test status=QUALIFIED filter
    - [ ] Test hasApplications=true
    - [ ] Test search by name
    - [ ] Test sortBy=applications, order=desc
    - [ ] Test sortBy=gpa, order=asc
    - [ ] Test combined filters
    - [ ] Verify pagination calculations

- [ ] **Student Detail Endpoint Tests:**
  - [ ] GET `/api/professor/students/:studentId`
    - [ ] Test with valid student ID
    - [ ] Test with student having many applications
    - [ ] Test with student having no applications
    - [ ] Test with invalid student ID (expect 404)
    - [ ] Verify no sensitive data exposed
    - [ ] Check all nested objects present

- [ ] **Authorization Tests:**
  - [ ] Test all endpoints as PROFESSOR (expect 200)
  - [ ] Test all endpoints as ADMIN (expect 200)
  - [ ] Test all endpoints as STUDENT (expect 403)
  - [ ] Test all endpoints without auth (expect 401)

- [ ] **Error Handling Tests:**
  - [ ] Invalid degreeTypeId (should return empty or error)
  - [ ] Invalid query params
  - [ ] Malformed requests

- [ ] Document any issues found

**Validation:**
- All endpoints accessible
- Authorization working correctly
- Filters producing correct results
- No server errors
- Response times acceptable

---

#### ☐ Step 13: Code review and documentation check
**File:** All implementation files  
**Estimated Time:** 20 minutes

**Tasks:**
- [ ] **Review professorService.js:**
  - [ ] JSDoc on all exported functions
  - [ ] JSDoc includes @param and @returns
  - [ ] No semicolons (Standard JS)
  - [ ] 2-space indentation
  - [ ] Single quotes for strings
  - [ ] Comments explain WHY not WHAT
  - [ ] No console.logs (use proper logging if needed)
  - [ ] Error handling complete

- [ ] **Review professorController.js:**
  - [ ] JSDoc on all functions
  - [ ] Proper try-catch blocks
  - [ ] Errors passed to next()
  - [ ] No business logic (should be in service)
  - [ ] Response format consistent

- [ ] **Review professorRoutes.js:**
  - [ ] Middleware order correct
  - [ ] All routes protected
  - [ ] No duplicate routes

- [ ] **Security audit:**
  - [ ] No password in responses
  - [ ] No tokens in responses
  - [ ] Document keys only as booleans
  - [ ] No SQL injection vulnerabilities
  - [ ] Proper input validation

- [ ] **Performance check:**
  - [ ] No N+1 query problems
  - [ ] Proper use of Prisma includes
  - [ ] Pagination implemented correctly

- [ ] **Code style check:**
  - [ ] Run linter: `npm run lint` (if available)
  - [ ] Fix any style violations
  - [ ] Consistent naming conventions

**Validation:**
- All documentation complete
- No security issues
- Code follows standards
- No performance red flags

---

#### ☐ Step 14: Final validation and commit
**File:** N/A  
**Estimated Time:** 10 minutes

**Tasks:**
- [ ] **Run Definition of Done checklist:**
  - [ ] All three endpoints implemented and working
  - [ ] Service layer with proper business logic
  - [ ] Controller with error handling
  - [ ] Routes registered with proper authentication/authorization
  - [ ] All privacy requirements enforced
  - [ ] Year calculation working correctly (1-4, 4+)
  - [ ] Qualified rate calculation accurate
  - [ ] Trends calculation (daily/monthly) working
  - [ ] Pagination working correctly
  - [ ] All filters working as specified
  - [ ] Sorting working for all fields
  - [ ] Search functionality working
  - [ ] Comprehensive tests with >80% coverage
  - [ ] All tests passing
  - [ ] JSDoc documentation for all functions
  - [ ] Code follows JavaScript Standard Style
  - [ ] No sensitive data leakage (passwords, tokens, document files)
  - [ ] Error responses properly formatted
  - [ ] Success responses match specification

- [ ] **Verify git status:**
  ```bash
  git status
  ```

- [ ] **Review changed files:**
  ```bash
  git diff
  ```

- [ ] **Stage changes:**
  ```bash
  git add src/services/professorService.js
  git add src/controllers/professorController.js
  git add src/routes/professorRoutes.js
  git add src/app.js
  git add tests/controllers/professorController.test.js
  ```

- [ ] **Commit with conventional commit format:**
  ```bash
  git commit -m "feat(professor): implement analytics dashboard and student monitoring

  - Add professorService with dashboard analytics, student list, and detail views
  - Add professorController with three endpoints
  - Add professorRoutes with PROFESSOR/ADMIN role protection
  - Register routes in app.js
  - Add comprehensive test suite with >80% coverage
  - Implement year calculation (1-4, 4+) from graduation year
  - Implement trend analysis and metrics calculation
  - Add privacy controls (no document downloads)
  - Add filtering, sorting, pagination for student list
  
  Closes #[issue-number]"
  ```

- [ ] **Push to remote:**
  ```bash
  git push origin feature/backend/api-professor-feature
  ```

- [ ] **Verify CI/CD passes** (if applicable)

- [ ] **Create pull request** with:
  - [ ] Title: "feat(professor): implement analytics dashboard and student monitoring"
  - [ ] Description linking to specification document
  - [ ] Screenshots/examples of API responses
  - [ ] Testing notes

**Validation:**
- All Definition of Done items checked
- Commit message descriptive
- Changes pushed successfully
- PR created and ready for review

---

## 📊 Progress Tracking

**Phase 1:** ☐☐☐☐ (0/4 complete)  
**Phase 2:** ☐☐ (0/2 complete)  
**Phase 3:** ☐☐☐☐☐ (0/5 complete)  
**Phase 4:** ☐☐☐ (0/3 complete)

**Overall Progress:** 0/14 steps complete (0%)

---

## 🎯 Success Criteria

- [ ] All 14 steps completed
- [ ] All tests passing
- [ ] Coverage > 80%
- [ ] Manual testing successful
- [ ] Code review passed
- [ ] Committed and pushed
- [ ] PR created

---

## 📚 Quick Reference

**Key Files:**
- Spec: `/backend/documents/summary/PROFESSOR_ANALYTICS_FEATURE.md`
- Schema: `/backend/prisma/schema.prisma`
- Auth Reference: `/backend/documents/summary/authorization-and-authentication/QUICK_REFERENCE.md`

**Key Commands:**
```bash
# Run tests
npm test tests/controllers/professorController.test.js

# Run with coverage
npm test tests/controllers/professorController.test.js -- --coverage

# Start dev server
npm run dev

# Lint code
npm run lint
```

**Prisma Client Path:**
```javascript
const prisma = require('../generated/prisma')
```

**Current Year (for calculations):** 2025

---

## 🚦 Ready to Start!

Begin with **Step 1** and work sequentially through each phase. Check off tasks as you complete them and track your progress!
