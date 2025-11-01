# Professor Analytics Feature - Implementation Specification

## 📋 Feature Overview

Implement a comprehensive analytics dashboard and student monitoring system for professors to view student job search activities and outcomes. This feature provides read-only access to student data, application statistics, and job market trends.

---

## 🎯 Requirements Summary

### Core Functionality
1. **Dashboard Analytics** - Overview of student applications and job market trends
2. **Student List** - Filterable list of all students with application statistics
3. **Student Detail View** - Individual student profile with complete application history

### Access Control
- **Who Can Access:** PROFESSOR and ADMIN roles only
- **Access Type:** Read-only (no modifications, no exports)
- **Privacy:** Cannot download student documents (resumes, transcripts)

### Key Metrics
- Application counts and trends (daily/monthly)
- Job position metrics and trends
- Student qualification rates
- Degree type breakdowns

---

## 🔧 Technical Stack & Conventions

### Backend Stack
- **Framework:** Express.js + JavaScript
- **ORM:** Prisma (with generated client at `src/generated/prisma`)
- **Database:** PostgreSQL (SQLite for tests)
- **Auth:** JWT via HTTP-only cookies

### Coding Standards
1. **JavaScript Standard Style** (https://standardjs.com/rules)
   - No semicolons
   - 2 spaces indentation
   - Single quotes for strings
2. **JSDoc** for function documentation
3. **Comment WHY, not WHAT** (except in docstrings)

### Project Structure
```
backend/src/
├── controllers/
│   └── professorController.js          # NEW
├── routes/
│   └── professorRoutes.js              # NEW
├── services/
│   └── professorService.js             # NEW
└── middlewares/
    ├── authMiddleware.js                # EXISTING - Use authMiddleware
    └── roleMiddleware.js                # EXISTING - Use roleMiddleware
```

### Middleware Usage
```javascript
// Import pattern
const { authMiddleware } = require('../middlewares/authMiddleware')
const { roleMiddleware } = require('../middlewares/roleMiddleware')

// Route protection
router.get('/endpoint', authMiddleware, roleMiddleware(['PROFESSOR', 'ADMIN']), controller)

// Access user data in controller
const userId = req.user.id
const userRole = req.user.role
```

---

## 📊 Database Schema Reference

### Relevant Models

```prisma
model User {
  id            String         @id @default(cuid())
  name          String
  surname       String
  email         String         @unique
  role          Role
  verified      Boolean        @default(false)
  avatarKey     String?
  phoneNumber   String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Student {
  id                     String            @id @default(cuid())
  userId                 String            @unique
  degreeTypeId           String
  address                String
  gpa                    Float?
  expectedGraduationYear Int?
  resumeKey              String?
  transcriptKey          String?
  verificationDocKey     String?
  createdAt              DateTime          @default(now())
  updatedAt              DateTime          @updatedAt
  
  user         User              @relation(fields: [userId], references: [id])
  degreeType   DegreeType        @relation(fields: [degreeTypeId], references: [id])
  applications Application[]
  resumes      Resume[]
  interests    StudentInterest[]
}

model Application {
  id        String            @id @default(cuid())
  jobId     String
  studentId String
  resumeId  String?
  status    ApplicationStatus @default(PENDING)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  
  @@unique([jobId, studentId])
}

enum ApplicationStatus {
  PENDING
  QUALIFIED
  REJECTED
}

model Job {
  id                   String   @id @default(cuid())
  hrId                 String
  title                String
  companyName          String
  description          String
  location             String
  jobType              String   // internship, part-time, full-time, contract
  workArrangement      String   // on-site, remote, hybrid
  minSalary            Int
  maxSalary            Int
  application_deadline DateTime
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model DegreeType {
  id   String @id @default(cuid())
  name String @unique
  // Examples: "Bachelor of Engineering", "Master of Science", "Doctor of Philosophy"
}
```

---

## 🛣️ API Endpoints Specification

### 1. Dashboard Analytics

**Endpoint:** `GET /api/professor/analytics/dashboard`

**Auth:** PROFESSOR or ADMIN role required

**Rate Limit:** 1000 requests per 15 minutes (generalLimiter)

**Query Parameters (All Optional):**
- `degreeTypeId` (string) - Filter by specific degree type
- `timePeriod` (string) - "last7days" | "last30days" | "last90days" | "all"
- `startDate` (ISO string) - Custom date range start
- `endDate` (ISO string) - Custom date range end

**Response Schema:**
```json
{
  "summary": {
    "totalStudents": 156,
    "studentsWithApplications": 89,
    "totalApplications": 342,
    "totalActiveJobs": 45,
    "qualifiedRate": 28.4
  },
  
  "applicationMetrics": {
    "thisMonth": {
      "count": 67,
      "percentChange": 18,
      "trend": "increasing"
    },
    "byStatus": {
      "pending": 210,
      "qualified": 97,
      "rejected": 35
    },
    "averagePerStudent": 3.8
  },
  
  "jobMetrics": {
    "activeJobPostings": 45,
    "thisMonth": {
      "newJobs": 12,
      "percentChange": 15,
      "trend": "increasing"
    },
    "byJobType": [
      { "type": "internship", "count": 25, "applications": 180 },
      { "type": "full-time", "count": 15, "applications": 120 },
      { "type": "part-time", "count": 5, "applications": 42 }
    ],
    "topCompanies": [
      { "companyName": "Tech Corp", "jobCount": 8, "applicationCount": 95 },
      { "companyName": "Software Inc", "jobCount": 6, "applicationCount": 78 }
    ]
  },
  
  "applicationTrends": {
    "daily": [
      { "date": "2025-10-25", "applications": 12, "newJobs": 2 },
      { "date": "2025-10-26", "applications": 15, "newJobs": 1 }
    ],
    "monthly": [
      { "month": "2025-08", "applications": 245, "newJobs": 35 },
      { "month": "2025-09", "applications": 289, "newJobs": 42 }
    ]
  },
  
  "degreeTypeBreakdown": [
    {
      "degreeTypeId": "deg_123",
      "degreeTypeName": "Bachelor of Engineering",
      "studentCount": 120,
      "applicationCount": 280,
      "qualifiedCount": 85,
      "qualifiedRate": 30.4,
      "averageGPA": 3.25
    }
  ],
  
  "recentActivity": [
    {
      "studentName": "Sunthom Kompita",
      "jobTitle": "Software Engineer Intern",
      "companyName": "Tech Corp",
      "appliedAt": "2025-10-31T14:30:00Z",
      "status": "PENDING"
    }
  ]
}
```

**Business Logic:**
- `qualifiedRate` = (QUALIFIED applications / total applications) × 100
- `percentChange` = ((current - previous) / previous) × 100
- `trend` = "increasing" if change > 5%, "decreasing" if < -5%, else "stable"
- Recent activity shows last 10 applications
- Daily trends show last 30 days
- Monthly trends show last 6 months

---

### 2. Student List with Filters

**Endpoint:** `GET /api/professor/students`

**Auth:** PROFESSOR or ADMIN role required

**Rate Limit:** 500 requests per 15 minutes (searchLimiter - for search/filter operations)

**Query Parameters (All Optional):**
- `degreeTypeId` (string) - Filter by degree type
- `year` (string) - Filter by year: "1", "2", "3", "4", "4+"
- `status` (string) - Filter by application status: "PENDING", "QUALIFIED", "REJECTED"
- `hasApplications` (boolean) - Show only students with applications
- `search` (string) - Search by name or email
- `sortBy` (string) - "name" | "applications" | "qualifiedRate" | "lastActivity" | "gpa"
- `order` (string) - "asc" | "desc"
- `page` (number) - Default: 1
- `limit` (number) - Default: 20, Max: 100

**Response Schema:**
```json
{
  "students": [
    {
      "studentId": "stu_abc123",
      "userId": "usr_xyz789",
      "name": "Sunthom",
      "surname": "Kompita",
      "fullName": "Sunthom Kompita",
      "email": "sunthom.k@ku.th",
      "degreeType": {
        "id": "deg_123",
        "name": "Bachelor of Engineering"
      },
      "year": 4,
      "expectedGraduationYear": 2026,
      "gpa": 3.45,
      "verified": true,
      "hasResume": true,
      "hasTranscript": true,
      "applicationStats": {
        "total": 15,
        "pending": 8,
        "qualified": 6,
        "rejected": 1,
        "qualifiedRate": 40.0
      },
      "recentStatus": "QUALIFIED",
      "lastApplicationDate": "2025-10-28T10:30:00Z",
      "createdAt": "2024-09-01T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  },
  "summary": {
    "totalStudents": 156,
    "filteredCount": 45
  }
}
```

**Business Logic:**
- `year` calculated from `expectedGraduationYear`:
  ```javascript
  const currentYear = new Date().getFullYear()
  const yearsUntilGraduation = expectedGraduationYear - currentYear
  
  if (yearsUntilGraduation <= 0) return "4+"
  if (yearsUntilGraduation === 1) return 4
  if (yearsUntilGraduation === 2) return 3
  if (yearsUntilGraduation === 3) return 2
  if (yearsUntilGraduation >= 4) return 1
  ```
- `recentStatus` = status of most recent application (by createdAt)
- `hasResume` = `resumeKey !== null`
- `hasTranscript` = `transcriptKey !== null`

---

### 3. Individual Student Detail

**Endpoint:** `GET /api/professor/students/:studentId`

**Auth:** PROFESSOR or ADMIN role required

**Rate Limit:** 100 requests per 15 minutes (generalLimiter - simple ID lookup)

**Path Parameters:**
- `studentId` (string) - Student ID (not user ID)

**Response Schema:**
```json
{
  "student": {
    "studentId": "stu_abc123",
    "userId": "usr_xyz789",
    
    "personalInfo": {
      "name": "Sunthom",
      "surname": "Kompita",
      "fullName": "Sunthom Kompita",
      "email": "sunthom.k@ku.th",
      "phoneNumber": "+66812345678",
      "address": "Bangkok, Thailand",
      "avatarUrl": "/api/users/avatar/usr_xyz789",
      "verified": true,
      "joinedAt": "2024-09-01T08:00:00Z"
    },
    
    "academicInfo": {
      "degreeType": {
        "id": "deg_123",
        "name": "Bachelor of Engineering"
      },
      "currentYear": 4,
      "expectedGraduationYear": 2026,
      "gpa": 3.45,
      "hasResume": true,
      "hasTranscript": true,
      "hasVerificationDoc": true
    },
    
    "applicationStatistics": {
      "total": 15,
      "byStatus": {
        "pending": 8,
        "qualified": 6,
        "rejected": 1
      },
      "qualifiedRate": 40.0,
      "firstApplicationDate": "2025-08-15T10:00:00Z",
      "lastApplicationDate": "2025-10-28T10:30:00Z",
      "averageApplicationsPerMonth": 2.5
    },
    
    "jobPreferences": {
      "mostAppliedJobType": "internship",
      "mostAppliedLocations": ["Bangkok", "Chiang Mai"],
      "interestedJobsCount": 8
    }
  },
  
  "applicationHistory": [
    {
      "applicationId": "app_123",
      "job": {
        "id": "job_456",
        "title": "Software Engineer Intern",
        "companyName": "Tech Corp",
        "jobType": "internship",
        "location": "Bangkok",
        "workArrangement": "hybrid",
        "salaryRange": "15,000 - 20,000 THB"
      },
      "status": "QUALIFIED",
      "appliedAt": "2025-10-28T10:30:00Z",
      "lastUpdated": "2025-10-29T14:20:00Z"
    }
  ],
  
  "interestedJobs": [
    {
      "jobId": "job_789",
      "title": "Backend Developer",
      "companyName": "Software Inc",
      "hasApplied": false,
      "postedAt": "2025-10-20T09:00:00Z"
    }
  ]
}
```

**Error Responses:**
- 404: Student not found
- 401: Not authenticated
- 403: Insufficient permissions

---

## 🔒 Privacy & Security Requirements

### What Professors CAN Access:
✅ Student profile information (name, email, phone, address)  
✅ Academic information (degree, year, GPA)  
✅ Document status (has/hasn't uploaded documents)  
✅ Complete application history  
✅ Application statistics and trends  
✅ Job interests  

### What Professors CANNOT Access:
❌ Download actual document files (resumeKey, transcriptKey, verificationDocKey)  
❌ Student passwords or authentication tokens  
❌ Modify any student data  
❌ Export data functionality  

### Implementation Notes:
- Never include `password`, `refreshTokens`, or `accounts` in responses
- Document keys (resumeKey, transcriptKey) should only indicate presence (boolean)
- All endpoints are read-only (GET only)

---

## 🧪 Testing Requirements

### Test File Structure
```
backend/tests/
├── controllers/
│   └── professorController.test.js
├── services/
│   └── professorService.test.js
└── routes/
    └── professorRoutes.test.js
```

### Test Coverage Required

#### professorController.test.js
```javascript
describe('Professor Analytics Controller', () => {
  describe('GET /api/professor/analytics/dashboard', () => {
    it('should return dashboard analytics for professor', async () => {})
    it('should return dashboard analytics for admin', async () => {})
    it('should filter by degreeTypeId', async () => {})
    it('should filter by timePeriod', async () => {})
    it('should return 403 for non-professor/admin users', async () => {})
    it('should return 401 for unauthenticated requests', async () => {})
  })

  describe('GET /api/professor/students', () => {
    it('should return paginated student list', async () => {})
    it('should filter by degreeTypeId', async () => {})
    it('should filter by year', async () => {})
    it('should filter by status', async () => {})
    it('should search by name', async () => {})
    it('should sort by applications descending', async () => {})
    it('should sort by qualifiedRate ascending', async () => {})
    it('should filter by hasApplications=true', async () => {})
    it('should return 403 for non-professor/admin users', async () => {})
  })

  describe('GET /api/professor/students/:studentId', () => {
    it('should return student detail with application history', async () => {})
    it('should not include sensitive data', async () => {})
    it('should return 404 for non-existent student', async () => {})
    it('should return 403 for non-professor/admin users', async () => {})
  })
})
```

### Test Data Setup
- Create test students with various degree types
- Create test applications with different statuses
- Create test jobs with various types and companies
- Use Jest mocks for Prisma client

### Running Tests
```bash
# Run all professor tests
npm test -- professorController.test.js

# Run with coverage
npm test -- --coverage professorController.test.js
```

---

## 📦 Implementation Steps

### Step 1: Create Service Layer
**File:** `backend/src/services/professorService.js`

**Functions to implement:**
```javascript
/**
 * Get dashboard analytics with optional filters
 * @param {Object} filters - Query filters (degreeTypeId, timePeriod, startDate, endDate)
 * @returns {Promise<Object>} Dashboard analytics data
 */
async function getDashboardAnalytics(filters)

/**
 * Get paginated student list with filters and sorting
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Students array with pagination
 */
async function getStudentList(params)

/**
 * Get detailed information for a specific student
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Student detail with application history
 */
async function getStudentDetail(studentId)

/**
 * Calculate student year from graduation year
 * @param {number} expectedGraduationYear - Expected graduation year
 * @returns {string|number} Year (1-4 or "4+")
 */
function calculateStudentYear(expectedGraduationYear)

/**
 * Calculate qualified rate percentage
 * @param {number} qualifiedCount - Number of qualified applications
 * @param {number} totalCount - Total applications
 * @returns {number} Percentage (0-100)
 */
function calculateQualifiedRate(qualifiedCount, totalCount)

/**
 * Determine trend from percentage change
 * @param {number} percentChange - Percentage change value
 * @returns {string} "increasing" | "stable" | "decreasing"
 */
function determineTrend(percentChange)
```

### Step 2: Create Controller
**File:** `backend/src/controllers/professorController.js`

**Functions to implement:**
```javascript
/**
 * Handle GET /api/professor/analytics/dashboard
 */
async function getDashboard(req, res, next)

/**
 * Handle GET /api/professor/students
 */
async function getStudents(req, res, next)

/**
 * Handle GET /api/professor/students/:studentId
 */
async function getStudentById(req, res, next)
```

**Controller Pattern:**
```javascript
const professorService = require('../services/professorService')

const getDashboard = async (req, res, next) => {
  try {
    const filters = {
      degreeTypeId: req.query.degreeTypeId,
      timePeriod: req.query.timePeriod,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    }
    
    const data = await professorService.getDashboardAnalytics(filters)
    
    res.json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data
    })
  } catch (error) {
    next(error)
  }
}
```

### Step 3: Create Routes
**File:** `backend/src/routes/professorRoutes.js`

```javascript
const express = require('express')
const router = express.Router()
const professorController = require('../controllers/professorController')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { roleMiddleware } = require('../middlewares/roleMiddleware')

// All routes require PROFESSOR or ADMIN role
const professorOrAdmin = [authMiddleware, roleMiddleware(['PROFESSOR', 'ADMIN'])]

router.get('/analytics/dashboard', professorOrAdmin, professorController.getDashboard)
router.get('/students', professorOrAdmin, professorController.getStudents)
router.get('/students/:studentId', professorOrAdmin, professorController.getStudentById)

module.exports = router
```

### Step 4: Register Routes
**File:** `backend/src/app.js`

Add to existing route registrations:
```javascript
const professorRoutes = require('./routes/professorRoutes')

// ... existing routes ...

app.use('/api/professor', professorRoutes)
```

### Step 5: Write Tests
Create comprehensive tests following the test coverage requirements above.

---

## 🎨 Response Formatting Standards

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### Pagination Format
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## 📝 Example Queries & Use Cases

### Use Case 1: Professor views overall dashboard
```
GET /api/professor/analytics/dashboard
```
Shows all students, all applications, overall trends

### Use Case 2: Filter dashboard by degree type
```
GET /api/professor/analytics/dashboard?degreeTypeId=deg_bachelor_eng
```
Shows only Bachelor of Engineering students

### Use Case 3: View last 30 days trends
```
GET /api/professor/analytics/dashboard?timePeriod=last30days
```

### Use Case 4: Search for specific student
```
GET /api/professor/students?search=sunthom
```

### Use Case 5: View only students with applications
```
GET /api/professor/students?hasApplications=true&sortBy=qualifiedRate&order=desc
```

### Use Case 6: Filter by year and status
```
GET /api/professor/students?year=4&status=QUALIFIED
```

### Use Case 7: View student detail
```
GET /api/professor/students/stu_abc123
```

---

## ✅ Definition of Done

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

---

## 🚀 Getting Started

1. **Create feature branch:**
   ```bash
   git switch -c feature/backend/api-professor-feature
   ```

2. **Create service file first** (business logic)
3. **Create controller** (HTTP handling)
4. **Create routes** (endpoint registration)
5. **Register in app.js**
6. **Write tests**
7. **Test manually with Postman/Thunder Client**
8. **Commit and push**

---

## 📚 Reference Documents

- **Constitution:** `/backend/documents/context/constitution.txt`
- **Auth Quick Reference:** `/backend/documents/summary/authorization-and-authentication/QUICK_REFERENCE.md`
- **Job Resume API:** `/backend/documents/summary/JOB_RESUME_API_REFERENCE.md`
- **Prisma Schema:** `/backend/prisma/schema.prisma`

---

**Current Date:** November 1, 2025  
**Feature Branch:** `feature/backend/api-professor-feature`  
**Target Role:** PROFESSOR (+ ADMIN access)
