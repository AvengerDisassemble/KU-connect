import { test as base } from '@playwright/test';

const professorUser = {
  id: 'prof-001',
  name: 'Dr. Kanya',
  surname: 'Suriyakul',
  email: 'prof@ku.th',
  role: 'PROFESSOR',
  verified: true,
};

const analyticsPayload = {
  summary: {
    totalStudents: 42,
    studentsWithApplications: 30,
    totalApplications: 120,
    totalActiveJobs: 18,
    qualifiedRate: 0.64,
  },
  applicationMetrics: {
    thisMonth: {
      count: 18,
      percentChange: 6,
      trend: 'increasing',
    },
    byStatus: {
      pending: 6,
      qualified: 9,
      rejected: 3,
    },
    averagePerStudent: 2.5,
  },
  jobMetrics: {
    activeJobPostings: 18,
    thisMonth: {
      newJobs: 8,
      percentChange: 12,
      trend: 'increasing',
    },
    byJobType: [
      { type: 'internship', count: 9, applications: 40 },
      { type: 'full-time', count: 5, applications: 32 },
      { type: 'part-time', count: 3, applications: 18 },
      { type: 'contract', count: 1, applications: 6 },
    ],
    topCompanies: [
      { companyName: 'Future Labs', jobCount: 6, applicationCount: 28 },
      { companyName: 'Insight Analytics', jobCount: 4, applicationCount: 22 },
      { companyName: 'DesignHub', jobCount: 3, applicationCount: 16 },
    ],
  },
  applicationTrends: {
    daily: [
      { date: '2025-02-01', applications: 5, newJobs: 1 },
      { date: '2025-02-02', applications: 7, newJobs: 2 },
      { date: '2025-02-03', applications: 6, newJobs: 1 },
      { date: '2025-02-04', applications: 8, newJobs: 1 },
    ],
    monthly: [
      { month: '2024-11', applications: 30, newJobs: 10 },
      { month: '2024-12', applications: 36, newJobs: 12 },
      { month: '2025-01', applications: 42, newJobs: 14 },
      { month: '2025-02', applications: 12, newJobs: 4 },
    ],
  },
  degreeTypeBreakdown: [
    {
      degreeTypeId: 'deg-bach',
      degreeTypeName: 'Bachelor',
      studentCount: 24,
      applicationCount: 66,
      qualifiedCount: 18,
      qualifiedRate: 0.62,
      averageGPA: 3.4,
    },
    {
      degreeTypeId: 'deg-mast',
      degreeTypeName: 'Master',
      studentCount: 12,
      applicationCount: 36,
      qualifiedCount: 10,
      qualifiedRate: 0.55,
      averageGPA: 3.6,
    },
  ],
  recentActivity: [
    {
      studentId: 'stu-001',
      studentName: 'Anya T.',
      action: 'Submitted application to Future Labs',
      timestamp: new Date('2025-02-03T09:00:00Z').toISOString(),
    },
    {
      studentId: 'stu-002',
      studentName: 'Chai P.',
      action: 'Accepted offer at Insight Analytics',
      timestamp: new Date('2025-02-02T15:30:00Z').toISOString(),
    },
  ],
};

const studentsPayload = {
  students: [
    {
      studentId: 'stu-001',
      userId: 'student-001',
      name: 'Anya',
      surname: 'Tanaporn',
      fullName: 'Anya Tanaporn',
      email: 'anya.t@ku.th',
      degreeType: { id: 'deg-bach', name: 'Bachelor' },
      year: 4,
      expectedGraduationYear: 2025,
      gpa: 3.58,
      verified: true,
      hasResume: true,
      hasTranscript: true,
      applicationStats: {
        total: 6,
        pending: 2,
        qualified: 3,
        rejected: 1,
        qualifiedRate: 0.5,
      },
      recentStatus: 'Interview scheduled',
      lastApplicationDate: '2025-02-02T10:00:00Z',
      createdAt: '2023-08-10T00:00:00Z',
    },
    {
      studentId: 'stu-002',
      userId: 'student-002',
      name: 'Chai',
      surname: 'Phan',
      fullName: 'Chai Phan',
      email: 'chai.p@ku.th',
      degreeType: { id: 'deg-mast', name: 'Master' },
      year: 2,
      expectedGraduationYear: 2024,
      gpa: 3.75,
      verified: true,
      hasResume: true,
      hasTranscript: false,
      applicationStats: {
        total: 4,
        pending: 1,
        qualified: 2,
        rejected: 1,
        qualifiedRate: 0.5,
      },
      recentStatus: 'Offer accepted',
      lastApplicationDate: '2025-01-28T14:30:00Z',
      createdAt: '2023-06-15T00:00:00Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 50,
    total: 2,
    totalPages: 1,
  },
  summary: {
    totalStudents: 2,
    filteredCount: 2,
  },
};

const fulfillJson = (route: any, body: unknown) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/api/**', async (route, request) => {
      const url = new URL(request.url());
      const path = url.pathname;
      const method = request.method().toUpperCase();

      if (method === 'POST' && path.endsWith('/login')) {
        const body = (request.postDataJSON?.() ?? {}) as { email?: string; password?: string };
        if (body.email === professorUser.email && body.password === 'Password123') {
          await fulfillJson(route, {
            success: true,
            message: 'Login successful',
            data: {
              user: professorUser,
              accessToken: 'prof-access-token',
              refreshToken: 'prof-refresh-token',
            },
          });
          return;
        }

        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid credentials',
          }),
        });
        return;
      }

      if (method === 'GET' && path.endsWith('/professor/analytics/dashboard')) {
        await fulfillJson(route, {
          success: true,
          message: 'Analytics fetched',
          data: analyticsPayload,
        });
        return;
      }

      if (method === 'GET' && path.includes('/professor/students')) {
        await fulfillJson(route, {
          success: true,
          message: 'Students fetched',
          data: studentsPayload,
        });
        return;
      }

      if (method === 'POST' && path.endsWith('/logout')) {
        await fulfillJson(route, { success: true, message: 'Logged out', data: {} });
        return;
      }

      await route.continue();
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
