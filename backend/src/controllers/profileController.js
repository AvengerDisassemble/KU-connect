/**
 * @module controllers/profileController
 * @description Controller for profile management endpoints with authentication and standardized responses
 */

const { asyncErrorHandler } = require('../middlewares/errorHandler')
const profileService = require('../services/profileService')
const storageProvider = require('../services/storageFactory')
const prisma = require('../models/prisma')
const studentRecommendationService = require('../services/studentRecommendationService')

/**
 * Updates an existing profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function updateProfile(req, res) {
  try {
    const { role, ...updateData } = req.body;
    const userId = req.user.id;

    // Prevent email change at controller level - fail fast before database operations
    if (updateData.email) {
      req.log?.("warn", "profile.update.email_blocked", {
        userId,
        ip: req.ip,
      });
      return res.status(400).json({
        success: false,
        message: "Email cannot be changed. Please contact support.",
      });
    }

    const profile = await profileService.getProfileById(userId);
    if (!profile) {
      req.log?.("warn", "profile.update.not_found", {
        userId,
        ip: req.ip,
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Resolve role automatically if not provided
    let resolvedRole = role;
    if (!resolvedRole) {
      if (profile.student && !profile.hr) resolvedRole = "student";
      else if (profile.hr && !profile.student) resolvedRole = "hr";
      else {
        req.log?.("warn", "profile.update.role_undetermined", {
          userId,
          ip: req.ip,
        });
        return res.status(400).json({
          success: false,
          message: "User role not determined",
        });
      }
    }

    let result;
    if (resolvedRole === "student" && profile.student) {
      result = await profileService.updateStudentProfile(userId, updateData);
    } else if (resolvedRole === "hr" && profile.hr) {
      result = await profileService.updateEmployerProfile(userId, updateData);
    } else {
      return res.status(403).json({
        success: false,
        message: "Role mismatch – cannot update profile",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: result,
    });

    req.log?.("info", "profile.update.success", {
      userId,
      ip: req.ip,
      role: resolvedRole,
      fields: Object.keys(updateData || {}),
    });
  } catch (error) {
    req.log?.("error", "profile.update.error", {
      userId: req.user?.id,
      ip: req.ip,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
}

/**
 * Gets a single profile by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function getProfile(req, res) {
  try {
    const { role: userRole, id: userId } = req.user
    const requestedUserId = req.params.userId || userId

  
    // Roles allowed to view any profile
    const privilegedRoles = ["ADMIN", "HR", "PROFESSOR"];

    // Non-privileged users can only access their own profile
    if (requestedUserId !== userId && !privilegedRoles.includes(userRole)) {
      req.log?.("warn", "profile.get.forbidden", {
        userId,
        requestedUserId,
        ip: req.ip,
      });
      return res.status(403).json({
        success: false,
        message: "Access denied: you are not authorized to view this profile",
      });
    }

    const profile = await profileService.getProfileById(requestedUserId);

    if (!profile) {
      req.log?.("warn", "profile.get.not_found", {
        userId,
        requestedUserId,
        ip: req.ip,
      });
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    req.log?.("info", "profile.get", {
      userId,
      requestedUserId,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    req.log?.("error", "profile.get.error", {
      userId: req.user?.id,
      requestedUserId: req.params?.userId,
      ip: req.ip,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
}

/**
 * Lists all profiles (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function listProfiles(req, res) {
  try {
    const profiles = await profileService.listProfiles();

    req.log?.("info", "profile.list", {
      userId: req.user?.id,
      ip: req.ip,
      count: profiles.length,
    });

    res.status(200).json({
      success: true,
      message: "Profiles listed successfully",
      data: profiles,
    });
  } catch (error) {
    req.log?.("error", "profile.list.error", {
      userId: req.user?.id,
      ip: req.ip,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to list profiles",
    });
  }
}

/**
 * Upload user avatar
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      req.log?.("warn", "profile.avatar.upload.missing_file", {
        userId: req.user?.id,
        ip: req.ip,
      });
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user.id;

    // Fetch current user to check for existing avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });

    // Best-effort delete old avatar if exists
    if (user && user.avatarKey) {
      try {
        await storageProvider.deleteFile(user.avatarKey);
      } catch (error) {
        req.log?.("warn", "profile.avatar.upload.cleanup_failed", {
          userId,
          ip: req.ip,
          error: error.message,
        });
        // Don't fail the request if old file deletion fails
      }
    }

    // Upload new avatar
    const fileKey = await storageProvider.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { prefix: "avatars" },
    );

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: { avatarKey: fileKey },
    });

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: { fileKey },
    });

    req.log?.("info", "profile.avatar.upload.success", {
      userId,
      ip: req.ip,
      fileKey,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    req.log?.("error", "profile.avatar.upload.error", {
      userId: req.user?.id,
      ip: req.ip,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to upload avatar",
    });
  }
}

/**
 * Download avatar file (protected)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function downloadAvatar(req, res) {
  try {
    const requestedUserId = req.params.userId;

    const user = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: { avatarKey: true },
    });

    if (!user) {
      req.log?.("warn", "profile.avatar.download.not_found_user", {
        requestedUserId,
        ip: req.ip,
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.avatarKey) {
      req.log?.("warn", "profile.avatar.download.missing", {
        requestedUserId,
        ip: req.ip,
      });
      return res.status(404).json({
        success: false,
        message: "No avatar found for this user",
      });
    }

    // Try signed URL first (S3), fallback to streaming (local)
    const signedUrl = await storageProvider.getSignedDownloadUrl(
      user.avatarKey,
    );

    if (signedUrl) {
      req.log?.("info", "profile.avatar.download.redirect", {
        requestedUserId,
        ip: req.ip,
      });
      return res.redirect(signedUrl);
    }

    // Stream the file
    const { stream, mimeType, filename } = await storageProvider.getReadStream(
      user.avatarKey,
    );

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache avatars for 1 hour
    res.setHeader("X-Content-Type-Options", "nosniff");

    stream.pipe(res);

    req.log?.("info", "profile.avatar.download.stream", {
      requestedUserId,
      ip: req.ip,
      fileKey: user.avatarKey,
    });
  } catch (error) {
    req.log?.("error", "profile.avatar.download.error", {
      requestedUserId: req.params?.userId,
      ip: req.ip,
      error: error.message,
    });

    if (error.message && error.message.includes("File not found")) {
      return res.status(404).json({
        success: false,
        message: "Avatar file not found",
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to download avatar'
    })
  }
}

/**
 * Get dashboard data for authenticated user (Student and Employer dashboard)
 * @route GET /api/profile/dashboard
 */
const getDashboardData = asyncErrorHandler(async (req, res) => {
  const { role: userRole, id: userId } = req.user

  // Handle different user roles
  if (userRole === 'STUDENT') {
    // Find student
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      })
    }

    // Parallel queries for student dashboard data
    const [recentJobs, myApplications, recommendedJobs, totalJobs, applicationStatsRaw] = await Promise.all([
      // Recent jobs (last 5)
      prisma.job.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          location: true,
          jobType: true,
          application_deadline: true,
          createdAt: true,
          hr: {
            select: {
              companyName: true
            }
          }
        }
      }),

      // My applications (last 5)
      prisma.application.findMany({
        where: { studentId: student.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              hr: {
                select: {
                  companyName: true
                }
              }
            }
          }
        }
      }),

      // Recommended jobs
      studentRecommendationService.getRecommendedJobsForStudent(userId, 10),

      // Total jobs count
      prisma.job.count(),

      // Application stats grouped by status
      prisma.application.groupBy({
        by: ['status'],
        where: {
          studentId: student.id
        },
        _count: {
          _all: true
        }
      })
    ])

    // Transform application stats
    const applicationStats = {
      total: 0,
      submitted: 0,
      qualified: 0,
      rejected: 0,
      hired: 0
    }

    applicationStatsRaw.forEach(stat => {
      const count = stat._count._all
      applicationStats.total += count

      if (stat.status === 'PENDING') {
        applicationStats.submitted = count
      } else if (stat.status === 'QUALIFIED') {
        applicationStats.qualified = count
      } else if (stat.status === 'REJECTED') {
        applicationStats.rejected = count
      }
    })

    req.log?.("info", "profile.dashboard.student", {
      userId,
      ip: req.ip
    })

    // Build student response
    return res.status(200).json({
      success: true,
      message: 'Student dashboard retrieved',
      data: {
        userRole: 'STUDENT',
        dashboard: {
          totals: {
            jobs: totalJobs
          },
          applicationStats,
          recentJobs,
          myApplications,
          recommendedJobs,
          quickActions: [
            'Browse Jobs',
            'Update Preferences',
            'Upload Resume',
            'View Applications'
          ]
        },
        timestamp: new Date().toISOString()
      }
    })
  } else if (userRole === 'EMPLOYER') {
    // Find HR profile
    const hr = await prisma.hR.findUnique({
      where: { userId },
      select: { id: true, companyName: true }
    })

    if (!hr) {
      return res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      })
    }

    // Parallel queries for employer dashboard data
    const [myJobPostings, recentApplications, totalJobs, activeJobsCount, totalApplications, applicationsByStatus] = await Promise.all([
      // My job postings (last 5)
      prisma.job.findMany({
        where: { hrId: hr.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          companyName: true,
          location: true,
          jobType: true,
          application_deadline: true,
          createdAt: true,
          _count: {
            select: {
              applications: true
            }
          }
        }
      }),

      // Recent applications to my jobs (last 5)
      prisma.application.findMany({
        where: {
          job: {
            hrId: hr.id
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          job: {
            select: {
              id: true,
              title: true,
              companyName: true
            }
          },
          student: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  surname: true,
                  email: true
                }
              },
              degreeType: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),

      // Total jobs count
      prisma.job.count({
        where: { hrId: hr.id }
      }),

      // Active jobs count (deadline > now)
      prisma.job.count({
        where: {
          hrId: hr.id,
          application_deadline: {
            gt: new Date()
          }
        }
      }),

      // Total applications to my jobs
      prisma.application.count({
        where: {
          job: {
            hrId: hr.id
          }
        }
      }),

      // Applications grouped by status
      prisma.application.groupBy({
        by: ['status'],
        where: {
          job: {
            hrId: hr.id
          }
        },
        _count: {
          _all: true
        }
      })
    ])

    // Calculate expired jobs
    const expiredJobs = totalJobs - activeJobsCount

    // Transform application stats
    const applicationStats = {
      total: totalApplications,
      pending: 0,
      qualified: 0,
      rejected: 0
    }

    applicationsByStatus.forEach(stat => {
      const count = stat._count._all

      if (stat.status === 'PENDING') {
        applicationStats.pending = count
      } else if (stat.status === 'QUALIFIED') {
        applicationStats.qualified = count
      } else if (stat.status === 'REJECTED') {
        applicationStats.rejected = count
      }
    })

    req.log?.("info", "profile.dashboard.employer", {
      userId,
      ip: req.ip,
      hrId: hr.id,
      companyName: hr.companyName
    })

    // Build employer response
    return res.status(200).json({
      success: true,
      message: 'Employer dashboard retrieved',
      data: {
        userRole: 'EMPLOYER',
        dashboard: {
          companyInfo: {
            hrId: hr.id,
            companyName: hr.companyName
          },
          totals: {
            jobPostings: totalJobs,
            activeJobs: activeJobsCount,
            expiredJobs,
            totalApplications
          },
          applicationStats,
          myJobPostings,
          recentApplications,
          quickActions: [
            'Post New Job',
            'Review Applications',
            'Edit Company Profile',
            'View Analytics'
          ]
        },
        timestamp: new Date().toISOString()
      }
    })
  } else {
    // Unsupported role
    return res.status(403).json({
      success: false,
      message: 'Dashboard not available for this user role'
    })
  }
})

module.exports = {
  updateProfile,
  getProfile,
  listProfiles,
  uploadAvatar,
  downloadAvatar,
  getDashboardData
}
