# Authorization Example Implementation

## Overview

This implementation demonstrates role-based authorization in the KU Connect platform. It shows how different user types receive different data and access levels based on their roles.

## New API Endpoints

### 1. User Profile with Role Detection

**`GET /api/user-profile/me`**

- **Purpose**: Detect user type and return role-specific profile data
- **Authentication**: Required (JWT token)
- **Authorization**: All authenticated users

**Response Example for Student:**

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John",
      "surname": "Student",
      "email": "john@university.edu",
      "role": "STUDENT",
      "verified": false
    },
    "roleData": {
      "studentId": 1,
      "address": "123 Student St",
      "gpa": 3.5,
      "degreeType": "Computer Science",
      "totalInterests": 5,
      "totalApplications": 3
    },
    "capabilities": [
      "view_jobs",
      "apply_to_jobs",
      "manage_profile",
      "upload_resume",
      "track_applications"
    ],
    "recommendedDashboard": "/student/dashboard",
    "userType": {
      "role": "STUDENT",
      "description": "Student or Alumni - Can browse and apply for jobs",
      "permissions": ["read:jobs", "create:application", "update:profile"]
    }
  }
}
```

**Response Example for Professor:**

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "role": "PROFESSOR"
      // ... other user fields
    },
    "roleData": {
      "professorId": 1,
      "department": "Computer Science"
    },
    "capabilities": [
      "view_student_profiles",
      "view_job_statistics",
      "access_reports",
      "mentor_students"
    ],
    "recommendedDashboard": "/professor/dashboard",
    "userType": {
      "role": "PROFESSOR",
      "description": "University Staff - Can view analytics and mentor students",
      "permissions": ["read:analytics", "read:students", "create:reports"]
    }
  }
}
```

### 2. Role-Specific Dashboard Data

**`GET /api/user-profile/dashboard`**

- **Purpose**: Return dashboard data customized for user's role
- **Authentication**: Required (JWT token)
- **Authorization**: All authenticated users

**Response varies by role:**

- **Students**: Recent jobs, applications, student-specific quick actions
- **Professors**: Department info, academic tools
- **Employers**: Job postings, application metrics, company tools
- **Admins**: System statistics, recent users, admin tools

### 3. Admin-Only Endpoint

**`GET /api/user-profile/admin-only`**

- **Purpose**: Demonstrate role-based access restriction
- **Authentication**: Required (JWT token)
- **Authorization**: Admin only

### 4. Employer-Only Endpoint

**`GET /api/user-profile/employer-only`**

- **Purpose**: Demonstrate role-based access restriction
- **Authentication**: Required (JWT token)
- **Authorization**: Employer only

## Role-Based Data and Capabilities

### Student (STUDENT)

- **Role Data**: Student ID, address, GPA, degree type, application statistics
- **Capabilities**: View jobs, apply to jobs, manage profile, upload resume
- **Dashboard**: Recent jobs, my applications, application tracking
- **Permissions**: `read:jobs`, `create:application`, `update:profile`

### Professor (PROFESSOR)

- **Role Data**: Professor ID, department
- **Capabilities**: View student profiles, access reports, mentor students
- **Dashboard**: Department info, academic tools, student insights
- **Permissions**: `read:analytics`, `read:students`, `create:reports`

### Employer (EMPLOYER)

- **Role Data**: HR ID, company info, job posting statistics
- **Capabilities**: Post jobs, manage job postings, view applications
- **Dashboard**: My job postings, application metrics, company tools
- **Permissions**: `create:jobs`, `read:applications`, `update:company`

### Admin (ADMIN)

- **Role Data**: Admin ID, system statistics
- **Capabilities**: Manage all users, system configuration, data export
- **Dashboard**: System overview, user management, admin tools
- **Permissions**: `*` (full access)

## Authentication & Authorization Flow

### 1. Authentication

```http
POST /api/login
{
  "email": "user@example.com",
  "password": "password"
}
```

Response includes JWT token in HTTP-only cookie.

### 2. Authorization Middleware Chain

```javascript
// Route with authentication only
router.get("/me", authMiddleware, getUserProfile);

// Route with role-based authorization
router.get(
  "/admin-only",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  adminOnlyEndpoint,
);
```

### 3. Middleware Functions

- **`authMiddleware`**: Verifies JWT token, adds `req.user`
- **`roleMiddleware(['ADMIN'])`**: Checks if user has required role(s)

## Testing the Authorization

### 1. Run Unit Tests

```bash
npm test tests/src/routes/user-profile.test.js
```

Tests cover:

- ✅ Role-specific profile data
- ✅ Authentication requirements
- ✅ Role-based access control
- ✅ Token validation

### 2. Run Demo Script

```bash
node authorization-demo.js
```

Demonstrates:

- ✅ User registration for all roles
- ✅ Login and token management
- ✅ Role-specific profile responses
- ✅ Access control enforcement

### 3. Manual Testing with curl

```bash
# Login to get token
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt

# Test profile endpoint
curl -X GET http://localhost:3000/api/user-profile/me \
  -b cookies.txt

# Test role-restricted endpoint
curl -X GET http://localhost:3000/api/user-profile/admin-only \
  -b cookies.txt
```

## Security Features

### 1. JWT Authentication

- ✅ HTTP-only cookies prevent XSS attacks
- ✅ Token expiration (15 minutes for access tokens)
- ✅ Refresh token rotation

### 2. Role-Based Access Control (RBAC)

- ✅ Fine-grained permissions per role
- ✅ Middleware-enforced authorization
- ✅ Clear capability definitions

### 3. Input Validation

- ✅ All endpoints validate user authentication
- ✅ Role middleware validates user permissions
- ✅ Database queries use parameterized statements

## Error Handling

### Authentication Errors

```json
{
  "success": false,
  "message": "Authentication required",
  "statusCode": 401
}
```

### Authorization Errors

```json
{
  "success": false,
  "message": "Access denied. Required role: ADMIN",
  "statusCode": 403
}
```

### Not Found Errors

```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

## Integration with Existing System

### Compatible Components

- ✅ Uses existing `authMiddleware.js`
- ✅ Uses existing `roleMiddleware.js`
- ✅ Compatible with existing JWT implementation
- ✅ Uses established Prisma database models

### Database Queries

- ✅ Efficient queries with proper joins
- ✅ Role-specific data fetching
- ✅ Optimized for performance

## Usage Examples

### Frontend Integration

```javascript
// Get user profile and detect role
const profile = await fetch("/api/user-profile/me", {
  credentials: "include",
}).then((res) => res.json());

// Redirect to appropriate dashboard
window.location.href = profile.data.recommendedDashboard;

// Show role-specific UI elements
if (profile.data.capabilities.includes("post_jobs")) {
  showJobPostingButton();
}
```

### Role-Based UI Rendering

```javascript
// Check user capabilities
const canPostJobs = user.capabilities.includes("post_jobs");
const canManageUsers = user.capabilities.includes("manage_all_users");
const canViewAnalytics = user.capabilities.includes("view_job_statistics");

// Render appropriate navigation
if (canPostJobs) renderEmployerNav();
if (canManageUsers) renderAdminNav();
if (canViewAnalytics) renderProfessorNav();
```

## File Structure

```
src/routes/user-profile.js           # Main authorization example endpoints
tests/src/routes/user-profile.test.js # Comprehensive test suite
authorization-demo.js                # Interactive demonstration script
```

## Next Steps

1. **Frontend Integration**: Update frontend to use role-based routing
2. **Enhanced Permissions**: Add more granular permission levels
3. **Audit Logging**: Log authorization decisions for security
4. **Performance**: Add caching for frequently accessed role data
5. **Documentation**: Update API documentation with new endpoints
