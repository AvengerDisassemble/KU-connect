# 🚀 KU Connect Development Guide - Authentication & Authorization

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Using Authentication Middleware](#using-authentication-middleware)
3. [Role-Based Authorization](#role-based-authorization)
4. [Creating Protected Routes](#creating-protected-routes)
5. [Permission Matrix Implementation](#permission-matrix-implementation)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Common Examples](#common-examples)
9. [Testing Protected Routes](#testing-protected-routes)

---

## 🚀 Quick Start

### Prerequisites

Your authentication system is already set up with these roles:

- `STUDENT` - Alumni/graduates who can apply for jobs
- `PROFESSOR` - Academic staff who can view insights
- `EMPLOYER` - Company representatives who can post jobs
- `ADMIN` - System administrators with full access

### Available Middleware

```javascript
// Import middleware
const {
  authMiddleware,
  optionalAuthMiddleware,
} = require("../middlewares/authMiddleware");
const {
  roleMiddleware,
  verifiedUserMiddleware,
  ownerOrAdminMiddleware,
} = require("../middlewares/roleMiddleware");
```

---

## 🔐 Using Authentication Middleware

### Basic Authentication

Protect any route by adding `authMiddleware`:

```javascript
const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protected route - requires valid JWT token
router.get("/profile", authMiddleware, (req, res) => {
  // req.user is automatically available with user data
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});
```

### Optional Authentication

For routes that work with or without authentication:

```javascript
// Route works for both authenticated and guest users
router.get("/jobs", optionalAuthMiddleware, (req, res) => {
  if (req.user) {
    // Show personalized job recommendations
    return res.json({ message: `Welcome back, ${req.user.name}!` });
  } else {
    // Show public job listings
    return res.json({ message: "Browse our public job listings" });
  }
});
```

---

## 👥 Role-Based Authorization

### Single Role Protection

```javascript
// Only students can access this route
router.post(
  "/applications",
  authMiddleware,
  roleMiddleware("STUDENT"),
  (req, res) => {
    // Only STUDENT role can reach here
    res.json({ message: "Application submitted successfully" });
  },
);

// Only employers can access this route
router.post("/jobs", authMiddleware, roleMiddleware("EMPLOYER"), (req, res) => {
  // Only EMPLOYER role can reach here
  res.json({ message: "Job posted successfully" });
});
```

### Multiple Role Protection

```javascript
// Both students and professors can access this route
router.get(
  "/insights",
  authMiddleware,
  roleMiddleware(["STUDENT", "PROFESSOR"]),
  (req, res) => {
    if (req.user.role === "PROFESSOR") {
      // Show detailed analytics
      res.json({ data: "Detailed professor insights" });
    } else {
      // Show limited student insights
      res.json({ data: "Basic student insights" });
    }
  },
);

// Admin and employer access
router.get(
  "/manage-content",
  authMiddleware,
  roleMiddleware(["ADMIN", "EMPLOYER"]),
  (req, res) => {
    res.json({ message: "Content management panel" });
  },
);
```

### Verification Requirement

```javascript
// Only verified users can access
router.post(
  "/premium-feature",
  authMiddleware,
  verifiedUserMiddleware,
  (req, res) => {
    res.json({ message: "Premium feature accessed" });
  },
);
```

### Owner or Admin Access

```javascript
// Users can only access their own data (or admins can access any)
router.get(
  "/user/:userId/private-data",
  authMiddleware,
  ownerOrAdminMiddleware("userId"),
  (req, res) => {
    // req.user.id === req.params.userId OR req.user.role === 'ADMIN'
    res.json({ message: "Private user data" });
  },
);
```

---

## 🛣️ Creating Protected Routes

### Complete Route Example

```javascript
// src/routes/jobs.js
const express = require("express");
const {
  authMiddleware,
  optionalAuthMiddleware,
} = require("../middlewares/authMiddleware");
const {
  roleMiddleware,
  verifiedUserMiddleware,
} = require("../middlewares/roleMiddleware");
const { validateJobCreation } = require("../validators/jobValidator");
const {
  createJob,
  getJobs,
  applyToJob,
} = require("../controllers/jobController");

const router = express.Router();

/**
 * @route GET /jobs
 * @desc Get all jobs (public + personalized if authenticated)
 * @access Public/Private
 */
router.get("/", optionalAuthMiddleware, getJobs);

/**
 * @route POST /jobs
 * @desc Create a new job posting
 * @access Private - Employers only
 */
router.post(
  "/",
  authMiddleware, // Must be authenticated
  roleMiddleware("EMPLOYER"), // Must be employer
  verifiedUserMiddleware, // Must be verified
  validateJobCreation, // Validate input
  createJob, // Controller function
);

/**
 * @route POST /jobs/:jobId/apply
 * @desc Apply to a job
 * @access Private - Students only
 */
router.post(
  "/:jobId/apply",
  authMiddleware,
  roleMiddleware("STUDENT"),
  applyToJob,
);

/**
 * @route GET /jobs/:jobId
 * @desc Get job details
 * @access Public
 */
router.get("/:jobId", getJob);

/**
 * @route PUT /jobs/:jobId
 * @desc Update job (owner or admin only)
 * @access Private - Job owner or Admin
 */
router.put(
  "/:jobId",
  authMiddleware,
  roleMiddleware(["EMPLOYER", "ADMIN"]),
  updateJob,
);

/**
 * @route DELETE /jobs/:jobId
 * @desc Delete job (admin only)
 * @access Private - Admin only
 */
router.delete("/:jobId", authMiddleware, roleMiddleware("ADMIN"), deleteJob);

module.exports = router;
```

---

## 📊 Permission Matrix Implementation

Based on your specification, here's how to implement the role permission matrix:

### Students (STUDENT role)

```javascript
// Student-specific routes
const studentRoutes = express.Router();

// All student routes require authentication and STUDENT role
studentRoutes.use(authMiddleware);
studentRoutes.use(roleMiddleware("STUDENT"));

// Manage own profile
studentRoutes.get("/profile", getStudentProfile);
studentRoutes.put("/profile", validateStudentProfile, updateStudentProfile);

// View job postings
studentRoutes.get("/jobs", getJobsForStudents);

// Apply to jobs
studentRoutes.post("/jobs/:jobId/apply", validateApplication, applyToJob);
studentRoutes.get("/applications", getMyApplications);
studentRoutes.put("/applications/:applicationId", updateMyApplication);
studentRoutes.delete("/applications/:applicationId", cancelMyApplication);
```

### Employers (EMPLOYER role)

```javascript
// Employer-specific routes
const employerRoutes = express.Router();

employerRoutes.use(authMiddleware);
employerRoutes.use(roleMiddleware("EMPLOYER"));

// Manage own profile
employerRoutes.get("/profile", getEmployerProfile);
employerRoutes.put("/profile", validateEmployerProfile, updateEmployerProfile);

// View job postings (all jobs for context)
employerRoutes.get("/jobs", getJobsForEmployers);

// Create and manage job postings
employerRoutes.post(
  "/jobs",
  verifiedUserMiddleware,
  validateJobCreation,
  createJob,
);
employerRoutes.get("/jobs/my-jobs", getMyJobs);
employerRoutes.put(
  "/jobs/:jobId",
  ownerOrAdminMiddleware("jobOwnerId"),
  updateJob,
);
employerRoutes.delete(
  "/jobs/:jobId",
  ownerOrAdminMiddleware("jobOwnerId"),
  deleteJob,
);

// View applications for their jobs
employerRoutes.get("/jobs/:jobId/applications", getApplicationsForMyJob);
employerRoutes.put(
  "/applications/:applicationId/status",
  updateApplicationStatus,
);
```

### Professors (PROFESSOR role)

```javascript
// Professor-specific routes
const professorRoutes = express.Router();

professorRoutes.use(authMiddleware);
professorRoutes.use(roleMiddleware("PROFESSOR"));

// Manage own profile
professorRoutes.get("/profile", getProfessorProfile);
professorRoutes.put("/profile", updateProfessorProfile);

// View job postings
professorRoutes.get("/jobs", getJobs);

// View insights on students (special permission)
professorRoutes.get("/insights/students", getStudentInsights);
professorRoutes.get("/insights/applications", getApplicationInsights);
professorRoutes.get("/insights/jobs", getJobInsights);
```

### Admins (ADMIN role)

```javascript
// Admin-specific routes
const adminRoutes = express.Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(roleMiddleware("ADMIN"));

// View insights (full access)
adminRoutes.get("/insights/students", getStudentInsights);
adminRoutes.get("/insights/all", getAllInsights);

// Moderate content
adminRoutes.put("/jobs/:jobId/moderate", moderateJob);
adminRoutes.delete("/jobs/:jobId", deleteJob);
adminRoutes.put("/users/:userId/verify", verifyUser);
adminRoutes.put("/users/:userId/ban", banUser);

// Manage roles and permissions
adminRoutes.put("/users/:userId/role", updateUserRole);
adminRoutes.get("/users", getAllUsers);
adminRoutes.delete("/users/:userId", deleteUser);
```

---

## ❌ Error Handling

The error handler automatically manages authentication errors:

```javascript
// These errors are automatically handled:
// 401: Authentication required / Invalid token
// 403: Access denied / Insufficient permissions
// 409: Duplicate data (email already exists)
// 400: Validation errors

// Custom error example in controller
const createJob = async (req, res, next) => {
  try {
    // Your business logic here
    if (!req.body.title) {
      const error = new Error("Job title is required");
      error.statusCode = 400;
      throw error;
    }

    // Create job logic...
    res.json({ success: true, data: job });
  } catch (error) {
    next(error); // Automatically handled by error middleware
  }
};
```

---

## ✅ Best Practices

### 1. Route Organization

```javascript
// Group routes by functionality
src/routes/
├── auth.js          # Authentication endpoints
├── students/        # Student-specific routes
│   ├── profile.js
│   ├── applications.js
│   └── index.js
├── employers/       # Employer-specific routes
│   ├── profile.js
│   ├── jobs.js
│   └── index.js
├── admin/          # Admin-specific routes
│   ├── moderation.js
│   ├── insights.js
│   └── index.js
└── public/         # Public routes (no auth required)
    ├── jobs.js
    └── search.js
```

### 2. Middleware Order

```javascript
// Correct order of middleware
router.post(
  "/endpoint",
  authMiddleware, // 1. Authenticate user
  roleMiddleware("ROLE"), // 2. Check role permissions
  verifiedUserMiddleware, // 3. Check verification status
  validateInput, // 4. Validate request data
  controllerFunction, // 5. Execute business logic
);
```

### 3. Controller Access Patterns

```javascript
// In your controllers, you can access:
const controller = (req, res) => {
  const userId = req.user.id; // Current user ID
  const userRole = req.user.role; // Current user role
  const isVerified = req.user.verified; // Verification status
  const userEmail = req.user.email; // User email

  // Use this data for business logic
  if (userRole === "EMPLOYER") {
    // Employer-specific logic
  }
};
```

---

## 📝 Common Examples

### Example 1: Job Application System

```javascript
// src/routes/applications.js
const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { roleMiddleware } = require("../middlewares/roleMiddleware");

const router = express.Router();

// Students can apply to jobs
router.post(
  "/",
  authMiddleware,
  roleMiddleware("STUDENT"),
  async (req, res) => {
    const { jobId, coverLetter, resumeUrl } = req.body;
    const studentId = req.user.id;

    // Create application logic
    const application = await createApplication({
      studentId,
      jobId,
      coverLetter,
      resumeUrl,
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  },
);

// Employers can view applications for their jobs
router.get(
  "/job/:jobId",
  authMiddleware,
  roleMiddleware("EMPLOYER"),
  async (req, res) => {
    const { jobId } = req.params;
    const employerId = req.user.id;

    // Verify employer owns this job
    const job = await getJobById(jobId);
    if (job.employerId !== employerId && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const applications = await getApplicationsByJobId(jobId);
    res.json({ success: true, data: applications });
  },
);

module.exports = router;
```

### Example 2: Profile Management

```javascript
// src/routes/profile.js
const router = express.Router();

// Get own profile (any authenticated user)
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const profile = await getUserProfile(userId, req.user.role);
  res.json({ success: true, data: profile });
});

// Update own profile (any authenticated user)
router.put("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;

  // Role-specific validation
  if (req.user.role === "STUDENT") {
    validateStudentProfileUpdate(updates);
  } else if (req.user.role === "EMPLOYER") {
    validateEmployerProfileUpdate(updates);
  }

  const updatedProfile = await updateUserProfile(userId, updates);
  res.json({ success: true, data: updatedProfile });
});

// Admin can view any profile
router.get(
  "/:userId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    const { userId } = req.params;
    const profile = await getUserProfile(userId);
    res.json({ success: true, data: profile });
  },
);
```

### Example 3: Mixed Permission Routes

```javascript
// src/routes/insights.js
const router = express.Router();

// Students can view basic insights about themselves
// Professors can view insights about all students
// Admins can view all insights
router.get("/students", authMiddleware, async (req, res) => {
  if (req.user.role === "STUDENT") {
    // Return only their own basic insights
    const insights = await getStudentInsights(req.user.id, "basic");
    return res.json({ success: true, data: insights });
  }

  if (req.user.role === "PROFESSOR") {
    // Return aggregated student insights (no personal data)
    const insights = await getStudentInsights(null, "aggregated");
    return res.json({ success: true, data: insights });
  }

  if (req.user.role === "ADMIN") {
    // Return detailed insights
    const insights = await getStudentInsights(null, "detailed");
    return res.json({ success: true, data: insights });
  }

  // Employers cannot access student insights
  return res.status(403).json({
    success: false,
    message: "Access denied",
  });
});
```

---

## 🧪 Testing Protected Routes

### Test Setup

```javascript
// tests/src/protectedRoutes.test.js
describe("Protected Routes", () => {
  let studentToken, employerToken, adminToken;

  beforeAll(async () => {
    // Create test users and get tokens
    const studentResponse = await request(app)
      .post("/api/register/alumni")
      .send(studentData);

    const studentLogin = await request(app)
      .post("/api/login")
      .send({ email: studentData.email, password: studentData.password });

    studentToken = extractTokenFromCookies(studentLogin.headers["set-cookie"]);

    // Repeat for employer and admin...
  });

  it("should allow students to apply for jobs", async () => {
    const response = await request(app)
      .post("/api/applications")
      .set("Cookie", [`accessToken=${studentToken}`])
      .send(applicationData)
      .expect(201);

    expect(response.body.success).toBe(true);
  });

  it("should deny employers from applying for jobs", async () => {
    const response = await request(app)
      .post("/api/applications")
      .set("Cookie", [`accessToken=${employerToken}`])
      .send(applicationData)
      .expect(403);

    expect(response.body.success).toBe(false);
  });
});
```

---

## 🎯 Next Development Steps

1. **Implement Business Logic**: Use the patterns above to create your job posting, application, and profile management features

2. **Create API Documentation**: Document all your protected endpoints with their required roles

3. **Add Data Validation**: Create comprehensive validators for each route

4. **Implement Frontend Integration**: Use the authentication cookies for seamless frontend experience

5. **Add Logging**: Track user actions for security and analytics

6. **Database Relationships**: Add proper foreign key relationships between users, jobs, and applications

## 🔗 Quick Reference

### Common Middleware Combinations

```javascript
// Public route
router.get("/endpoint", controller);

// Login required
router.get("/endpoint", authMiddleware, controller);

// Role-specific
router.post("/endpoint", authMiddleware, roleMiddleware("STUDENT"), controller);

// Verified users only
router.post("/endpoint", authMiddleware, verifiedUserMiddleware, controller);

// Owner or admin access
router.put(
  "/endpoint/:userId",
  authMiddleware,
  ownerOrAdminMiddleware("userId"),
  controller,
);

// Multiple roles
router.get(
  "/endpoint",
  authMiddleware,
  roleMiddleware(["ADMIN", "PROFESSOR"]),
  controller,
);
```

This guide should provide everything you need to continue developing your KU Connect application with proper authentication and authorization! 🚀
