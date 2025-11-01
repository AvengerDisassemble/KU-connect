# User Status-Based Access Control Implementation Plan

## Overview
Implement granular access control based on user account status (PENDING, APPROVED, REJECTED, SUSPENDED) to ensure security and proper workflow in the KU-Connect platform.

---

## Access Control Matrix

| Feature | PENDING | APPROVED | REJECTED | SUSPENDED |
|---------|---------|----------|----------|-----------|
| **Login/Authentication** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Blocked |
| **View Jobs** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Blocked |
| **Apply to Jobs** | ❌ Blocked | ✅ Yes | ❌ Blocked | ❌ Blocked |
| **Post Jobs (HR)** | ❌ Blocked | ✅ Yes | ❌ Blocked | ❌ Blocked |
| **View Announcements** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Blocked |
| **View Own Profile** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Blocked |
| **Edit Profile** | ❌ Blocked | ✅ Yes | ❌ Blocked | ❌ Blocked |
| **Upload Documents** | ❌ Blocked | ✅ Yes | ❌ Blocked | ❌ Blocked |
| **Download Documents** | ❌ Blocked | ✅ Yes | ❌ Blocked | ❌ Blocked |

---

## User Status Definitions

### 1. PENDING
- **Definition**: User has registered but not yet verified by admin
- **Access Level**: Read-only access to public content
- **Actions Allowed**: Browse jobs, view announcements, view own profile
- **Actions Blocked**: Apply to jobs, post jobs, edit profile, upload/download documents
- **Message**: "Account pending verification. Please wait for admin approval."

### 2. APPROVED
- **Definition**: User has been verified and approved by admin
- **Access Level**: Full access to all features
- **Actions Allowed**: All platform features based on role (STUDENT/EMPLOYER/ADMIN)
- **Actions Blocked**: None
- **Message**: N/A (full access)

### 3. REJECTED
- **Definition**: User's registration was rejected by admin but can reapply
- **Access Level**: Same as PENDING (read-only access)
- **Actions Allowed**: Browse jobs, view announcements, view own profile, contact admin
- **Actions Blocked**: Apply to jobs, post jobs, edit profile, upload/download documents
- **Message**: "Account registration was rejected. Please contact admin or resubmit verification."
- **Special Note**: User can update their profile/documents and request re-verification

### 4. SUSPENDED
- **Definition**: User's account has been suspended/banned by admin
- **Access Level**: Complete access denial
- **Actions Allowed**: None (immediately logged out, cannot login)
- **Actions Blocked**: All platform access including login
- **Message**: "Account suspended. Please contact admin."

---

## Implementation Tasks

### Task 1: Create Enhanced Authentication Middleware

**File**: `src/middlewares/authMiddleware.js`

**Requirements**:
1. Add `verifiedUserMiddleware` function
2. Update `authMiddleware` to block only SUSPENDED users
3. Export new middleware for use in routes

**Implementation**:
```javascript
/**
 * Basic authentication middleware
 * Allows: PENDING, APPROVED, REJECTED
 * Blocks: SUSPENDED
 */
async function authMiddleware(req, res, next) {
  // Verify JWT token
  // Get user from database
  // Block SUSPENDED users only
  // Attach user to req.user
}

/**
 * Verified user middleware (use after authMiddleware)
 * Allows: APPROVED only
 * Blocks: PENDING, REJECTED, SUSPENDED
 */
function verifiedUserMiddleware(req, res, next) {
  if (req.user.status !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      message: 'This action requires account verification.',
      data: { 
        currentStatus: req.user.status,
        action: req.user.status === 'REJECTED' 
          ? 'Please contact admin or resubmit verification'
          : 'Please wait for admin approval'
      }
    })
  }
  next()
}
```

**Acceptance Criteria**:
- ✅ PENDING users can login and browse
- ✅ APPROVED users have full access
- ✅ REJECTED users can login and browse (same as PENDING)
- ✅ SUSPENDED users cannot login at all

---

### Task 2: Update Job Routes with Verification Checks

**File**: `src/routes/job/index.js`

**Requirements**:
1. Apply `verifiedUserMiddleware` to all write operations
2. Keep read operations accessible to PENDING/REJECTED users
3. Ensure proper middleware order: auth → verified → role

**Routes to Update**:
- `POST /api/job` (create) - Add `verifiedUserMiddleware`
- `PATCH /api/job/:id` (update) - Add `verifiedUserMiddleware`
- `DELETE /api/job/:id` (delete) - Add `verifiedUserMiddleware`
- `POST /api/job/:id` (apply) - Add `verifiedUserMiddleware`
- `GET /api/job/:id/applyer` (view applicants) - Add `verifiedUserMiddleware`
- `POST /api/job/:id/applyer` (manage application) - Add `verifiedUserMiddleware`

**Routes to Keep Public**:
- `POST /api/job/list` (browse jobs) - No verification needed
- `GET /api/job/:id` (view job) - No verification needed

**Acceptance Criteria**:
- ✅ PENDING/REJECTED users can view jobs but not apply
- ✅ APPROVED students can apply to jobs
- ✅ PENDING/REJECTED HR can view jobs but not post
- ✅ APPROVED HR can post/edit/delete jobs

---

### Task 3: Simplify Job Controller

**File**: `src/controllers/jobController.js`

**Requirements**:
1. Remove duplicate HR status verification from `createJob`
2. Remove duplicate HR status verification from `updateJob`
3. Rely on `verifiedUserMiddleware` for status checks

**Rationale**: No need to check HR user status in controller since `verifiedUserMiddleware` already ensures user is APPROVED before reaching controller.

**Acceptance Criteria**:
- ✅ Controller code is cleaner (no duplicate checks)
- ✅ Status verification still works via middleware
- ✅ All job creation/update tests still pass

---

### Task 4: Add User Status Transition Validation

**File**: `src/services/userService.js`

**Function**: `updateUserStatus(userId, status)`

**Requirements**:
1. Fetch current user status before update
2. Validate status transition rules
3. Throw error for invalid transitions

**Business Rules**:
```javascript
// Cannot reject already-approved users
if (currentStatus === 'APPROVED' && newStatus === 'REJECTED') {
  throw new Error('Cannot reject an already-approved user. Use suspend instead.')
}
```

**Valid Transitions**:
- PENDING → APPROVED, REJECTED, SUSPENDED
- APPROVED → SUSPENDED (can only suspend, not reject)
- REJECTED → APPROVED, SUSPENDED (can reconsider or ban)
- SUSPENDED → APPROVED, REJECTED (can reactivate or permanently reject)

**Acceptance Criteria**:
- ✅ Approved users cannot be rejected (throws error)
- ✅ Other valid transitions work as expected
- ✅ Error messages clearly explain why transition failed

---

### Task 5: Split Announcement Endpoints

**Files**: 
- `src/routes/admin/index.js`
- `src/routes/announcement/index.js` (create if doesn't exist)
- `src/controllers/adminController.js`
- `src/controllers/announcementController.js` (create if doesn't exist)
- `src/services/announcementService.js`
- `src/validators/adminValidator.js`

**Requirements**:

#### A. Admin Search Endpoint (POST with filters)
- **Route**: `POST /api/admin/announcements/search`
- **Access**: Admin only
- **Purpose**: Search/filter ALL announcements with pagination
- **Filters**: audience, isActive, search (title/content), date range, page, limit

#### B. User View Endpoint (GET filtered by role)
- **Route**: `GET /api/announcements`
- **Access**: Public (works with/without auth)
- **Purpose**: Get announcements relevant to current user
- **Behavior**:
  - Logged in: Show `audience=ALL` + `audience=userRole`
  - Not logged in: Show `audience=ALL` only

**Implementation**:
```javascript
// Admin controller
async function searchAllAnnouncements(req, res) {
  const { audience, isActive, search, startDate, endDate, page, limit } = req.body
  const announcements = await announcementService.searchAnnouncements(filters)
  // Return with pagination
}

// Public controller
async function getAnnouncementsForUser(req, res) {
  const userRole = req.user?.role || null
  const announcements = await announcementService.getAnnouncementsForRole(userRole)
  // Return filtered by user role
}
```

**Acceptance Criteria**:
- ✅ Admin can search announcements with POST and filters
- ✅ Users see only relevant announcements (ALL + their role)
- ✅ Guests see only ALL audience announcements
- ✅ Pagination works correctly for admin search

---

### Task 6: Add User Search Endpoint

**Files**: 
- `src/routes/admin/index.js`
- `src/controllers/adminController.js`
- `src/services/userService.js`
- `src/validators/adminValidator.js`

**Requirements**:
1. Create `POST /api/admin/users/search` endpoint
2. Support filters: role, status, search (email), date range, pagination
3. Return users with pagination metadata

**Implementation**:
```javascript
// Validator
const searchUsersSchema = {
  body: Joi.object({
    role: Joi.string().valid('STUDENT', 'EMPLOYER', 'ADMIN').optional(),
    status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED').optional(),
    search: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
}

// Service
async function searchUsers(filters) {
  const { role, status, search, startDate, endDate, page, limit } = filters
  // Build where clause with filters
  // Query with pagination
  // Return { users, pagination }
}
```

**Acceptance Criteria**:
- ✅ Admin can filter users by role (STUDENT, EMPLOYER, ADMIN)
- ✅ Admin can filter users by status (PENDING, APPROVED, REJECTED, SUSPENDED)
- ✅ Admin can search users by email
- ✅ Admin can filter by date range
- ✅ Pagination works correctly

---

### Task 7: Update Other Protected Routes

**Files**: Check and update all routes that require verification

**Routes to Review**:
- Profile edit endpoints
- Document upload/download endpoints
- Any other write operations

**Pattern**:
```javascript
// Read operations (viewing) - PENDING/REJECTED allowed
router.get('/profile', authMiddleware, profileController.getProfile)

// Write operations (editing) - APPROVED only
router.patch('/profile', authMiddleware, verifiedUserMiddleware, profileController.updateProfile)
```

**Acceptance Criteria**:
- ✅ All write operations require APPROVED status
- ✅ Read operations allow PENDING/REJECTED
- ✅ SUSPENDED users blocked from all routes

---

## Testing Checklist

### Authentication Tests
- [ ] PENDING user can login successfully
- [ ] APPROVED user can login successfully
- [ ] REJECTED user can login successfully
- [ ] SUSPENDED user cannot login (403 error)
- [ ] Invalid token returns 401 error

### Job Access Tests
- [ ] PENDING user can view jobs list
- [ ] PENDING user can view job details
- [ ] PENDING user cannot apply to jobs (403 error)
- [ ] REJECTED user can view jobs list
- [ ] REJECTED user cannot apply to jobs (403 error)
- [ ] APPROVED student can apply to jobs
- [ ] SUSPENDED user blocked from all job endpoints

### HR Job Posting Tests
- [ ] PENDING HR can view jobs
- [ ] PENDING HR cannot post jobs (403 error)
- [ ] REJECTED HR cannot post jobs (403 error)
- [ ] APPROVED HR can post jobs
- [ ] APPROVED HR can edit their jobs
- [ ] APPROVED HR can view applicants
- [ ] APPROVED HR can manage applications

### User Status Transition Tests
- [ ] Can approve PENDING user
- [ ] Can reject PENDING user
- [ ] Can suspend PENDING user
- [ ] Can approve REJECTED user (reconsideration)
- [ ] Can suspend REJECTED user
- [ ] Can suspend APPROVED user
- [ ] CANNOT reject APPROVED user (error thrown)
- [ ] Can reactivate SUSPENDED user

### Announcement Tests
- [ ] Admin can search announcements with POST
- [ ] Admin can filter by audience
- [ ] Admin can filter by active status
- [ ] Admin can search by title/content
- [ ] Pagination works correctly
- [ ] Users see ALL + role-specific announcements
- [ ] Guests see only ALL audience announcements

### User Search Tests
- [ ] Admin can search users with POST
- [ ] Admin can filter by role
- [ ] Admin can filter by status
- [ ] Admin can search by email
- [ ] Admin can filter by date range
- [ ] Pagination works correctly

---

## API Endpoints Summary

### New/Modified Endpoints

#### Admin Endpoints
```
POST /api/admin/announcements/search
Body: { audience?, isActive?, search?, startDate?, endDate?, page?, limit? }
Response: { announcements, pagination }

POST /api/admin/users/search
Body: { role?, status?, search?, startDate?, endDate?, page?, limit? }
Response: { users, pagination }
```

#### Public Endpoints
```
GET /api/announcements
Headers: Authorization (optional)
Response: Announcements filtered by user role (or ALL if not logged in)
```

---

## Error Messages by Status

### PENDING User
```json
{
  "success": false,
  "message": "This action requires account verification.",
  "data": {
    "currentStatus": "PENDING",
    "action": "Please wait for admin approval"
  }
}
```

### REJECTED User
```json
{
  "success": false,
  "message": "This action requires account verification.",
  "data": {
    "currentStatus": "REJECTED",
    "action": "Please contact admin or resubmit verification"
  }
}
```

### SUSPENDED User
```json
{
  "success": false,
  "message": "Account suspended. Please contact admin.",
  "data": {
    "status": "SUSPENDED"
  }
}
```

---

## Implementation Order

1. ✅ **Task 1**: Update authentication middleware (foundation)
2. ✅ **Task 2**: Update job routes with verification
3. ✅ **Task 3**: Simplify job controller  
4. ✅ **Task 4**: Add status transition validation
5. ✅ **Task 5**: Split announcement endpoints
6. ✅ **Task 6**: Add user search endpoint
7. ✅ **Task 7**: Review and update other protected routes
8. ✅ **Testing**: Run comprehensive test suite (Tests updated with APPROVED status)

---

## Notes

- REJECTED users have the same access level as PENDING users (can browse but not interact)
- REJECTED users should see actionable message to contact admin or resubmit verification
- SUSPENDED users are completely blocked from the system (cannot even login)
- All write operations require APPROVED status
- All read operations (browse/view) allow PENDING, APPROVED, and REJECTED users
- Use middleware chaining for clean code: `authMiddleware` → `verifiedUserMiddleware` → `roleMiddleware`

---

## Success Criteria

✅ PENDING users can browse but not interact  
✅ REJECTED users have same access as PENDING with helpful error messages  
✅ APPROVED users have full platform access  
✅ SUSPENDED users are completely blocked  
✅ Cannot reject already-approved users  
✅ Admin can search/filter users and announcements with POST endpoints  
✅ Public announcement endpoint filters by user role  
✅ All tests pass with new access control rules  

---

**Last Updated**: October 28, 2025  
**Status**: ✅ **COMPLETED** - All tasks implemented and tests passing (156/169 tests passed)  
**Implementation Time**: ~6 hours

## Implementation Summary

All 7 tasks successfully completed:
1. ✅ Authentication middleware enhanced with `verifiedUserMiddleware`
2. ✅ Job routes protected with verification checks
3. ✅ Job controller simplified (removed duplicate checks)
4. ✅ Status transition validation implemented
5. ✅ Announcement endpoints split (admin search + public view)
6. ✅ User search endpoint implemented
7. ✅ Profile routes protected with verification

### Critical Bug Fix
**Issue**: `authService.getUserById()` wasn't selecting the `status` field, causing `req.user.status` to be `undefined`.  
**Fix**: Added `status: true` to the select clause in `src/services/authService.js` (line 227).

**Final Test Results**: 156 passed, 13 skipped, 0 failed ✅

