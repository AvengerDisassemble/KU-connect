# Professor Analytics API Manual Testing Guide

## Prerequisites
- Backend server running on `http://localhost:3000`
- Database with test data (students, applications, jobs)
- Valid JWT tokens for different roles

## Test Users Setup

You need three types of users for testing:
1. **Professor User** - Has PROFESSOR role
2. **Admin User** - Has ADMIN role  
3. **Student User** - Has STUDENT role (for 403 tests)

## Test Endpoints

### 1. Dashboard Analytics Endpoint

**Endpoint:** `GET /api/professor/analytics/dashboard`

#### Test Case 1.1: Professor Access (Success)
```bash
GET http://localhost:3000/api/professor/analytics/dashboard
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with complete dashboard data
- summary (totalStudents, totalApplications, activeJobs, etc.)
- applicationMetrics (byStatus, trends, etc.)
- jobMetrics (byJobType, byLocation, byCompany)
- applicationTrends (daily, monthly)
- degreeTypeBreakdown
- recentActivity

#### Test Case 1.2: Admin Access (Success)
```bash
GET http://localhost:3000/api/professor/analytics/dashboard
Cookie: accessToken=<admin-jwt-token>
```
**Expected:** 200 OK with complete dashboard data

#### Test Case 1.3: Filter by Degree Type
```bash
GET http://localhost:3000/api/professor/analytics/dashboard?degreeTypeId=<valid-degree-type-id>
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with filtered data for specific degree type

#### Test Case 1.4: Filter by Time Period (last30days)
```bash
GET http://localhost:3000/api/professor/analytics/dashboard?timePeriod=last30days
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with data from last 30 days

#### Test Case 1.5: Filter by Time Period (last7days)
```bash
GET http://localhost:3000/api/professor/analytics/dashboard?timePeriod=last7days
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with data from last 7 days

#### Test Case 1.6: Unauthorized Access (Student Role)
```bash
GET http://localhost:3000/api/professor/analytics/dashboard
Cookie: accessToken=<student-jwt-token>
```
**Expected:** 403 Forbidden

#### Test Case 1.7: No Authentication
```bash
GET http://localhost:3000/api/professor/analytics/dashboard
```
**Expected:** 401 Unauthorized

---

### 2. Student List Endpoint

**Endpoint:** `GET /api/professor/students`

#### Test Case 2.1: Basic List (Default Pagination)
```bash
GET http://localhost:3000/api/professor/students
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with paginated student list
- Default page=1, limit=20
- Array of students with basic info
- Pagination metadata

#### Test Case 2.2: Custom Pagination
```bash
GET http://localhost:3000/api/professor/students?page=2&limit=10
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with second page, 10 students per page

#### Test Case 2.3: Filter by Degree Type
```bash
GET http://localhost:3000/api/professor/students?degreeTypeId=<valid-degree-type-id>
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with students of specific degree type only

#### Test Case 2.4: Filter by Year (1-4)
```bash
GET http://localhost:3000/api/professor/students?year=4
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with 4th year students only

#### Test Case 2.5: Filter by Year (4+)
```bash
GET http://localhost:3000/api/professor/students?year=4%2B
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with students in year 4 or beyond graduation

#### Test Case 2.6: Filter by Application Status
```bash
GET http://localhost:3000/api/professor/students?status=QUALIFIED
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with students who have QUALIFIED applications

#### Test Case 2.7: Filter by Has Applications (true)
```bash
GET http://localhost:3000/api/professor/students?hasApplications=true
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with students who have submitted applications

#### Test Case 2.8: Filter by Has Applications (false)
```bash
GET http://localhost:3000/api/professor/students?hasApplications=false
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with students who have NOT submitted applications

#### Test Case 2.9: Search by Name
```bash
GET http://localhost:3000/api/professor/students?search=John
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with students matching "John" in name, surname, or email

#### Test Case 2.10: Sort by Name (Ascending)
```bash
GET http://localhost:3000/api/professor/students?sortBy=name&order=asc
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with students sorted alphabetically A-Z

#### Test Case 2.11: Sort by Name (Descending)
```bash
GET http://localhost:3000/api/professor/students?sortBy=name&order=desc
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with students sorted alphabetically Z-A

#### Test Case 2.12: Sort by Applications (Descending)
```bash
GET http://localhost:3000/api/professor/students?sortBy=applications&order=desc
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with students sorted by application count (highest first)

#### Test Case 2.13: Sort by GPA (Descending)
```bash
GET http://localhost:3000/api/professor/students?sortBy=gpa&order=desc
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with students sorted by GPA (highest first)

#### Test Case 2.14: Combined Filters
```bash
GET http://localhost:3000/api/professor/students?degreeTypeId=<id>&year=4&status=QUALIFIED&sortBy=gpa&order=desc&page=1&limit=10
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with filtered and sorted results

#### Test Case 2.15: Admin Access
```bash
GET http://localhost:3000/api/professor/students
Cookie: accessToken=<admin-jwt-token>
```
**Expected:** 200 OK with student list

#### Test Case 2.16: Unauthorized (Student Role)
```bash
GET http://localhost:3000/api/professor/students
Cookie: accessToken=<student-jwt-token>
```
**Expected:** 403 Forbidden

#### Test Case 2.17: No Authentication
```bash
GET http://localhost:3000/api/professor/students
```
**Expected:** 401 Unauthorized

---

### 3. Student Detail Endpoint

**Endpoint:** `GET /api/professor/students/:studentId`

#### Test Case 3.1: Get Student Detail (Professor)
```bash
GET http://localhost:3000/api/professor/students/<valid-student-id>
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 200 OK with complete student profile
- personalInfo (name, email, phone, avatar)
- academicInfo (degreeType, currentYear, GPA, expectedGraduation, documents)
- applicationStatistics (total, byStatus, qualifiedRate)
- jobPreferences (preferred locations, types)
- applicationHistory (array of applications with job details)
- interestedJobs (array of jobs student is interested in)

#### Test Case 3.2: Verify No Sensitive Data
```bash
GET http://localhost:3000/api/professor/students/<valid-student-id>
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** Response should NOT contain:
- password
- refreshToken
- resumeKey (should be hasResume boolean instead)
- transcriptKey (should be hasTranscript boolean instead)
- verificationDocKey (should be hasVerificationDoc boolean instead)

#### Test Case 3.3: Get Student Detail (Admin)
```bash
GET http://localhost:3000/api/professor/students/<valid-student-id>
Cookie: accessToken=<admin-jwt-token>
```
**Expected:** 200 OK with complete student profile

#### Test Case 3.4: Non-existent Student
```bash
GET http://localhost:3000/api/professor/students/nonexistent123
Cookie: accessToken=<professor-jwt-token>
```
**Expected:** 404 Not Found

#### Test Case 3.5: Unauthorized (Student Role)
```bash
GET http://localhost:3000/api/professor/students/<valid-student-id>
Cookie: accessToken=<student-jwt-token>
```
**Expected:** 403 Forbidden

#### Test Case 3.6: No Authentication
```bash
GET http://localhost:3000/api/professor/students/<valid-student-id>
```
**Expected:** 401 Unauthorized

---

## Data Validation Checklist

After testing all endpoints, verify:

### Dashboard Data Structure
- [ ] Summary metrics include all required fields
- [ ] Application metrics correctly categorize by status (PENDING, QUALIFIED, REJECTED)
- [ ] Job metrics correctly group by type, location, and company
- [ ] Trends show proper date ranges and counts
- [ ] Degree type breakdown matches database data
- [ ] Recent activity shows latest applications

### Student List Data Structure
- [ ] Each student has name, email, degree type, year, GPA
- [ ] Year is calculated correctly (1-4 or "4+")
- [ ] Application stats show correct counts
- [ ] Pagination metadata matches actual results
- [ ] Sorting works correctly for all sortBy options
- [ ] Filters correctly narrow down results

### Student Detail Data Structure
- [ ] Personal info is complete (name, email, optional phone/avatar)
- [ ] Academic info includes all fields
- [ ] Application statistics are accurate
- [ ] Job preferences reflect actual student preferences
- [ ] Application history is sorted by date (newest first)
- [ ] Interested jobs list is complete
- [ ] Document flags (hasResume, hasTranscript) are accurate

### Security Validation
- [ ] Professor role can access all endpoints
- [ ] Admin role can access all endpoints
- [ ] Student role is blocked (403)
- [ ] Unauthenticated requests are blocked (401)
- [ ] No sensitive data exposed (passwords, tokens, document keys)

### Performance Validation
- [ ] Dashboard loads in < 2 seconds
- [ ] Student list loads in < 1 second
- [ ] Student detail loads in < 500ms
- [ ] Pagination performs efficiently with large datasets
- [ ] Filters don't cause timeouts

---

## Testing Tools

### Recommended Tools:
1. **Postman** - Visual HTTP client with environment variables
2. **Thunder Client** (VS Code extension) - Lightweight REST client
3. **curl** - Command-line testing
4. **REST Client** (VS Code extension) - Test directly from .http files

### Example REST Client File (test-professor-api.http):
```http
### Variables
@baseUrl = http://localhost:3000/api/professor
@professorToken = <your-professor-token>

### Dashboard - Basic
GET {{baseUrl}}/analytics/dashboard HTTP/1.1
Cookie: accessToken={{professorToken}}

### Dashboard - Filtered
GET {{baseUrl}}/analytics/dashboard?degreeTypeId=<degree-id>&timePeriod=last30days HTTP/1.1
Cookie: accessToken={{professorToken}}

### Students - List
GET {{baseUrl}}/students HTTP/1.1
Cookie: accessToken={{professorToken}}

### Students - Detail
GET {{baseUrl}}/students/<student-id> HTTP/1.1
Cookie: accessToken={{professorToken}}
```

---

## Test Results Documentation

For each test case, document:
- ✅ Pass / ❌ Fail
- Response time
- Response status code
- Any unexpected behavior
- Screenshots/logs if applicable

**Test Date:** __________
**Tester:** __________
**Environment:** __________
