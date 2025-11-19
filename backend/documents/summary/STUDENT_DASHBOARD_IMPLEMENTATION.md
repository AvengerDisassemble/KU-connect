# Student Dashboard Feature - Implementation Summary

## Overview
Complete backend implementation for student job preferences and personalized dashboard with job recommendations, application statistics, and recent activity.

## Changes Made

### 1. Database Schema (Prisma)
**File:** `prisma/schema.prisma`

Added `StudentPreference` model:
- 1:1 relationship with `Student`
- Fields: `id`, `studentId`, `desiredLocation`, `minSalary`, `currency`, `payPeriod`, `remoteWork`, `createdAt`, `updatedAt`
- Back-relation added to `Student` model: `preference StudentPreference?`

**Migration:** `20251105084343_add_student_preference`
- Ran successfully with Prisma generate

### 2. Service Layer

#### `src/services/studentPreferenceService.js`
- `getPreferenceByUserId(userId)` - Retrieves student preferences
- `upsertPreferenceByUserId(userId, data)` - Creates or updates preferences
- Uses PrismaClient from `../generated/prisma`
- Validates student existence and throws meaningful errors

#### `src/services/studentRecommendationService.js`
- `getRecommendedJobsForStudent(userId, limit = 10)` - Gets recommended jobs
- Loads student with preference data
- Computes `preferredLocation = preference?.desiredLocation || student.address`
- Filters jobs by location (case-insensitive) and active deadline
- Returns jobs with: `id`, `title`, `location`, `application_deadline`, `hr.companyName`
- Orders by `id DESC` with limit

### 3. Controller Layer

#### `src/controllers/studentPreferencesController.js`
- `getPreferences` - GET endpoint wrapped with `asyncErrorHandler`
  - Retrieves preferences for authenticated student
  - Returns: `{ success: true, data: preference }`
  
- `upsertPreferences` - PUT endpoint wrapped with `asyncErrorHandler`
  - Accepts: `desiredLocation`, `minSalary`, `currency`, `payPeriod`, `remoteWork`
  - Returns: `{ success: true, message: 'Preferences saved', data: preference }`

#### `src/controllers/profileController.js` (extended)
- Added `getDashboardData` function wrapped with `asyncErrorHandler`
- **UPDATED**: Now handles both `STUDENT` and `EMPLOYER` roles
- Parallel queries using `Promise.all`:
  1. `recentJobs` - Last 5 jobs with HR company name
  2. `myApplications` - Last 5 applications with job details
  3. `recommendedJobs` - Calls recommendation service (10 jobs)
  4. `totalJobs` - Count of all jobs
  5. `applicationStats` - Grouped by status using `prisma.application.groupBy`
- Transforms stats into: `{ total, submitted, qualified, rejected, hired }`
- Returns complete dashboard object with timestamp

### 4. Routes

#### `src/routes/students/preferences.js`
```javascript
// GET /api/students/preferences - Get preferences (STUDENT only)
// PUT /api/students/preferences - Upsert preferences (STUDENT only + rate limited)
```
- All routes require authentication (`authMiddleware`)
- Role middleware enforces `STUDENT` role
- Rate limiter: 30 requests per 15 minutes on PUT

#### `src/routes/profile.js`
```javascript
// GET /api/profile/dashboard - Get dashboard data (authenticated)
```
- Requires authentication
- Returns full dashboard for students

### 5. Auto-Registration
Routes are automatically registered by `src/routes/index.js`:
- `/api/students/preferences` → preferences routes
- `/api/profile` → profile routes (dashboard)

## API Endpoints

### PUT /api/students/preferences
- **Auth:** Required (STUDENT role)
- **Rate Limit:** 30 req/15min
- **Body:**
  ```json
  {
    "desiredLocation": "Bangkok",
    "minSalary": 30000,
    "currency": "THB",
    "payPeriod": "monthly",
    "remoteWork": "hybrid"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Preferences saved",
    "data": { ...preference }
  }
  ```

### GET /api/students/preferences
- **Auth:** Required (STUDENT role)
- **Response:**
  ```json
  {
    "success": true,
    "data": { ...preference } | null
  }
  ```

### GET /api/profile/dashboard
- **Auth:** Required (STUDENT role)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Student dashboard retrieved",
    "data": {
      "userRole": "STUDENT",
      "dashboard": {
        "totals": { "jobs": 10 },
        "applicationStats": {
          "total": 5,
          "submitted": 2,
          "qualified": 2,
          "rejected": 1,
          "hired": 0
        },
        "recentJobs": [...],
        "myApplications": [...],
        "recommendedJobs": [...],
        "quickActions": [
          "Browse Jobs",
          "Update Preferences",
          "Upload Resume",
          "View Applications"
        ]
      },
      "timestamp": "2025-11-05T08:43:00.000Z"
    }
  }
  ```

## Testing

See `STUDENT_DASHBOARD_VERIFICATION.js` for detailed testing instructions.

### Quick Test Flow:
1. Login as student: `student1@ku.ac.th` / `password123`
2. PUT preferences with location
3. GET preferences to verify
4. GET dashboard to see recommendations
5. Verify recommendations filter by location

## Acceptance Criteria

✅ Migration runs without errors  
✅ Student can save and retrieve preferences  
✅ Dashboard returns all 5 sections (stats, totals, recent, applications, recommendations)  
✅ Recommendations filter by `desiredLocation` when set  
✅ Application stats correctly group by status  
✅ All endpoints require authentication  
✅ Preferences endpoints require STUDENT role  
✅ Rate limiting works on PUT preferences (30/15min)  
✅ No changes to deprecated user-profile.js router  
✅ Follows existing codebase patterns (asyncErrorHandler, Prisma from generated)  
✅ Error handling follows jobController pattern  
✅ CommonJS modules used throughout  

## Files Created/Modified

### Created:
- `prisma/migrations/20251105084343_add_student_preference/migration.sql`
- `src/services/studentPreferenceService.js`
- `src/services/studentRecommendationService.js`
- `src/controllers/studentPreferencesController.js`
- `src/routes/students/preferences.js`
- `src/routes/profile.js`
- `STUDENT_DASHBOARD_VERIFICATION.js`

### Modified:
- `prisma/schema.prisma` - Added StudentPreference model
- `src/controllers/profileController.js` - Added getDashboardData function

## Notes

- Uses case-insensitive location matching in SQLite (mode: 'insensitive')
- Fallback to `student.address` if no preference location set
- Dashboard currently only supports STUDENT role (403 for others)
- Rate limiting prevents abuse of preference updates
- All async operations wrapped with `asyncErrorHandler`
- Follows existing error handling patterns with status codes
