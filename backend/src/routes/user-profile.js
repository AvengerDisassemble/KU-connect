/**
 * @file deprecated - use backend/src/controllers/profileController.js
 * @deprecated This router is deprecated and will be removed. Please migrate to backend/src/controllers/profileController.js
 *
 * The router will continue to work but will emit a deprecation warning on load
 * and add a Deprecation/Warning header to all responses. Do not add new logic here.
 */

const express = require('express')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { roleMiddleware } = require('../middlewares/roleMiddleware')
const { asyncErrorHandler } = require('../middlewares/errorHandler')
const { strictLimiter } = require('../middlewares/rateLimitMiddleware')
const prisma = require('../models/prisma')

const router = express.Router()

// Emit a single-process warning when this module is required
if (!global.__deprecated_user_profile_warned) {
  const message =
    "routes/user-profile.js is deprecated. Use backend/src/controllers/profileController.js instead.";
  // Prefer process.emitWarning for debuggability, still log for visibility
  if (typeof process.emitWarning === "function") {
    process.emitWarning(message, { type: "DeprecationWarning" });
  }
  console.warn(`DEPRECATION: ${message}`);
  global.__deprecated_user_profile_warned = true;
}

/**
 * Middleware to mark responses from this router as deprecated.
 * Adds standard headers so clients and crawlers can detect deprecation.
 */
function deprecationMiddleware(req, res, next) {
  // RFC-standard-ish headers: Deprecation, Sunset, Warning. Provide a link to the replacement API.
  try {
    res.setHeader("Deprecation", "true");
    // Optional: a human-readable warning header
    res.setHeader(
      "Warning",
      '299 - "Deprecated API: use /api/profile (controllers/profileController.js) instead"',
    );
    // Link header pointing to recommended replacement (can be adjusted to real URL)
    res.setHeader(
      "Link",
      '</api/profile>; rel="alternate"; title="New profile controller"',
    );
  } catch (e) {
    // ignore header-setting failures
  }
  next();
}

// apply deprecation middleware to all routes in this router
router.use(deprecationMiddleware);

/**
 * Get current user profile with role-specific data
 * This endpoint demonstrates authorization by detecting user type
 * and returning role-specific information
 * @route GET /api/profile/me
 * @access Private (All authenticated users)
 */
const getUserProfile = asyncErrorHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  // Base user information
  const baseUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      verified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!baseUser) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Fetch role-specific data based on user type
  let roleSpecificData = {};
  let userCapabilities = [];
  let dashboardPath = "";

  switch (userRole) {
    case "STUDENT":
      const studentData = await prisma.student.findUnique({
        where: { userId },
        include: {
          degreeType: true,
          interests: {
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  location: true,
                },
              },
            },
          },
          // Use 'applications' if it exists, otherwise fallback to 'resumes' for backward compatibility
          applications: prisma.student.fields.applications
            ? {
                include: {
                  job: {
                    select: {
                      id: true,
                      title: true
                    }
                  }
                }
              }
            : undefined,
          resumes: !prisma.student.fields.applications && prisma.student.fields.resumes
            ? {
                include: {
                  job: {
                    select: {
                      id: true,
                      title: true
                    }
                  }
                }
              }
            : undefined
        }
      })

      roleSpecificData = {
        studentId: studentData?.id,
        address: studentData?.address,
        gpa: studentData?.gpa,
        expectedGraduationYear: studentData?.expectedGraduationYear,
        degreeType: studentData?.degreeType?.name,
        totalInterests: studentData?.interests?.length || 0,
        totalApplications: (studentData?.applications?.length ?? studentData?.resumes?.length) || 0
      }

      userCapabilities = [
        "view_jobs",
        "apply_to_jobs",
        "manage_profile",
        "upload_resume",
        "track_applications",
      ];

      dashboardPath = "/student/dashboard";
      break;

    case "PROFESSOR":
      const professorData = await prisma.professor.findUnique({
        where: { userId },
      });

      roleSpecificData = {
        professorId: professorData?.id,
        department: professorData?.department,
      };

      userCapabilities = [
        "view_student_profiles",
        "view_job_statistics",
        "access_reports",
        "mentor_students",
      ];

      dashboardPath = "/professor/dashboard";
      break;

    case "EMPLOYER":
      const hrData = await prisma.hR.findUnique({
        where: { userId },
        include: {
          jobs: {
            select: {
              id: true,
              title: true,
              location: true,
              application_deadline: true,
            },
          },
        },
      });

      roleSpecificData = {
        hrId: hrData?.id,
        companyName: hrData?.companyName,
        address: hrData?.address,
        industry: hrData?.industry,
        companySize: hrData?.companySize,
        website: hrData?.website,
        totalJobPostings: hrData?.jobs?.length || 0,
        activeJobPostings:
          hrData?.jobs?.filter(
            (job) => new Date(job.application_deadline) > new Date(),
          ).length || 0,
      };

      userCapabilities = [
        "post_jobs",
        "manage_job_postings",
        "view_applications",
        "contact_candidates",
        "company_analytics",
      ];

      dashboardPath = "/employer/dashboard";
      break;

    case "ADMIN":
      const adminData = await prisma.admin.findUnique({
        where: { userId },
      });

      // Get some admin statistics
      const [totalUsers, totalJobs, totalApplications] = await Promise.all([
        prisma.user.count(),
        prisma.job.count(),
        prisma.resume.count(),
      ]);

      roleSpecificData = {
        adminId: adminData?.id,
        systemStats: {
          totalUsers,
          totalJobs,
          totalApplications,
          totalStudents: await prisma.student.count(),
          totalEmployers: await prisma.hR.count(),
          totalProfessors: await prisma.professor.count(),
        },
      };

      userCapabilities = [
        "manage_all_users",
        "moderate_content",
        "view_system_analytics",
        "manage_job_postings",
        "system_configuration",
        "export_data",
      ];

      dashboardPath = "/admin/dashboard";
      break;

    default:
      roleSpecificData = {
        message: "Unknown user role",
      };
      userCapabilities = [];
      dashboardPath = "/dashboard";
  }

  res.json({
    success: true,
    message: "User profile retrieved successfully",
    data: {
      user: baseUser,
      roleData: roleSpecificData,
      capabilities: userCapabilities,
      recommendedDashboard: dashboardPath,
      userType: {
        role: userRole,
        description: getRoleDescription(userRole),
        permissions: getUserPermissions(userRole),
      },
    },
  });
});

/**
 * Get role-specific dashboard data
 * This endpoint demonstrates role-based authorization
 * @route GET /api/profile/dashboard
 * @access Private (All authenticated users)
 */
const getDashboardData = asyncErrorHandler(async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  let dashboardData = {};

  switch (userRole) {
    case "STUDENT":
      // Get recent job postings and user's applications
      const recentJobs = await prisma.job.findMany({
        take: 5,
        orderBy: { id: "desc" },
        select: {
          id: true,
          title: true,
          location: true,
          application_deadline: true,
          hr: {
            select: {
              companyName: true,
            },
          },
        },
      });

      const myApplications = await prisma.application.findMany({
        where: {
          student: {
            userId,
          },
        },
        take: 5,
        orderBy: { id: "desc" },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              hr: {
                select: {
                  companyName: true,
                },
              },
            },
          },
        },
      });

      dashboardData = {
        recentJobs,
        myApplications,
        quickActions: [
          "Browse Jobs",
          "Update Profile",
          "Upload Resume",
          "View Applications",
        ],
      };
      break;

    case "EMPLOYER":
      // Get company's job postings and recent applications
      const myJobPostings = await prisma.job.findMany({
        where: {
          hr: {
            userId,
          },
        },
        take: 5,
        orderBy: { id: "desc" },
        select: {
          id: true,
          title: true,
          location: true,
          application_deadline: true,
          _count: {
            select: {
              applications: true,
            },
          },
        },
      });

      dashboardData = {
        myJobPostings,
        quickActions: [
          "Post New Job",
          "Review Applications",
          "Edit Company Profile",
          "View Analytics",
        ],
      };
      break;

    case "PROFESSOR":
      // Get department insights
      const departmentStats = await prisma.professor.findUnique({
        where: { userId },
        include: {
          _count: true,
        },
      });

      dashboardData = {
        departmentInfo: {
          department: departmentStats?.department,
          role: "Professor",
        },
        quickActions: [
          "View Student Progress",
          "Access Reports",
          "Department Analytics",
          "Mentoring Tools",
        ],
      };
      break;

    case "ADMIN":
      // Get system overview
      const systemOverview = await Promise.all([
        prisma.user.count(),
        prisma.job.count(),
        prisma.resume.count(),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            role: true,
            createdAt: true,
          },
        }),
      ]);

      dashboardData = {
        systemStats: {
          totalUsers: systemOverview[0],
          totalJobs: systemOverview[1],
          totalApplications: systemOverview[2],
        },
        recentUsers: systemOverview[3],
        quickActions: [
          "Manage Users",
          "System Analytics",
          "Content Moderation",
          "Export Reports",
        ],
      };
      break;

    default:
      dashboardData = {
        message: "Dashboard not configured for this user type",
        quickActions: [],
      };
  }

  res.json({
    success: true,
    message: "Dashboard data retrieved successfully",
    data: {
      userRole,
      dashboard: dashboardData,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Role-specific endpoint - Only accessible by specific roles
 * @route GET /api/profile/admin-only
 * @access Private (Admin only)
 */
const adminOnlyEndpoint = asyncErrorHandler(async (req, res) => {
  res.json({
    success: true,
    message: "Admin-only endpoint accessed successfully",
    data: {
      message: "This endpoint is only accessible by administrators",
      userRole: req.user.role,
      adminPrivileges: [
        "System Configuration",
        "User Management",
        "Data Export",
        "Security Settings",
      ],
    },
  });
});

/**
 * Role-specific endpoint - Only accessible by employers
 * @route GET /api/profile/employer-only
 * @access Private (Employer only)
 */
const employerOnlyEndpoint = asyncErrorHandler(async (req, res) => {
  res.json({
    success: true,
    message: "Employer-only endpoint accessed successfully",
    data: {
      message: "This endpoint is only accessible by employers",
      userRole: req.user.role,
      employerPrivileges: [
        "Job Posting",
        "Application Review",
        "Candidate Communication",
        "Company Analytics",
      ],
    },
  });
});

/**
 * Helper function to get role description
 */
function getRoleDescription(role) {
  const descriptions = {
    STUDENT: "Student or Alumni - Can browse and apply for jobs",
    PROFESSOR: "University Staff - Can view analytics and mentor students",
    EMPLOYER: "Company Representative - Can post jobs and manage applications",
    ADMIN: "System Administrator - Full system access and management",
  };
  return descriptions[role] || "Unknown role";
}

/**
 * Helper function to get user permissions
 */
function getUserPermissions(role) {
  const permissions = {
    STUDENT: ["read:jobs", "create:application", "update:profile"],
    PROFESSOR: ["read:analytics", "read:students", "create:reports"],
    EMPLOYER: ["create:jobs", "read:applications", "update:company"],
    ADMIN: ["*"], // Full access
  };
  return permissions[role] || [];
}

// Route definitions (still available but deprecated)
router.get("/me", authMiddleware, getUserProfile);
router.get("/dashboard", authMiddleware, getDashboardData);
router.get(
  "/admin-only",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  adminOnlyEndpoint,
);
router.get(
  "/employer-only",
  authMiddleware,
  roleMiddleware(["EMPLOYER"]),
  employerOnlyEndpoint,
);

module.exports = router;
