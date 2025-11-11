# Backend Test Failures - Debug Analysis and Fix Plan

**Date**: October 26, 2025  
**Test Run**: Backend Test Suite  
**Status**: 19 tests failed out of 201 total tests

---

## Executive Summary

The backend test suite has **19 failing tests** across 2 test files:

1. **Job Document Controller Tests** (17 failures) - `tests/controllers/jobDocumentController.test.js`
2. **Job Routes Integration Tests** (2 failures) - `tests/src/routes/job/job.routes.test.js`

All failures stem from **schema validation errors** related to the `Job` and `Resume` models after recent schema migrations.

---

## Problem 1: Job Document Controller Tests (17 failures)

### Root Cause

**Missing Required Field**: The `Job` model in `schema.prisma` has a **required field `companyName`** (line 177), but all test cases are creating Job records **without** providing this field.

### Error Details

```
PrismaClientValidationError:
Invalid `prisma.job.create()` invocation
Argument `companyName` is missing.
```

### Affected Tests

All 17 tests in `tests/controllers/jobDocumentController.test.js` that create Job records:

- GET /api/jobs/:jobId/resume/:studentUserId/download - Download job resume
  - "should return 404 when no resume exists"
  - "should return 404 when student has no resume for this job"
  - "should download resume successfully"
  - "should return 403 when accessing another student's resume (non-owner, non-HR)"
  - "should allow HR who owns the job to download resume"
  - "should return 403 when HR tries to download resume from job they don't own"
  - "should return 403 for professors"
- GET /api/jobs/:jobId/resume/:studentUserId - Get job resume metadata
  - Similar test failures (10 tests total)

### Current Test Code (Line ~189)

```javascript
const job = await prisma.job.create({
  data: {
    hrId: hr.hr.id,
    title: "Software Engineer",
    description: "Test job description",
    location: "Remote",
    application_deadline: new Date("2025-12-31"),
    email: "jobs@test.com",
    phone_number: "123-456-7890",
    other_contact_information: "LinkedIn",
    requirements: "Bachelor degree",
    // ❌ Missing: companyName
  },
});
```

### Schema Definition (schema.prisma lines 174-178)

```prisma
model Job {
  id                        String            @id @default(cuid())
  hrId                      String
  hr                        HR                @relation(fields: [hrId], references: [id])
  title                     String
  companyName               String            // ⚠️ REQUIRED field
  description               String
  location                  String
  // ... other fields
}
```

---

## Problem 2: Job Routes Integration Tests (2 failures)

### Root Cause

**Cascading Schema Issues**: The `applyToJob` service function creates a `Resume` record, but the Resume model has a `@@unique([studentId, jobId])` constraint and **requires `jobId`** to be provided. However, the current implementation in `jobService.js` (line 320-326) creates the Resume **without** the `jobId`:

```javascript
async function applyToJob(jobId, studentId, resumeLink) {
  // create a Resume record for traceability (optional in your schema)
  const resume = await prisma.resume.create({
    data: {
      studentId,
      link: resumeLink,
      // ❌ Missing: jobId (required for unique constraint)
    },
  });
  // ...
}
```

### Error Details

Tests expect status codes **201** and **409** but receive **500** (Internal Server Error):

```
expect(received).toBe(expected) // Object.is equality
Expected: 201
Received: 500
```

### Affected Tests

1. **POST /api/job/:id › should allow Student to apply** (Line 383)
   - Expected: 201 Created
   - Received: 500 Internal Server Error

2. **POST /api/job/:id › should reject duplicate application** (Line 408)
   - Expected: 409 Conflict
   - Received: 500 Internal Server Error

### Schema Definition (schema.prisma lines 277-286)

```prisma
model Resume {
  @@unique([studentId, jobId])              // ⚠️ Unique constraint requires jobId
  id           String        @id @default(cuid())
  studentId    String
  link         String
  student      Student       @relation(fields: [studentId], references: [id], onDelete: Cascade)
  applications Application[]
  jobId        String                        // ⚠️ Required field
  job          Job           @relation(fields: [jobId], references: [id], onDelete: Cascade)
  source       ResumeSource  @default(UPLOADED)
}
```

---

## Root Cause Analysis

### Schema Evolution Issue

The failures indicate a **schema migration mismatch** between:

1. **Database schema** (Prisma schema.prisma) - Updated with required fields
2. **Test fixtures and service code** - Not updated to match new schema requirements

### Contributing Factors

1. **Missing Field in Test Data**: Test fixtures weren't updated when `companyName` was added as a required field to the `Job` model
2. **Incomplete Service Implementation**: The `applyToJob` service creates Resume records without the required `jobId` field
3. **Lack of Schema Validation in Development**: Tests weren't run after schema changes, allowing incompatibilities to persist

---

## Fix Plan

### Phase 1: Fix Job Document Controller Tests (Priority: HIGH)

#### Step 1.1: Update Test Fixtures

**File**: `tests/controllers/jobDocumentController.test.js`  
**Lines**: ~189-200

**Action**: Add `companyName` field to all Job creation statements

```javascript
const job = await prisma.job.create({
  data: {
    hrId: hr.hr.id,
    title: "Software Engineer",
    companyName: "Test Company Inc.", // ✅ ADD THIS
    description: "Test job description",
    location: "Remote",
    application_deadline: new Date("2025-12-31"),
    email: "jobs@test.com",
    phone_number: "123-456-7890",
    other_contact_information: "LinkedIn",
    requirements: "Bachelor degree",
  },
});
```

**Estimated Impact**: Fixes all 17 failing tests in this file

---

### Phase 2: Fix Job Application Service (Priority: HIGH)

#### Step 2.1: Update `applyToJob` Service Function

**File**: `src/services/jobService.js`  
**Lines**: ~319-326

**Action**: Add `jobId` to Resume creation

```javascript
async function applyToJob(jobId, studentId, resumeLink) {
  // create a Resume record for traceability (optional in your schema)
  const resume = await prisma.resume.create({
    data: {
      studentId,
      jobId, // ✅ ADD THIS
      link: resumeLink,
    },
  });

  try {
    return await prisma.application.create({
      data: {
        jobId,
        studentId,
        resumeId: resume.id,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      const err = new Error("Already applied to this job");
      err.status = 409;
      throw err;
    }
    throw error;
  }
}
```

**Estimated Impact**: Fixes 2 failing tests in job.routes.test.js

---

### Phase 3: Comprehensive Testing Strategy

#### Step 3.1: Search for All Job Creation Instances

**Command**:

```bash
grep -r "prisma.job.create" tests/
```

**Action**: Verify all test files creating Job records include `companyName`

#### Step 3.2: Search for All Resume Creation Instances

**Command**:

```bash
grep -r "prisma.resume.create" src/ tests/
```

**Action**: Verify all Resume creation includes `jobId`

#### Step 3.3: Run Full Test Suite

```bash
npm test
```

**Expected Outcome**: All 201 tests passing

---

### Phase 4: Prevention Measures (Recommended)

#### Step 4.1: Add Schema Validation Hook

**File**: `package.json` (scripts section)

**Action**: Add pre-test schema validation:

```json
{
  "scripts": {
    "pretest": "npx prisma validate",
    "test": "jest"
  }
}
```

#### Step 4.2: Create Test Factories

**New File**: `tests/factories/jobFactory.js`

**Action**: Centralize test data creation with default values:

```javascript
async function createTestJob(prisma, overrides = {}) {
  return await prisma.job.create({
    data: {
      title: "Test Job",
      companyName: "Test Company",
      description: "Test description",
      location: "Remote",
      application_deadline: new Date("2025-12-31"),
      email: "test@test.com",
      phone_number: "123-456-7890",
      requirements: "Test requirements",
      ...overrides, // Allow customization
    },
  });
}
```

**Benefits**:

- Single source of truth for test data
- Automatically includes all required fields
- Easy to update when schema changes

#### Step 4.3: Update Development Documentation

**File**: `backend/TESTING_GUIDE.md` (create if doesn't exist)

**Action**: Document the requirement to:

1. Run tests after schema migrations
2. Update test fixtures when adding required fields
3. Use test factories for consistent test data

---

## Implementation Checklist

- [ ] **Phase 1**: Fix `jobDocumentController.test.js` - Add `companyName` to Job creation
- [ ] **Phase 2**: Fix `jobService.js` - Add `jobId` to Resume creation
- [ ] **Phase 3.1**: Search and verify all Job creation statements
- [ ] **Phase 3.2**: Search and verify all Resume creation statements
- [ ] **Phase 3.3**: Run full test suite and verify all tests pass
- [ ] **Phase 4.1**: Add pre-test validation hook
- [ ] **Phase 4.2**: Create test factory utilities
- [ ] **Phase 4.3**: Document testing best practices

---

## Success Criteria

1. ✅ All 201 tests pass
2. ✅ No PrismaClientValidationError exceptions
3. ✅ HTTP status codes match expected values (201, 404, 403, 409)
4. ✅ Test execution time remains under 150 seconds
5. ✅ No console errors or warnings during test run

---

## Risk Assessment

| Risk                             | Impact | Mitigation                                   |
| -------------------------------- | ------ | -------------------------------------------- |
| Breaking existing functionality  | Medium | Run full test suite after each change        |
| Database constraint violations   | High   | Verify unique constraints in Resume model    |
| Missing other required fields    | Medium | Perform comprehensive grep search            |
| Production data migration issues | Low    | This affects tests only, not production data |

---

## Timeline Estimate

- **Phase 1**: 15 minutes
- **Phase 2**: 10 minutes
- **Phase 3**: 20 minutes
- **Phase 4**: 30 minutes (optional, for prevention)

**Total Critical Path**: ~25 minutes  
**Total with Prevention**: ~75 minutes

---

## Notes

1. The schema appears to have been updated recently (likely around October 21, 2025 based on migration `20251021023702_add_job_resume_unique_and_source`)
2. The `@@unique([studentId, jobId])` constraint on Resume model suggests business logic: one resume per student per job
3. Consider whether `companyName` should be pulled from the `HR.companyName` field automatically rather than stored separately in Job records
4. The `ResumeSource` enum (PROFILE, UPLOADED) suggests multiple resume sources - ensure this is handled correctly in the application logic

---

## References

- Schema file: `backend/prisma/schema.prisma`
- Failed test files:
  - `backend/tests/controllers/jobDocumentController.test.js`
  - `backend/tests/src/routes/job/job.routes.test.js`
- Service implementation: `backend/src/services/jobService.js`
- Controller implementation: `backend/src/controllers/jobController.js`
