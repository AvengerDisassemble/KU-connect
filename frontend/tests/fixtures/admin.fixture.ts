import { test as base } from '@playwright/test';

type MockUser = {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: 'admin' | 'employer' | 'student' | 'professor';
  verified: boolean;
  password: string;
};

type AnnouncementRecord = {
  id: string;
  title: string;
  content: string;
  audience: 'ALL' | 'STUDENTS' | 'EMPLOYERS' | 'PROFESSORS' | 'ADMINS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name?: string;
    surname?: string;
  } | null;
};

type JobDetailRecord = {
  id: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  jobType: string;
  workArrangement: string;
  duration: string;
  minSalary: number;
  maxSalary: number;
  application_deadline: string;
  email: string;
  phone_number: string;
  other_contact_information?: string | null;
  tags: { id: string; name: string }[];
  requirements: { id: string; text: string }[];
  qualifications: { id: string; text: string }[];
  responsibilities: { id: string; text: string }[];
  benefits: { id: string; text: string }[];
  createdAt: string;
  updatedAt: string;
  hr?: {
    id: string;
    companyName?: string | null;
  } | null;
};

type JobReportRecord = {
  id: string;
  jobId: string;
  userId: string;
  reason: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    description?: string | null;
    createdAt: string;
    hr?: {
      id: string;
      companyName?: string | null;
    } | null;
  } | null;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

const mockUsers: Record<string, MockUser> = {
  'admin@ku.th': {
    id: 'admin-001',
    name: 'Anucha',
    surname: 'Srisawat',
    email: 'admin@ku.th',
    role: 'admin',
    verified: true,
    password: 'Password123',
  },
  'hr1@company.com': {
    id: 'cmhvfmg0j0002kidix73p1pr8',
    name: 'Harry',
    surname: 'Recruiter',
    email: 'hr1@company.com',
    role: 'employer',
    verified: true,
    password: 'Password123',
  },
  'student1@ku.th': {
    id: 'student-001',
    name: 'Anya',
    surname: 'Tanaporn',
    email: 'student1@ku.th',
    role: 'student',
    verified: true,
    password: 'Password123',
  },
};

const baseJobDetails: Record<string, JobDetailRecord> = {
  'job-tech-intern': {
    id: 'job-tech-intern',
    title: 'Technical Intern',
    companyName: 'DataCore',
    description:
      'Assist the core data platform team with ETL pipelines, build monitoring dashboards, and document recurring incidents for escalation.',
    location: 'Bangkok, Thailand (On-site)',
    jobType: 'internship',
    workArrangement: 'on-site',
    duration: '3 months',
    minSalary: 12000,
    maxSalary: 15000,
    application_deadline: '2025-11-30T00:00:00Z',
    email: 'talent@datacore.com',
    phone_number: '+66-80-234-5678',
    other_contact_information: 'Line: @datacore-careers',
    tags: [
      { id: 'tag-sql', name: 'SQL' },
      { id: 'tag-python', name: 'Python' },
    ],
    requirements: [
      { id: 'req-1', text: 'Comfortable with SQL queries and data modeling.' },
      { id: 'req-2', text: 'Basic understanding of cloud services.' },
    ],
    qualifications: [
      { id: 'qual-1', text: 'Currently pursuing Computer Engineering or related field.' },
    ],
    responsibilities: [
      { id: 'res-1', text: 'Maintain nightly ETL checks and alerting.' },
      { id: 'res-2', text: 'Partner with analysts to define data validation rules.' },
    ],
    benefits: [
      { id: 'ben-1', text: 'Lunch stipend and transportation support.' },
      { id: 'ben-2', text: '1:1 mentorship with senior data engineer.' },
    ],
    createdAt: new Date('2025-01-05T08:00:00Z').toISOString(),
    updatedAt: new Date('2025-02-01T08:00:00Z').toISOString(),
    hr: {
      id: 'hr-001',
      companyName: 'DataCore',
    },
  },
  'job-contract-onsite': {
    id: 'job-contract-onsite',
    title: 'Contract On-site Role',
    companyName: 'NextWave Studio',
    description:
      'Short-term on-site contract to support client outreach and workshop logistics for the innovation studio.',
    location: 'Chiang Mai, Thailand (On-site)',
    jobType: 'contract',
    workArrangement: 'on-site',
    duration: '6 months',
    minSalary: 18000,
    maxSalary: 22000,
    application_deadline: '2025-11-25T00:00:00Z',
    email: 'careers@nextwave.studio',
    phone_number: '+66-82-777-8899',
    other_contact_information: null,
    tags: [
      { id: 'tag-ops', name: 'Operations' },
      { id: 'tag-client', name: 'Client Success' },
    ],
    requirements: [
      { id: 'req-3', text: 'Ability to host on-site client workshops.' },
      { id: 'req-4', text: 'Excellent Thai and English communication.' },
    ],
    qualifications: [
      { id: 'qual-2', text: '1+ years in customer-facing roles.' },
    ],
    responsibilities: [
      { id: 'res-3', text: 'Manage logistics for twice-weekly innovation labs.' },
      { id: 'res-4', text: 'Prepare weekly engagement reports for leadership.' },
    ],
    benefits: [
      { id: 'ben-3', text: 'Housing stipend for out-of-province hires.' },
      { id: 'ben-4', text: 'Travel reimbursement for client visits.' },
    ],
    createdAt: new Date('2025-01-12T08:00:00Z').toISOString(),
    updatedAt: new Date('2025-02-02T08:00:00Z').toISOString(),
    hr: {
      id: 'hr-002',
      companyName: 'NextWave Studio',
    },
  },
};

const cloneJobDetail = (detail: JobDetailRecord): JobDetailRecord => ({
  ...detail,
  tags: detail.tags.map((tag) => ({ ...tag })),
  requirements: detail.requirements.map((item) => ({ ...item })),
  qualifications: detail.qualifications.map((item) => ({ ...item })),
  responsibilities: detail.responsibilities.map((item) => ({ ...item })),
  benefits: detail.benefits.map((item) => ({ ...item })),
});

const createJobDetails = () =>
  Object.fromEntries(
    Object.entries(baseJobDetails).map(([id, detail]) => [id, cloneJobDetail(detail)])
  );

const createInitialJobReports = (): JobReportRecord[] => [
  {
    id: 'report-001',
    jobId: 'job-tech-intern',
    userId: 'reporter-001',
    reason: 'i dont like this job',
    createdAt: new Date('2025-02-04T09:00:00Z').toISOString(),
    job: {
      id: 'job-tech-intern',
      title: baseJobDetails['job-tech-intern'].title,
      description: baseJobDetails['job-tech-intern'].description,
      createdAt: baseJobDetails['job-tech-intern'].createdAt,
      hr: {
        id: 'hr-001',
        companyName: baseJobDetails['job-tech-intern'].companyName,
      },
    },
    user: {
      id: 'stu-201',
      name: 'Anya T.',
      email: 'anya.t@ku.th',
    },
  },
  {
    id: 'report-002',
    jobId: 'job-contract-onsite',
    userId: 'reporter-002',
    reason: 'not relieable information',
    createdAt: new Date('2025-02-05T11:30:00Z').toISOString(),
    job: {
      id: 'job-contract-onsite',
      title: baseJobDetails['job-contract-onsite'].title,
      description: baseJobDetails['job-contract-onsite'].description,
      createdAt: baseJobDetails['job-contract-onsite'].createdAt,
      hr: {
        id: 'hr-002',
        companyName: baseJobDetails['job-contract-onsite'].companyName,
      },
    },
    user: {
      id: 'emp-450',
      name: 'Chai P.',
      email: 'chai.p@outreach.com',
    },
  },
];

let jobDetails = createJobDetails();
let jobReports = createInitialJobReports();
let resolvedReportCount = 0;

const adminDashboardMock = {
  users: {
    total: 1200,
    byStatus: {
      pending: 32,
      approved: 1100,
      rejected: 40,
      suspended: 28,
    },
    byRole: {
      student: 800,
      employer: 250,
      professor: 120,
      admin: 30,
    },
    growth: {
      thisWeek: 25,
      thisMonth: 80,
    },
    metrics: {
      approvalRate: 0.91,
      pendingRate: 0.03,
      rejectionRate: 0.06,
    },
  },
  jobs: {
    total: 320,
    active: 210,
    inactive: 110,
    growth: {
      thisWeek: 14,
    },
    metrics: {
      activeRate: 0.66,
    },
  },
  applications: {
    total: 1850,
    thisMonth: 210,
    byStatus: {
      pending: 420,
      qualified: 980,
      rejected: 450,
    },
    growth: {
      thisWeek: 32,
    },
    metrics: {
      qualificationRate: 0.53,
      rejectionRate: 0.24,
      averagePerJob: 8.8,
    },
  },
  announcements: {
    total: 18,
    active: 12,
    inactive: 6,
  },
  reports: {
    total: 34,
    unresolved: 8,
    resolved: 26,
  },
  trending: {
    jobs: [
      { id: 'trend-job-1', title: 'Backend Intern', applicationsThisWeek: 34 },
      { id: 'trend-job-2', title: 'UX Researcher', applicationsThisWeek: 21 },
    ],
  },
  alerts: {
    pendingApprovals: 12,
    unresolvedReports: 5,
    inactiveJobs: 18,
  },
  recentActivity: [
    {
      type: 'approval',
      title: 'New employer approved',
      description: 'Future Labs received approval',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'report',
      title: 'Job report resolved',
      description: 'Spam listing removed',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
  pendingVerifications: 7,
  userRegistrationTrend: [
    { date: '2025-02-01', count: 12 },
    { date: '2025-02-02', count: 18 },
    { date: '2025-02-03', count: 15 },
  ],
  quickActions: ['Review pending users', 'Check reports', 'Post announcement'],
};

const fulfillJson = (route: any, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

const buildLoginResponse = (user: MockUser) => ({
  success: true,
  message: 'Login successful',
  data: {
    user: {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      verified: user.verified,
    },
    accessToken: `${user.id}-access-token`,
    refreshToken: `${user.id}-refresh-token`,
  },
});

const computeIsActive = (expiresAt: string | null) => {
  if (!expiresAt) {
    return true;
  }
  const expiresAtDate = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtDate)) {
    return true;
  }
  return expiresAtDate > Date.now();
};

const createInitialAnnouncements = (): AnnouncementRecord[] => {
  const initialExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  return [
    {
      id: 'ann-seed-1',
      title: 'System Maintenance Window',
      content: 'KU-Connect will undergo scheduled maintenance next weekend.',
      audience: 'ALL',
      priority: 'MEDIUM',
      expiresAt: initialExpiresAt,
      isActive: computeIsActive(initialExpiresAt),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creator: {
        id: 'admin-001',
        name: 'Anucha',
        surname: 'Srisawat',
      },
    },
  ];
};

let announcements = createInitialAnnouncements();

const resetAnnouncements = () => {
  announcements = createInitialAnnouncements();
};

const searchAnnouncementsMock = (payload: {
  search?: string;
  audience?: AnnouncementRecord['audience'];
  isActive?: boolean;
  page?: number;
  limit?: number;
}) => {
  const query = payload.search?.toLowerCase().trim();
  const matches = announcements.filter((announcement) => {
    const matchesSearch = query
      ? `${announcement.title} ${announcement.content}`.toLowerCase().includes(query)
      : true;
    const matchesAudience = payload.audience ? announcement.audience === payload.audience : true;
    const matchesStatus =
      typeof payload.isActive === 'boolean' ? announcement.isActive === payload.isActive : true;
    return matchesSearch && matchesAudience && matchesStatus;
  });

  const limit = payload.limit ?? 10;
  const page = payload.page && payload.page > 0 ? payload.page : 1;
  const start = (page - 1) * limit;
  const items = matches.slice(start, start + limit);

  return {
    announcements: items,
    pagination: {
      page,
      limit,
      total: matches.length,
      totalPages: Math.max(1, Math.ceil(matches.length / limit)),
    },
  };
};

const updateAnnouncementStats = () => {
  adminDashboardMock.announcements.total = announcements.length;
  adminDashboardMock.announcements.active = announcements.filter((a) => a.isActive).length;
  adminDashboardMock.announcements.inactive =
    adminDashboardMock.announcements.total - adminDashboardMock.announcements.active;
};

const updateReportStats = () => {
  adminDashboardMock.reports.total = resolvedReportCount + jobReports.length;
  adminDashboardMock.reports.unresolved = jobReports.length;
  adminDashboardMock.reports.resolved = resolvedReportCount;
};

const resetModerationData = () => {
  jobDetails = createJobDetails();
  jobReports = createInitialJobReports();
  resolvedReportCount = 0;
  updateReportStats();
};

const resolveReport = (reportId: string) => {
  const initialLength = jobReports.length;
  jobReports = jobReports.filter((report) => report.id !== reportId);
  if (jobReports.length !== initialLength) {
    resolvedReportCount += 1;
    updateReportStats();
    return true;
  }
  return false;
};

const deleteJobRecord = (jobId: string) => {
  const detail = jobDetails[jobId];
  if (!detail) {
    return null;
  }

  delete jobDetails[jobId];
  const removedReports = jobReports.filter((report) => report.jobId === jobId).length;
  if (removedReports > 0) {
    jobReports = jobReports.filter((report) => report.jobId !== jobId);
    resolvedReportCount += removedReports;
  }
  updateReportStats();
  return detail;
};

export const test = base.extend({
  page: async ({ page }, use) => {
    resetAnnouncements();
    resetModerationData();

    await page.route('**/api/**', async (route, request) => {
      const url = new URL(request.url());
      const path = url.pathname.toLowerCase();
      const method = request.method().toUpperCase();

      if (method === 'GET' && path.endsWith('/auth/me')) {
        await fulfillJson(route, 401, {
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      if (method === 'POST' && path.endsWith('/login')) {
        const body = (request.postDataJSON?.() ?? {}) as {
          email?: string;
          password?: string;
        };
        const email = body.email?.toLowerCase() ?? '';
        const password = body.password ?? '';
        const matchedUser = mockUsers[email];

        if (matchedUser && matchedUser.password === password) {
          await fulfillJson(route, 200, buildLoginResponse(matchedUser));
          return;
        }

        await fulfillJson(route, 401, {
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      if (method === 'GET' && path.endsWith('/admin/dashboard')) {
        await fulfillJson(route, 200, {
          success: true,
          message: 'Dashboard data retrieved successfully',
          data: adminDashboardMock,
        });
        return;
      }

      if (method === 'POST' && path.endsWith('/admin/announcements/search')) {
        let payload: {
          search?: string;
          audience?: AnnouncementRecord['audience'];
          isActive?: boolean;
          page?: number;
          limit?: number;
        } = {};
        try {
          payload = JSON.parse(request.postData() ?? '{}');
        } catch {
          payload = {};
        }

        await fulfillJson(route, 200, {
          success: true,
          message: 'Announcements retrieved',
          data: searchAnnouncementsMock(payload),
        });
        return;
      }

      if (method === 'POST' && path.endsWith('/admin/announcements')) {
        let payload: {
          title?: string;
          content?: string;
          audience?: AnnouncementRecord['audience'];
          priority?: AnnouncementRecord['priority'];
          expiresAt?: string | null;
        } = {};

        try {
          payload = JSON.parse(request.postData() ?? '{}');
        } catch {
          payload = {};
        }

        if (!payload.title || !payload.content || !payload.audience || !payload.priority) {
          await fulfillJson(route, 400, {
            success: false,
            message: 'Validation failed',
          });
          return;
        }

        const now = new Date().toISOString();
        const normalizedExpiresAt = payload.expiresAt ?? null;
        const record: AnnouncementRecord = {
          id: `ann-${Date.now()}`,
          title: payload.title,
          content: payload.content,
          audience: payload.audience,
          priority: payload.priority,
          expiresAt: normalizedExpiresAt,
          isActive: computeIsActive(normalizedExpiresAt),
          createdAt: now,
          updatedAt: now,
          creator: {
            id: 'admin-001',
            name: 'Anucha',
            surname: 'Srisawat',
          },
        };

        announcements.unshift(record);
        updateAnnouncementStats();

        await fulfillJson(route, 200, {
          success: true,
          message: 'Announcement created',
          data: record,
        });
        return;
      }

      if (method === 'GET' && path.includes('/job/report/list')) {
        await fulfillJson(route, 200, {
          success: true,
          message: 'Reports fetched',
          data: jobReports,
        });
        return;
      }

      const reportMatch = path.match(/\/job\/report\/([^/]+)$/);
      if (reportMatch && method === 'DELETE') {
        const reportId = reportMatch[1];
        const removed = resolveReport(reportId);
        if (removed) {
          await fulfillJson(route, 200, {
            success: true,
            message: 'Report marked as resolved',
            data: { id: reportId },
          });
        } else {
          await fulfillJson(route, 404, {
            success: false,
            message: 'Report not found',
          });
        }
        return;
      }

      const jobMatch = path.match(/\/job\/([^/]+)$/);
      if (jobMatch && !path.includes('/job/report/')) {
        const jobId = jobMatch[1];
        if (method === 'GET') {
          const detail = jobDetails[jobId];
          if (detail) {
            await fulfillJson(route, 200, {
              success: true,
              message: 'Job retrieved',
              data: detail,
            });
          } else {
            await fulfillJson(route, 404, {
              success: false,
              message: 'Job not found',
            });
          }
          return;
        }

        if (method === 'DELETE') {
          const deleted = deleteJobRecord(jobId);
          if (deleted) {
            await fulfillJson(route, 200, {
              success: true,
              message: 'Job deleted',
              data: deleted,
            });
          } else {
            await fulfillJson(route, 404, {
              success: false,
              message: 'Job not found',
            });
          }
          return;
        }
      }

      await route.continue();
    });

    await use(page);
  },
});

export const expect = test.expect;
