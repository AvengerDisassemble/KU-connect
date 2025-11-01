/**
 * Professor Analytics Service
 * Provides analytics and monitoring capabilities for professors
 * @module services/professorService
 */

const prisma = require('../models/prisma')

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate student year from expected graduation year
 * @param {number} expectedGraduationYear - Expected graduation year
 * @returns {string|number} Year (1-4 or "4+")
 */
function calculateStudentYear (expectedGraduationYear) {
  if (!expectedGraduationYear) return '4+'
  
  const currentYear = new Date().getFullYear()
  const yearsUntilGraduation = expectedGraduationYear - currentYear
  
  if (yearsUntilGraduation <= 0) return '4+'
  if (yearsUntilGraduation === 1) return 4
  if (yearsUntilGraduation === 2) return 3
  if (yearsUntilGraduation === 3) return 2
  if (yearsUntilGraduation >= 4) return 1
  
  return '4+'
}

/**
 * Calculate qualified rate percentage
 * @param {number} qualifiedCount - Number of qualified applications
 * @param {number} totalCount - Total applications
 * @returns {number} Percentage (0-100) with 1 decimal place
 */
function calculateQualifiedRate (qualifiedCount, totalCount) {
  if (!totalCount || totalCount === 0) return 0
  return Math.round((qualifiedCount / totalCount) * 1000) / 10
}

/**
 * Determine trend from percentage change
 * @param {number} percentChange - Percentage change value
 * @returns {string} "increasing" | "stable" | "decreasing"
 */
function determineTrend (percentChange) {
  if (percentChange > 5) return 'increasing'
  if (percentChange < -5) return 'decreasing'
  return 'stable'
}

/**
 * Get date range based on time period
 * @param {string} timePeriod - "last7days" | "last30days" | "last90days" | "all"
 * @param {string} startDate - Custom start date (ISO string)
 * @param {string} endDate - Custom end date (ISO string)
 * @returns {Object} { startDate: Date, endDate: Date }
 */
function getDateRange (timePeriod, startDate, endDate) {
  const now = new Date()
  const result = { startDate: null, endDate: now }
  
  // Custom date range takes precedence
  if (startDate && endDate) {
    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    }
  }
  
  if (timePeriod === 'last7days') {
    result.startDate = new Date(now)
    result.startDate.setDate(now.getDate() - 7)
  } else if (timePeriod === 'last30days') {
    result.startDate = new Date(now)
    result.startDate.setDate(now.getDate() - 30)
  } else if (timePeriod === 'last90days') {
    result.startDate = new Date(now)
    result.startDate.setDate(now.getDate() - 90)
  } else if (timePeriod === 'all') {
    result.startDate = null
  }
  
  return result
}

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
function calculatePercentChange (current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// ==================== DASHBOARD ANALYTICS ====================

/**
 * Get dashboard analytics with optional filters
 * @param {Object} filters - Query filters
 * @param {string} filters.degreeTypeId - Filter by specific degree type
 * @param {string} filters.timePeriod - Time period filter
 * @param {string} filters.startDate - Custom start date
 * @param {string} filters.endDate - Custom end date
 * @returns {Promise<Object>} Dashboard analytics data
 */
async function getDashboardAnalytics (filters = {}) {
  const { degreeTypeId, timePeriod, startDate, endDate } = filters
  const dateRange = getDateRange(timePeriod, startDate, endDate)
  
  // Build where clause for filtering
  const studentWhere = degreeTypeId ? { degreeTypeId } : {}
  const applicationWhere = {}
  const jobWhere = {}
  
  if (dateRange.startDate) {
    applicationWhere.createdAt = { gte: dateRange.startDate, lte: dateRange.endDate }
    jobWhere.createdAt = { gte: dateRange.startDate, lte: dateRange.endDate }
  }
  
  // If filtering by degree type, also filter applications by students of that degree
  if (degreeTypeId) {
    applicationWhere.student = { degreeTypeId }
  }
  
  // ===== SUMMARY METRICS =====
  const totalStudents = await prisma.student.count({ where: studentWhere })
  
  const studentsWithApplications = await prisma.student.count({
    where: {
      ...studentWhere,
      applications: { some: {} }
    }
  })
  
  const totalApplications = await prisma.application.count({ where: applicationWhere })
  
  const totalActiveJobs = await prisma.job.count({
    where: {
      application_deadline: { gt: new Date() }
    }
  })
  
  const applicationsByStatus = await prisma.application.groupBy({
    by: ['status'],
    where: applicationWhere,
    _count: true
  })
  
  const qualifiedCount = applicationsByStatus.find(a => a.status === 'QUALIFIED')?._count || 0
  const qualifiedRate = calculateQualifiedRate(qualifiedCount, totalApplications)
  
  // ===== APPLICATION METRICS =====
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  
  const thisMonthApplications = await prisma.application.count({
    where: {
      ...applicationWhere,
      createdAt: { gte: thisMonthStart }
    }
  })
  
  const lastMonthApplications = await prisma.application.count({
    where: {
      ...(degreeTypeId ? { student: { degreeTypeId } } : {}),
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
    }
  })
  
  const applicationPercentChange = calculatePercentChange(thisMonthApplications, lastMonthApplications)
  
  const byStatus = {
    pending: applicationsByStatus.find(a => a.status === 'PENDING')?._count || 0,
    qualified: qualifiedCount,
    rejected: applicationsByStatus.find(a => a.status === 'REJECTED')?._count || 0
  }
  
  const averagePerStudent = studentsWithApplications > 0
    ? Math.round((totalApplications / studentsWithApplications) * 10) / 10
    : 0
  
  // ===== JOB METRICS =====
  const thisMonthJobs = await prisma.job.count({
    where: {
      createdAt: { gte: thisMonthStart }
    }
  })
  
  const lastMonthJobs = await prisma.job.count({
    where: {
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
    }
  })
  
  const jobPercentChange = calculatePercentChange(thisMonthJobs, lastMonthJobs)
  
  const jobsByType = await prisma.job.groupBy({
    by: ['jobType'],
    _count: true
  })
  
  // Get application count per job type
  const jobTypeWithApplications = await Promise.all(
    jobsByType.map(async (jt) => {
      const applicationCount = await prisma.application.count({
        where: {
          ...applicationWhere,
          job: { jobType: jt.jobType }
        }
      })
      return {
        type: jt.jobType,
        count: jt._count,
        applications: applicationCount
      }
    })
  )
  
  // Get top companies
  const topCompaniesData = await prisma.job.groupBy({
    by: ['companyName'],
    _count: true,
    orderBy: { _count: { companyName: 'desc' } },
    take: 5
  })
  
  const topCompanies = await Promise.all(
    topCompaniesData.map(async (company) => {
      const applicationCount = await prisma.application.count({
        where: {
          ...applicationWhere,
          job: { companyName: company.companyName }
        }
      })
      return {
        companyName: company.companyName,
        jobCount: company._count,
        applicationCount
      }
    })
  )
  
  // ===== APPLICATION TRENDS =====
  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)
  
  const dailyApplications = await prisma.application.groupBy({
    by: ['createdAt'],
    where: {
      ...applicationWhere,
      createdAt: { gte: last30Days }
    },
    _count: true
  })
  
  const dailyJobs = await prisma.job.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: last30Days }
    },
    _count: true
  })
  
  // Aggregate by date (remove time component)
  const dailyTrendsMap = {}
  dailyApplications.forEach(app => {
    const date = new Date(app.createdAt).toISOString().split('T')[0]
    if (!dailyTrendsMap[date]) dailyTrendsMap[date] = { applications: 0, newJobs: 0 }
    dailyTrendsMap[date].applications += app._count
  })
  
  dailyJobs.forEach(job => {
    const date = new Date(job.createdAt).toISOString().split('T')[0]
    if (!dailyTrendsMap[date]) dailyTrendsMap[date] = { applications: 0, newJobs: 0 }
    dailyTrendsMap[date].newJobs += job._count
  })
  
  const daily = Object.keys(dailyTrendsMap)
    .sort()
    .slice(-30)
    .map(date => ({
      date,
      applications: dailyTrendsMap[date].applications,
      newJobs: dailyTrendsMap[date].newJobs
    }))
  
  // Monthly trends (last 6 months)
  const last6Months = new Date()
  last6Months.setMonth(last6Months.getMonth() - 6)
  
  const monthlyApplications = await prisma.application.findMany({
    where: {
      ...applicationWhere,
      createdAt: { gte: last6Months }
    },
    select: { createdAt: true }
  })
  
  const monthlyJobs = await prisma.job.findMany({
    where: {
      createdAt: { gte: last6Months }
    },
    select: { createdAt: true }
  })
  
  const monthlyTrendsMap = {}
  monthlyApplications.forEach(app => {
    const month = new Date(app.createdAt).toISOString().substring(0, 7)
    if (!monthlyTrendsMap[month]) monthlyTrendsMap[month] = { applications: 0, newJobs: 0 }
    monthlyTrendsMap[month].applications++
  })
  
  monthlyJobs.forEach(job => {
    const month = new Date(job.createdAt).toISOString().substring(0, 7)
    if (!monthlyTrendsMap[month]) monthlyTrendsMap[month] = { applications: 0, newJobs: 0 }
    monthlyTrendsMap[month].newJobs++
  })
  
  const monthly = Object.keys(monthlyTrendsMap)
    .sort()
    .map(month => ({
      month,
      applications: monthlyTrendsMap[month].applications,
      newJobs: monthlyTrendsMap[month].newJobs
    }))
  
  // ===== DEGREE TYPE BREAKDOWN =====
  const degreeTypes = await prisma.degreeType.findMany({
    include: {
      students: {
        where: degreeTypeId ? { degreeTypeId } : {},
        include: {
          applications: {
            where: dateRange.startDate ? { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}
          }
        }
      }
    }
  })
  
  const degreeTypeBreakdown = degreeTypes.map(dt => {
    const studentCount = dt.students.length
    const allApplications = dt.students.flatMap(s => s.applications)
    const applicationCount = allApplications.length
    const qualifiedCount = allApplications.filter(a => a.status === 'QUALIFIED').length
    const qualifiedRate = calculateQualifiedRate(qualifiedCount, applicationCount)
    
    const gpas = dt.students.map(s => s.gpa).filter(gpa => gpa !== null)
    const averageGPA = gpas.length > 0
      ? Math.round((gpas.reduce((sum, gpa) => sum + gpa, 0) / gpas.length) * 100) / 100
      : 0
    
    return {
      degreeTypeId: dt.id,
      degreeTypeName: dt.name,
      studentCount,
      applicationCount,
      qualifiedCount,
      qualifiedRate,
      averageGPA
    }
  }).filter(dt => dt.studentCount > 0)
  
  // ===== RECENT ACTIVITY =====
  const recentApplications = await prisma.application.findMany({
    where: applicationWhere,
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      student: {
        include: {
          user: true
        }
      },
      job: true
    }
  })
  
  const recentActivity = recentApplications.map(app => ({
    studentName: `${app.student.user.name} ${app.student.user.surname}`,
    jobTitle: app.job.title,
    companyName: app.job.companyName,
    appliedAt: app.createdAt,
    status: app.status
  }))
  
  // ===== RETURN COMPLETE DASHBOARD =====
  return {
    summary: {
      totalStudents,
      studentsWithApplications,
      totalApplications,
      totalActiveJobs,
      qualifiedRate
    },
    applicationMetrics: {
      thisMonth: {
        count: thisMonthApplications,
        percentChange: applicationPercentChange,
        trend: determineTrend(applicationPercentChange)
      },
      byStatus,
      averagePerStudent
    },
    jobMetrics: {
      activeJobPostings: totalActiveJobs,
      thisMonth: {
        newJobs: thisMonthJobs,
        percentChange: jobPercentChange,
        trend: determineTrend(jobPercentChange)
      },
      byJobType: jobTypeWithApplications,
      topCompanies
    },
    applicationTrends: {
      daily,
      monthly
    },
    degreeTypeBreakdown,
    recentActivity
  }
}

// ==================== STUDENT LIST ====================

/**
 * Get paginated student list with filters and sorting
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Students array with pagination
 */
async function getStudentList (params = {}) {
  const {
    degreeTypeId,
    year,
    status,
    hasApplications,
    search,
    sortBy = 'name',
    order = 'asc',
    page = 1,
    limit = 20
  } = params
  
  // Ensure limit doesn't exceed max
  const safeLimit = Math.min(parseInt(limit) || 20, 100)
  const safePage = parseInt(page) || 1
  const skip = (safePage - 1) * safeLimit
  
  // Build where clause
  const where = {}
  const andConditions = []
  
  if (degreeTypeId) {
    where.degreeTypeId = degreeTypeId
  }
  
  // Year filtering (convert year to expectedGraduationYear)
  if (year) {
    const currentYear = new Date().getFullYear()
    if (year === '4+') {
      where.expectedGraduationYear = { lte: currentYear }
    } else {
      const yearNum = parseInt(year)
      const expectedYear = currentYear + (5 - yearNum)
      where.expectedGraduationYear = expectedYear
    }
  }
  
  // Search by name or email
  if (search) {
    andConditions.push({
      OR: [
        { user: { name: { contains: search } } },
        { user: { surname: { contains: search } } },
        { user: { email: { contains: search } } }
      ]
    })
  }
  
  // Has applications filter
  if (hasApplications !== undefined) {
    const hasApps = hasApplications === 'true' || hasApplications === true
    if (hasApps) {
      where.applications = { some: {} }
    } else {
      where.applications = { none: {} }
    }
  }
  
  // Status filter (filter by most recent application status)
  if (status) {
    where.applications = {
      ...(where.applications || {}),
      some: { status }
    }
  }
  
  // Combine AND conditions if search is used
  if (andConditions.length > 0) {
    where.AND = andConditions
  }
  
  // Get total count
  const total = await prisma.student.count({ where })
  const totalPages = Math.ceil(total / safeLimit)
  
  // Fetch students with relations
  const students = await prisma.student.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          verified: true,
          phoneNumber: true,
          createdAt: true
        }
      },
      degreeType: true,
      applications: {
        orderBy: { createdAt: 'desc' }
      }
    },
    skip,
    take: safeLimit
  })
  
  // Transform students and calculate stats
  let transformedStudents = students.map(student => {
    const applications = student.applications
    const total = applications.length
    const pending = applications.filter(a => a.status === 'PENDING').length
    const qualified = applications.filter(a => a.status === 'QUALIFIED').length
    const rejected = applications.filter(a => a.status === 'REJECTED').length
    const qualifiedRate = calculateQualifiedRate(qualified, total)
    
    const recentApplication = applications[0]
    const recentStatus = recentApplication ? recentApplication.status : null
    const lastApplicationDate = recentApplication ? recentApplication.createdAt : null
    
    return {
      studentId: student.id,
      userId: student.user.id,
      name: student.user.name,
      surname: student.user.surname,
      fullName: `${student.user.name} ${student.user.surname}`,
      email: student.user.email,
      degreeType: {
        id: student.degreeType.id,
        name: student.degreeType.name
      },
      year: calculateStudentYear(student.expectedGraduationYear),
      expectedGraduationYear: student.expectedGraduationYear,
      gpa: student.gpa,
      verified: student.user.verified,
      hasResume: student.resumeKey !== null,
      hasTranscript: student.transcriptKey !== null,
      applicationStats: {
        total,
        pending,
        qualified,
        rejected,
        qualifiedRate
      },
      recentStatus,
      lastApplicationDate,
      createdAt: student.user.createdAt,
      _sortFields: {
        applications: total,
        qualifiedRate,
        lastActivity: lastApplicationDate,
        gpa: student.gpa || 0
      }
    }
  })
  
  // Sort (some fields require post-query sorting)
  if (sortBy === 'name') {
    transformedStudents.sort((a, b) => {
      const comparison = a.fullName.localeCompare(b.fullName)
      return order === 'asc' ? comparison : -comparison
    })
  } else if (sortBy === 'applications') {
    transformedStudents.sort((a, b) => {
      const comparison = a._sortFields.applications - b._sortFields.applications
      return order === 'asc' ? comparison : -comparison
    })
  } else if (sortBy === 'qualifiedRate') {
    transformedStudents.sort((a, b) => {
      const comparison = a._sortFields.qualifiedRate - b._sortFields.qualifiedRate
      return order === 'asc' ? comparison : -comparison
    })
  } else if (sortBy === 'lastActivity') {
    transformedStudents.sort((a, b) => {
      const dateA = a._sortFields.lastActivity ? new Date(a._sortFields.lastActivity) : new Date(0)
      const dateB = b._sortFields.lastActivity ? new Date(b._sortFields.lastActivity) : new Date(0)
      const comparison = dateA - dateB
      return order === 'asc' ? comparison : -comparison
    })
  } else if (sortBy === 'gpa') {
    transformedStudents.sort((a, b) => {
      const comparison = a._sortFields.gpa - b._sortFields.gpa
      return order === 'asc' ? comparison : -comparison
    })
  }
  
  // Remove internal sort fields before returning
  transformedStudents = transformedStudents.map(s => {
    const { _sortFields, ...rest } = s
    return rest
  })
  
  return {
    students: transformedStudents,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages
    },
    summary: {
      totalStudents: total,
      filteredCount: transformedStudents.length
    }
  }
}

// ==================== STUDENT DETAIL ====================

/**
 * Get detailed information for a specific student
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Student detail with application history
 * @throws {Error} If student not found
 */
async function getStudentDetail (studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          phoneNumber: true,
          avatarKey: true,
          verified: true,
          createdAt: true
        }
      },
      degreeType: true,
      applications: {
        include: {
          job: {
            include: {
              hr: {
                include: {
                  user: true
                }
              }
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
  
  if (!student) {
    const error = new Error('Student not found')
    error.statusCode = 404
    throw error
  }
  
  // Build personal info
  const personalInfo = {
    name: student.user.name,
    surname: student.user.surname,
    fullName: `${student.user.name} ${student.user.surname}`,
    email: student.user.email,
    phoneNumber: student.user.phoneNumber,
    address: student.address,
    avatarUrl: student.user.avatarKey ? `/api/users/avatar/${student.user.id}` : null,
    verified: student.user.verified,
    joinedAt: student.user.createdAt
  }
  
  // Build academic info
  const academicInfo = {
    degreeType: {
      id: student.degreeType.id,
      name: student.degreeType.name
    },
    currentYear: calculateStudentYear(student.expectedGraduationYear),
    expectedGraduationYear: student.expectedGraduationYear,
    gpa: student.gpa,
    hasResume: student.resumeKey !== null,
    hasTranscript: student.transcriptKey !== null,
    hasVerificationDoc: student.verificationDocKey !== null
  }
  
  // Build application statistics
  const applications = student.applications
  const total = applications.length
  const byStatus = {
    pending: applications.filter(a => a.status === 'PENDING').length,
    qualified: applications.filter(a => a.status === 'QUALIFIED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length
  }
  const qualifiedRate = calculateQualifiedRate(byStatus.qualified, total)
  
  const applicationDates = applications.map(a => new Date(a.createdAt)).filter(d => d)
  const firstApplicationDate = applicationDates.length > 0
    ? new Date(Math.min(...applicationDates))
    : null
  const lastApplicationDate = applicationDates.length > 0
    ? new Date(Math.max(...applicationDates))
    : null
  
  // Calculate average applications per month
  let averageApplicationsPerMonth = 0
  if (firstApplicationDate && lastApplicationDate && total > 0) {
    const monthsDiff = (lastApplicationDate - firstApplicationDate) / (1000 * 60 * 60 * 24 * 30)
    averageApplicationsPerMonth = monthsDiff > 0
      ? Math.round((total / monthsDiff) * 10) / 10
      : total
  }
  
  const applicationStatistics = {
    total,
    byStatus,
    qualifiedRate,
    firstApplicationDate,
    lastApplicationDate,
    averageApplicationsPerMonth
  }
  
  // Build job preferences
  const jobTypes = applications.map(a => a.job.jobType)
  const jobTypeCount = {}
  jobTypes.forEach(type => {
    jobTypeCount[type] = (jobTypeCount[type] || 0) + 1
  })
  const mostAppliedJobType = Object.keys(jobTypeCount).length > 0
    ? Object.keys(jobTypeCount).reduce((a, b) => jobTypeCount[a] > jobTypeCount[b] ? a : b)
    : null
  
  const locations = applications.map(a => a.job.location)
  const locationCount = {}
  locations.forEach(loc => {
    locationCount[loc] = (locationCount[loc] || 0) + 1
  })
  const mostAppliedLocations = Object.entries(locationCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([loc]) => loc)
  
  const jobPreferences = {
    mostAppliedJobType,
    mostAppliedLocations,
    interestedJobsCount: student.interests.length
  }
  
  // Build application history
  const applicationHistory = applications.map(app => ({
    applicationId: app.id,
    job: {
      id: app.job.id,
      title: app.job.title,
      companyName: app.job.companyName,
      jobType: app.job.jobType,
      location: app.job.location,
      workArrangement: app.job.workArrangement,
      salaryRange: `${app.job.minSalary.toLocaleString()} - ${app.job.maxSalary.toLocaleString()} THB`
    },
    status: app.status,
    appliedAt: app.createdAt,
    lastUpdated: app.updatedAt
  }))
  
  // Build interested jobs
  const appliedJobIds = new Set(applications.map(a => a.jobId))
  const interestedJobs = student.interests.map(interest => ({
    jobId: interest.job.id,
    title: interest.job.title,
    companyName: interest.job.companyName,
    hasApplied: appliedJobIds.has(interest.job.id),
    postedAt: interest.job.createdAt
  }))
  
  return {
    student: {
      studentId: student.id,
      userId: student.user.id,
      personalInfo,
      academicInfo,
      applicationStatistics,
      jobPreferences
    },
    applicationHistory,
    interestedJobs
  }
}

module.exports = {
  // Utility functions (exported for testing)
  calculateStudentYear,
  calculateQualifiedRate,
  determineTrend,
  getDateRange,
  
  // Main service functions
  getDashboardAnalytics,
  getStudentList,
  getStudentDetail
}
