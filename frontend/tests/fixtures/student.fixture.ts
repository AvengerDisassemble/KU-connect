import { test as base } from '@playwright/test';

type StudentAccount = {
  id: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  role: 'STUDENT';
  status: 'APPROVED' | 'PENDING';
  verified: boolean;
};

type StudentProfile = {
  id: string;
  name: string;
  surname: string;
  email: string;
  verified: boolean;
  phoneNumber: string;
  updatedAt?: string;
  student: {
    id: string;
    userId: string;
    degreeTypeId: string;
    address: string;
    gpa?: number;
    expectedGraduationYear?: number;
    degreeType?: { id: string; name: string };
    resumeKey?: string | null;
    updatedAt?: string | null;
  };
};

type JobDetailEntry = { id: string; text: string };

type JobRecord = {
  id: string;
  hrId: string;
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
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string }[];
  requirements: JobDetailEntry[];
  qualifications: JobDetailEntry[];
  responsibilities: JobDetailEntry[];
  benefits: JobDetailEntry[];
  hr?: {
    id: string;
    companyName?: string | null;
    description?: string | null;
    address?: string | null;
    industry?: string | null;
    companySize?: string | null;
    website?: string | null;
    phoneNumber?: string | null;
  } | null;
};

type DashboardApplicationRecord = {
  id: string;
  jobId: string;
  status: 'PENDING' | 'QUALIFIED' | 'REJECTED';
  createdAt: string;
};

type DashboardJobSummary = {
  id: string;
  title: string;
  location: string;
  application_deadline: string;
  hr?: JobRecord['hr'];
};

type StudentNotificationRecord = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notificationType: 'ANNOUNCEMENT' | 'APPLICATION_STATUS' | 'EMPLOYER_APPLICATION';
  jobId?: string | null;
  applicationId?: string | null;
};

const degreeOptions = [
  { id: 'deg-bachelor', name: 'Bachelor' },
  { id: 'deg-master', name: 'Master' },
  { id: 'deg-doctor', name: 'Doctor' },
];

const JOB_LIST_PAGE_LIMIT = 4;
const STUDENT_DASHBOARD_RECENT_JOB_IDS = [
  'job-contract-developer',
  'job-part-time-remote',
  'job-ai-research-fellow',
];
const STUDENT_DASHBOARD_QUICK_ACTIONS = ['Browse jobs', 'Track applications', 'Update resume'];

const makeDetailEntries = (prefix: string, items: string[]): JobDetailEntry[] =>
  items.map((text, index) => ({
    id: `${prefix}-${index + 1}`,
    text,
  }));

let jobCatalog: Record<string, JobRecord> = {};
let appliedJobIds: Set<string> = new Set();
let jobResumeLinks: Record<string, { jobId: string; link: string; source: 'PROFILE' | 'UPLOADED' }> =
  {};
let studentAccounts: Record<string, StudentAccount> = {};
let studentProfiles: Record<string, StudentProfile> = {};
let studentNotifications: Record<string, StudentNotificationRecord[]> = {};
let savedJobIds: Set<string> = new Set();
let studentResume: {
  filename: string;
  contentType: string;
  content: string;
  updatedAt: string;
} | null = null;
let studentApplicationRecords: DashboardApplicationRecord[] = [];
let studentDashboardTimestamp = '';

const toJobResponse = (job: JobRecord) => ({
  ...job,
  isSaved: savedJobIds.has(job.id),
  isApplied: appliedJobIds.has(job.id),
});

const normalizeToken = (value?: string | null) =>
  value?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';

const filterJobsByPayload = (payload: {
  keyword?: string;
  jobType?: string;
  workArrangement?: string;
  location?: string;
}) => {
  const keyword = payload.keyword?.toLowerCase().trim();
  const jobTypeRaw = payload.jobType;
  const workArrangementRaw = payload.workArrangement;
  const locationRaw = payload.location;

  return Object.values(jobCatalog).filter((job) => {
    const matchesKeyword = keyword
      ? job.title.toLowerCase().includes(keyword) ||
        job.companyName.toLowerCase().includes(keyword) ||
        job.description.toLowerCase().includes(keyword)
      : true;
    const matchesJobType = jobTypeRaw
      ? normalizeToken(job.jobType) === normalizeToken(jobTypeRaw)
      : true;
    const matchesLocation = locationRaw
      ? normalizeToken(job.location) === normalizeToken(locationRaw)
      : true;
    const matchesWorkStyle = workArrangementRaw
      ? normalizeToken(job.workArrangement) === normalizeToken(workArrangementRaw)
      : true;

    return matchesKeyword && matchesJobType && matchesLocation && matchesWorkStyle;
  });
};

const summarizeJobForDashboard = (jobId: string): DashboardJobSummary | null => {
  const job = jobCatalog[jobId];
  if (!job) {
    return null;
  }

  const fallbackHr: NonNullable<JobRecord['hr']> = {
    id: job.hrId,
    companyName: job.companyName,
  };

  return {
    id: job.id,
    title: job.title,
    location: job.location,
    application_deadline: job.application_deadline,
    hr: job.hr ?? fallbackHr,
  };
};

const buildStudentDashboardPayload = () => {
  const recentJobs = STUDENT_DASHBOARD_RECENT_JOB_IDS.map((jobId) =>
    summarizeJobForDashboard(jobId)
  ).filter((job): job is DashboardJobSummary => Boolean(job));
  const myApplications = studentApplicationRecords
    .map((record) => {
      const job = summarizeJobForDashboard(record.jobId);
      if (!job) {
        return null;
      }
      return {
        id: record.id,
        status: record.status,
        createdAt: record.createdAt,
        job,
      };
    })
    .filter(
      (application): application is { id: string; status: DashboardApplicationRecord['status']; createdAt: string; job: DashboardJobSummary } =>
        Boolean(application)
    );

  return {
    userRole: 'STUDENT' as const,
    timestamp: studentDashboardTimestamp || new Date().toISOString(),
    dashboard: {
      recentJobs,
      myApplications,
      quickActions: [...STUDENT_DASHBOARD_QUICK_ACTIONS],
    },
  };
};

const toBackendNotification = (record: StudentNotificationRecord) => {
  const base = {
    id: record.id,
    userId: 'student-1',
    type: record.notificationType,
    title: record.title,
    message: record.content,
    priority: record.priority ?? 'LOW',
    isRead: record.isRead,
    createdAt: record.createdAt,
    senderId: null,
    announcementId: record.notificationType === 'ANNOUNCEMENT' ? record.id : null,
    jobId: record.jobId ?? null,
    applicationId: record.applicationId ?? null,
    sender: null,
  };

  return {
    ...base,
    announcement:
      record.notificationType === 'ANNOUNCEMENT'
        ? {
            id: record.id,
            title: record.title,
            content: record.content,
            priority: record.priority ?? 'LOW',
            audience: 'STUDENTS',
          }
        : null,
  };
};

const bootstrapState = () => {
  const baseAccount: StudentAccount = {
    id: 'student-1',
    name: 'Thanakorn',
    surname: 'Ratanaporn',
    email: 'student1@ku.ac.th',
    password: 'Password123',
    role: 'STUDENT',
    status: 'APPROVED',
    verified: true,
  };

  studentAccounts = {
    [baseAccount.email.toLowerCase()]: baseAccount,
  };

  const initialTimestamp = new Date('2025-01-10T08:00:00Z').toISOString();

  studentProfiles = {
    [baseAccount.id]: {
      id: baseAccount.id,
      name: baseAccount.name,
      surname: baseAccount.surname,
      email: baseAccount.email,
      verified: true,
      phoneNumber: '+66812345678',
      updatedAt: initialTimestamp,
      student: {
        id: 'student-profile-1',
        userId: baseAccount.id,
        degreeTypeId: 'deg-bachelor',
        address: 'Ram Inthra Road, Bangkok 10230',
        gpa: 3.45,
        expectedGraduationYear: 2026,
        degreeType: degreeOptions[0],
        resumeKey: null,
        updatedAt: initialTimestamp,
      },
    },
  };

  studentNotifications = {
    [baseAccount.id]: [
      {
        id: 'notif-contract-rejected',
        title: 'Application Update',
        content: 'Your job application for "Contract Developer" has been rejected.',
        isRead: false,
        createdAt: new Date('2025-02-15T07:00:00Z').toISOString(),
        priority: 'MEDIUM',
        notificationType: 'APPLICATION_STATUS',
        jobId: 'job-contract-developer',
        applicationId: 'application-contract-developer',
      },
      {
        id: 'notif-ux-qualified',
        title: 'Application Update',
        content: 'Great news! "UX Research Intern" has moved to qualified status.',
        isRead: false,
        createdAt: new Date('2025-02-14T15:30:00Z').toISOString(),
        priority: 'LOW',
        notificationType: 'APPLICATION_STATUS',
        jobId: 'job-ux-research-intern',
        applicationId: 'application-ux-research-intern',
      },
      {
        id: 'notif-campus-announcement',
        title: 'Career Fair Announcement',
        content: 'Join the KU career fair on February 20 at the main auditorium.',
        isRead: true,
        createdAt: new Date('2025-02-12T05:00:00Z').toISOString(),
        priority: 'LOW',
        notificationType: 'ANNOUNCEMENT',
      },
    ],
  };

  savedJobIds = new Set(['job-part-time-remote']);
  studentResume = null;
  appliedJobIds = new Set();
  jobResumeLinks = {};

  const jobSeeds: JobRecord[] = [
    {
      id: 'job-contract-developer',
      hrId: 'hr-100',
      title: 'Contract Developer',
      companyName: 'GlobalTech Solutions',
      description: 'Build and maintain mission-critical dashboards for enterprise clients.',
      location: 'Bangkok, Thailand',
      jobType: 'contract',
      workArrangement: 'remote',
      duration: '6 months',
      minSalary: 48000,
      maxSalary: 65000,
      application_deadline: '2025-12-31T23:59:59Z',
      email: 'talent@globaltech.com',
      phone_number: '+66 80 987 6543',
      other_contact_information: null,
      tags: [
        { id: 'tag-react', name: 'React' },
        { id: 'tag-node', name: 'Node.js' },
      ],
      requirements: makeDetailEntries('contract-dev-req', [
        '3+ years of JavaScript experience',
        'Strong understanding of distributed systems',
      ]),
      qualifications: makeDetailEntries('contract-dev-qual', [
        'Bachelor degree in Computer Science or related field',
        'Experience working with international teams',
      ]),
      responsibilities: makeDetailEntries('contract-dev-resp', [
        'Collaborate with UX and product partners',
        'Implement data visualizations from specs',
      ]),
      benefits: makeDetailEntries('contract-dev-benefits', [
        'Remote stipend',
        'Flexible schedule',
      ]),
      createdAt: new Date('2025-02-14T09:00:00Z').toISOString(),
      updatedAt: new Date('2025-02-14T09:00:00Z').toISOString(),
      hr: {
        id: 'hr-100',
        companyName: 'GlobalTech Solutions',
        description: 'Consulting partner for high-growth startups.',
        address: 'Bangkok',
        industry: 'Technology',
        companySize: '500+',
        website: 'https://globaltech.example.com',
        phoneNumber: '+66 80 987 6543',
      },
    },
    {
      id: 'job-part-time-remote',
      hrId: 'hr-200',
      title: 'Part-Time Remote Software Engineer',
      companyName: 'GlobalTech Consulting',
      description: 'Support feature development for a remote-first engineering team.',
      location: 'Bangkok, Thailand',
      jobType: 'part-time',
      workArrangement: 'remote',
      duration: 'Part-Time',
      minSalary: 18000,
      maxSalary: 30000,
      application_deadline: '2025-11-30T23:59:59Z',
      email: 'jobs@globaltechconsulting.com',
      phone_number: '+66 80 123 4567',
      other_contact_information: null,
      tags: [
        { id: 'tag-typescript', name: 'TypeScript' },
        { id: 'tag-remote', name: 'Remote Friendly' },
      ],
      requirements: makeDetailEntries('remote-eng-req', [
        'Experience with React and Node.js',
        'Comfortable collaborating asynchronously',
      ]),
      qualifications: makeDetailEntries('remote-eng-qual', [
        'Portfolio of shipped products',
        'Familiar with GitHub and CI pipelines',
      ]),
      responsibilities: makeDetailEntries('remote-eng-resp', [
        'Build UI components from Figma files',
        'Write integration tests for key flows',
      ]),
      benefits: makeDetailEntries('remote-eng-benefits', [
        'Remote work allowance',
        'Learning stipend',
      ]),
      createdAt: new Date('2025-02-15T09:00:00Z').toISOString(),
      updatedAt: new Date('2025-02-15T09:00:00Z').toISOString(),
      hr: {
        id: 'hr-200',
        companyName: 'GlobalTech Consulting',
        description: 'Boutique consultancy for startups.',
        address: 'Bangkok',
        industry: 'Software',
        companySize: '200-500',
        website: 'https://consulting.example.com',
        phoneNumber: '+66 80 123 4567',
      },
    },
    {
      id: 'job-fulltime-qa',
      hrId: 'hr-300',
      title: 'Full-Time QA Engineer',
      companyName: 'Future Innovations',
      description: 'Own exploratory testing for the IoT platform.',
      location: 'Phuket, Thailand',
      jobType: 'full-time',
      workArrangement: 'on-site',
      duration: 'Full-Time',
      minSalary: 40000,
      maxSalary: 52000,
      application_deadline: '2025-10-31T23:59:59Z',
      email: 'careers@futureinnovations.com',
      phone_number: '+66 85 222 3344',
      other_contact_information: null,
      tags: [
        { id: 'tag-qa', name: 'QA' },
        { id: 'tag-onsite', name: 'On-site' },
      ],
      requirements: makeDetailEntries('qa-req', [
        '3+ years testing backend APIs',
        'Experience with Cypress or Playwright',
      ]),
      qualifications: makeDetailEntries('qa-qual', [
        'ISTQB certification is a plus',
        'Comfortable collaborating with hardware teams',
      ]),
      responsibilities: makeDetailEntries('qa-resp', [
        'Design regression suites',
        'Mentor junior testers',
      ]),
      benefits: makeDetailEntries('qa-benefits', [
        'Gym membership',
        'Relocation support',
      ]),
      createdAt: new Date('2025-02-13T09:00:00Z').toISOString(),
      updatedAt: new Date('2025-02-13T09:00:00Z').toISOString(),
      hr: {
        id: 'hr-300',
        companyName: 'Future Innovations',
        description: 'Hardware and IoT research lab.',
        address: 'Phuket',
        industry: 'Hardware',
        companySize: '200-500',
        website: 'https://futureinnovations.example.com',
        phoneNumber: '+66 85 222 3344',
      },
    },
    {
      id: 'job-ux-research-intern',
      hrId: 'hr-400',
      title: 'UX Research Intern',
      companyName: 'DesignHub Studio',
      description: 'Assist the research pod with diary studies and interviews.',
      location: 'Bangkok, Thailand',
      jobType: 'internship',
      workArrangement: 'hybrid',
      duration: '3 months',
      minSalary: 12000,
      maxSalary: 15000,
      application_deadline: '2025-08-15T23:59:59Z',
      email: 'ux@designhub.com',
      phone_number: '+66 86 432 1999',
      other_contact_information: null,
      tags: [
        { id: 'tag-ux', name: 'UX Research' },
        { id: 'tag-hybrid', name: 'Hybrid' },
      ],
      requirements: makeDetailEntries('ux-req', [
        'Comfortable facilitating interviews',
        'Can synthesize qualitative insights',
      ]),
      qualifications: makeDetailEntries('ux-qual', [
        'Currently enrolled in design program',
        'Fluent in Thai and English',
      ]),
      responsibilities: makeDetailEntries('ux-resp', [
        'Support weekly user testing',
        'Maintain the research repository',
      ]),
      benefits: makeDetailEntries('ux-benefits', [
        'Hybrid work schedule',
        'Lunch stipend',
      ]),
      createdAt: new Date('2025-02-12T09:00:00Z').toISOString(),
      updatedAt: new Date('2025-02-12T09:00:00Z').toISOString(),
      hr: {
        id: 'hr-400',
        companyName: 'DesignHub Studio',
        description: 'Product design agency.',
        address: 'Bangkok',
        industry: 'Design',
        companySize: '50-100',
        website: 'https://designhub.example.com',
        phoneNumber: '+66 86 432 1999',
      },
    },
    {
      id: 'job-data-analyst-hybrid',
      hrId: 'hr-500',
      title: 'Hybrid Data Analyst',
      companyName: 'Insight Analytics',
      description: 'Create BI dashboards for energy clients.',
      location: 'Chiang Mai, Thailand',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Full-Time',
      minSalary: 38000,
      maxSalary: 47000,
      application_deadline: '2025-09-30T23:59:59Z',
      email: 'analytics@insight.com',
      phone_number: '+66 83 111 0000',
      other_contact_information: null,
      tags: [
        { id: 'tag-sql', name: 'SQL' },
        { id: 'tag-tableau', name: 'Tableau' },
      ],
      requirements: makeDetailEntries('data-req', [
        'Advanced SQL knowledge',
        'Experience with dashboard tools',
      ]),
      qualifications: makeDetailEntries('data-qual', [
        'Degree in statistics or economics',
        'Strong communication skills',
      ]),
      responsibilities: makeDetailEntries('data-resp', [
        'Build BI dashboards',
        'Present insights to stakeholders',
      ]),
      benefits: makeDetailEntries('data-benefits', [
        'Hybrid work style',
        'Professional development budget',
      ]),
      createdAt: new Date('2025-01-30T09:00:00Z').toISOString(),
      updatedAt: new Date('2025-01-30T09:00:00Z').toISOString(),
      hr: {
        id: 'hr-500',
        companyName: 'Insight Analytics',
        description: 'Energy-focused analytics firm.',
        address: 'Chiang Mai',
        industry: 'Consulting',
        companySize: '100-200',
        website: 'https://insight-analytics.example.com',
        phoneNumber: '+66 83 111 0000',
      },
    },
    {
      id: 'job-ai-research-fellow',
      hrId: 'hr-600',
      title: 'AI Research Fellow',
      companyName: 'Future Labs',
      description: 'Conduct applied ML research with academic partners.',
      location: 'Khon Kaen, Thailand',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: '12 months',
      minSalary: 60000,
      maxSalary: 80000,
      application_deadline: '2025-12-15T23:59:59Z',
      email: 'ai@futurelabs.com',
      phone_number: '+66 82 555 1212',
      other_contact_information: null,
      tags: [
        { id: 'tag-ml', name: 'Machine Learning' },
        { id: 'tag-research', name: 'Research' },
      ],
      requirements: makeDetailEntries('ai-req', [
        'Strong Python background',
        'Familiar with transformer architectures',
      ]),
      qualifications: makeDetailEntries('ai-qual', [
        'Graduate degree in Computer Science or related field',
        'Published research a plus',
      ]),
      responsibilities: makeDetailEntries('ai-resp', [
        'Prototype ML models',
        'Collaborate with universities',
      ]),
      benefits: makeDetailEntries('ai-benefits', [
        'Research budget',
        'Conference sponsorship',
      ]),
      createdAt: new Date('2025-01-29T09:00:00Z').toISOString(),
      updatedAt: new Date('2025-01-29T09:00:00Z').toISOString(),
      hr: {
        id: 'hr-600',
        companyName: 'Future Labs',
        description: 'Applied research lab.',
        address: 'Khon Kaen',
        industry: 'Research',
        companySize: '100-200',
        website: 'https://futurelabs.example.com',
        phoneNumber: '+66 82 555 1212',
      },
    },
  ];

  jobCatalog = jobSeeds.reduce<Record<string, JobRecord>>((acc, job) => {
    acc[job.id] = job;
    return acc;
  }, {});

  studentDashboardTimestamp = new Date('2025-02-15T08:45:00Z').toISOString();
  studentApplicationRecords = [
    {
      id: 'application-ux-research-intern',
      jobId: 'job-ux-research-intern',
      status: 'QUALIFIED',
      createdAt: new Date('2025-02-14T08:45:00Z').toISOString(),
    },
    {
      id: 'application-fulltime-qa',
      jobId: 'job-fulltime-qa',
      status: 'PENDING',
      createdAt: new Date('2025-02-12T15:30:00Z').toISOString(),
    },
    {
      id: 'application-contract-developer',
      jobId: 'job-contract-developer',
      status: 'REJECTED',
      createdAt: new Date('2025-02-10T11:00:00Z').toISOString(),
    },
  ];
  appliedJobIds = new Set(studentApplicationRecords.map((record) => record.jobId));
};

export const test = base.extend({
  page: async ({ page }, use) => {
    bootstrapState();

    await page.route('**/api/**', async (route, request) => {
      const url = new URL(request.url());
      const pathname = url.pathname;
      const method = request.method().toUpperCase();

      /**
       * Auth – Login
       */
      if (method === 'POST' && pathname.endsWith('/login')) {
        const body = (request.postDataJSON?.() ?? {}) as {
          email?: string;
          password?: string;
        };
        const key = body.email?.toLowerCase();
        const account = key ? studentAccounts[key] : undefined;

        if (account && body.password === account.password) {
          const { password, ...user } = account;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Login successful',
              data: { user },
            }),
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

      /**
       * Register alumni (student flow)
       */
      if (method === 'POST' && pathname.endsWith('/register/alumni')) {
        const body = (request.postDataJSON?.() ?? {}) as {
          name?: string;
          surname?: string;
          email?: string;
          password?: string;
          address?: string;
          degreeTypeId?: string;
          phoneNumber?: string;
        };

        if (
          !body.name ||
          !body.surname ||
          !body.email ||
          !body.password ||
          !body.address ||
          !body.degreeTypeId ||
          !body.phoneNumber
        ) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Missing required fields',
            }),
          });
          return;
        }

        const emailKey = body.email.toLowerCase();
        const newAccount: StudentAccount = {
          id: `student-${Date.now()}`,
          name: body.name,
          surname: body.surname,
          email: body.email,
          password: body.password,
          role: 'STUDENT',
          status: 'APPROVED',
          verified: true,
        };
        studentAccounts[emailKey] = newAccount;
        studentProfiles[newAccount.id] = {
          id: newAccount.id,
          name: newAccount.name,
          surname: newAccount.surname,
          email: newAccount.email,
          verified: true,
          phoneNumber: body.phoneNumber,
          student: {
            id: `student-profile-${Date.now()}`,
            userId: newAccount.id,
            degreeTypeId: body.degreeTypeId,
            address: body.address,
            gpa: undefined,
            expectedGraduationYear: undefined,
            degreeType:
              degreeOptions.find((opt) => opt.id === body.degreeTypeId) ||
              degreeOptions[0],
          },
        };

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Alumni registration successful',
            data: {
              user: {
                id: newAccount.id,
                name: newAccount.name,
                surname: newAccount.surname,
                email: newAccount.email,
                role: 'STUDENT',
              },
            },
          }),
        });
        return;
      }

      /**
       * Degree types
       */
      if (method === 'GET' && pathname.endsWith('/degree')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: degreeOptions,
          }),
        });
        return;
      }

      /**
       * Saved jobs list / toggle
       */
      const savedMatch = pathname.match(/\/save-jobs\/([^/]+)\/saved$/);
      if (savedMatch) {
        const userId = savedMatch[1];
        if (userId !== 'student-1') {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, message: 'User not found' }),
          });
          return;
        }

        if (method === 'GET') {
          const pageParam = Number(url.searchParams.get('page') ?? 1);
          const pageSizeRaw = url.searchParams.get('pageSize');
          const pageSizeFallback = savedJobIds.size || 25;
          const pageSizeParam = Number(pageSizeRaw ?? pageSizeFallback);
          const pageValue = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
          const pageSizeValue =
            Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? pageSizeParam : 25;
          const savedItems = Array.from(savedJobIds)
            .map((id) => {
              const record = jobCatalog[id];
              if (!record) return null;
              return {
                savedAt: new Date().toISOString(),
                job: toJobResponse(record),
              };
            })
            .filter((entry): entry is { savedAt: string; job: ReturnType<typeof toJobResponse> } =>
              Boolean(entry)
            );
          const start = (pageValue - 1) * pageSizeValue;
          const paged = savedItems.slice(start, start + pageSizeValue);

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                items: paged,
                total: savedItems.length,
                page: pageValue,
                pageSize: pageSizeValue,
              },
            }),
          });
          return;
        }

        if (method === 'POST') {
          const body = (request.postDataJSON?.() ?? {}) as { jobId?: string };
          if (body.jobId) savedJobIds.add(body.jobId);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Job saved',
              data: { id: `saved-${Date.now()}`, userId, jobId: body.jobId },
            }),
          });
          return;
        }

        if (method === 'DELETE') {
          const body = (request.postDataJSON?.() ?? {}) as { jobId?: string };
          if (body.jobId) savedJobIds.delete(body.jobId);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Removed saved job',
              data: {},
            }),
          });
          return;
        }
      }

      /**
       * Notifications
       */
      if (method === 'GET' && pathname.includes('/notifications')) {
        const notifications = studentNotifications['student-1'] ?? [];
        const entries = notifications.map(toBackendNotification);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              notifications: entries,
              unreadCount: notifications.filter((n) => !n.isRead).length,
              hasMore: false,
              lastFetchedAt: new Date().toISOString(),
            },
          }),
        });
        return;
      }

      const notifReadMatch = pathname.match(/\/notifications\/([^/]+)\/read$/);
      if (method === 'PATCH' && notifReadMatch) {
        const notifId = notifReadMatch[1];
        const list = studentNotifications['student-1'] ?? [];
        const target = list.find((n) => n.id === notifId);
        if (target) target.isRead = true;
        const entry = target
          ? toBackendNotification(target)
          : {
              id: notifId,
              userId: 'student-1',
              type: 'ANNOUNCEMENT',
              title: 'Notification updated',
              message: 'Notification state changed',
              priority: 'LOW',
              isRead: true,
              createdAt: new Date().toISOString(),
              senderId: null,
              announcementId: null,
              jobId: null,
              applicationId: null,
              sender: null,
              announcement: null,
            };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: entry,
          }),
        });
        return;
      }

      /**
       * Job list (student browse)
       */
      if (method === 'POST' && pathname.endsWith('/job/list')) {
        const body = (request.postDataJSON?.() ?? {}) as {
          page?: number;
          limit?: number;
          keyword?: string;
          jobType?: string;
          workArrangement?: string;
          location?: string;
        };
        const filteredJobs = filterJobsByPayload(body);
        const requestedPage = Number(body.page);
        const requestedLimit = Number(body.limit);
        const limitValue =
          Number.isFinite(requestedLimit) && requestedLimit > 0
            ? Math.min(requestedLimit, JOB_LIST_PAGE_LIMIT)
            : JOB_LIST_PAGE_LIMIT;
        const total = filteredJobs.length;
        const totalPages = Math.max(1, Math.ceil(total / limitValue));
        const pageValue =
          Number.isFinite(requestedPage) && requestedPage > 0
            ? Math.min(Math.trunc(requestedPage), totalPages)
            : 1;
        const startIndex = (pageValue - 1) * limitValue;
        const sortedJobs = [...filteredJobs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const paginatedJobs = sortedJobs.slice(startIndex, startIndex + limitValue).map(toJobResponse);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              jobs: paginatedJobs,
              total,
              page: pageValue,
              limit: limitValue,
            },
          }),
        });
        return;
      }

      const jobResumeMatch = pathname.match(/\/jobs\/([^/]+)\/resume$/);
      if (jobResumeMatch && method === 'POST') {
        const jobId = jobResumeMatch[1];
        const job = jobCatalog[jobId];
        if (!job) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Job not found',
            }),
          });
          return;
        }

        const payload = {
          jobId,
          link: `https://cdn.kuconnect.test/jobs/${jobId}/resume-${Date.now()}.pdf`,
          source: 'UPLOADED' as const,
        };
        jobResumeLinks[jobId] = payload;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Resume linked to job',
            data: payload,
          }),
        });
        return;
      }

      const jobDetailMatch = pathname.match(/\/job\/([^/]+)$/);
      if (jobDetailMatch) {
        const jobId = jobDetailMatch[1];
        const job = jobCatalog[jobId];
        if (!job) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Job not found',
            }),
          });
          return;
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: toJobResponse(job),
            }),
          });
          return;
        }

        if (method === 'POST') {
          const body = (request.postDataJSON?.() ?? {}) as { resumeLink?: string };
          if (!body.resumeLink) {
            await route.fulfill({
              status: 400,
              contentType: 'application/json',
              body: JSON.stringify({
                success: false,
                message: 'Missing resume link',
              }),
            });
            return;
          }

          appliedJobIds.add(jobId);
          const profile = studentProfiles['student-1'];
          const timestamp = new Date().toISOString();
          const applicationId = `application-${Date.now()}`;

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Application submitted',
              data: {
                id: applicationId,
                jobId,
                studentId: 'student-1',
                resumeId: jobResumeLinks[jobId]?.jobId ?? null,
                status: 'PENDING',
                createdAt: timestamp,
                updatedAt: timestamp,
                student: {
                  id: 'student-1',
                  degreeType: profile?.student.degreeType ?? null,
                  user: {
                    id: profile?.id ?? 'student-1',
                    name: profile?.name ?? 'Thanakorn',
                    surname: profile?.surname ?? 'Ratanaporn',
                    email: profile?.email ?? 'student1@ku.ac.th',
                  },
                  address: profile?.student.address ?? '',
                  gpa: profile?.student.gpa ?? null,
                  expectedGraduationYear: profile?.student.expectedGraduationYear ?? null,
                  interests: [],
                },
                resume: {
                  id: `resume-${Date.now()}`,
                  link: body.resumeLink,
                },
              },
            }),
          });
          return;
        }
      }

      /**
       * Avatar download
       */
      if (method === 'GET' && /\/profile\/avatar\/[^/]+\/download$/.test(pathname)) {
        await route.fulfill({
          status: 404,
          body: '',
        });
        return;
      }

      /**
       * Resume upload & download
       */
      if (method === 'POST' && pathname.endsWith('/documents/resume')) {
        const targetProfile = studentProfiles['student-1'];
        const timestamp = new Date().toISOString();
        studentResume = {
          filename: 'student-profile-resume.pdf',
          contentType: 'application/pdf',
          content: 'Mock resume content for automated tests.',
          updatedAt: timestamp,
        };
        if (targetProfile) {
          targetProfile.student.resumeKey = 'student-profile-resume.pdf';
          targetProfile.student.updatedAt = timestamp;
          targetProfile.updatedAt = timestamp;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Resume uploaded successfully',
          }),
        });
        return;
      }

      const resumeDownloadMatch = pathname.match(/\/documents\/resume\/([^/]+)\/download$/);
      if (resumeDownloadMatch) {
        if (!studentResume) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Resume not found',
            }),
          });
          return;
        }

        const headers: Record<string, string> = {
          'Content-Type': studentResume.contentType,
          'Content-Length': String(studentResume.content.length),
          'Content-Disposition': `attachment; filename="${studentResume.filename}"`,
          'Last-Modified': studentResume.updatedAt,
        };

        if (method === 'HEAD') {
          await route.fulfill({
            status: 200,
            headers,
            body: '',
          });
          return;
        }

        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            headers,
            body: studentResume.content,
          });
          return;
        }
      }

      /**
       * Student dashboard
       */
      if (
        method === 'GET' &&
        (pathname.endsWith('/profile/dashboard') || pathname.endsWith('/user-profile/dashboard'))
      ) {
        const payload = buildStudentDashboardPayload();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Dashboard data retrieved successfully',
            data: payload,
          }),
        });
        return;
      }

      /**
       * Profile endpoints
       */
      const profileMatch = pathname.match(/\/profile\/([^/]+)$/);
      if (method === 'GET' && profileMatch) {
        const userId = profileMatch[1];
        const profile = studentProfiles[userId];
        if (!profile) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, message: 'Profile not found' }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Profile retrieved successfully',
            data: profile,
          }),
        });
        return;
      }

      if (method === 'PATCH' && pathname.endsWith('/profile')) {
        const body = (request.postDataJSON?.() ?? {}) as {
          userId?: string;
          name?: string;
          surname?: string;
          address?: string;
          phoneNumber?: string;
          degreeTypeId?: string;
          gpa?: number;
          expectedGraduationYear?: number;
        };

        if (!body.userId || !studentProfiles[body.userId]) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Profile not found',
            }),
          });
          return;
        }

        const profile = studentProfiles[body.userId];
        if (body.name) profile.name = body.name;
        if (body.surname) profile.surname = body.surname;
        if (body.phoneNumber) profile.phoneNumber = body.phoneNumber;
        if (body.address) profile.student.address = body.address;
        if (typeof body.degreeTypeId === 'string') {
          profile.student.degreeTypeId = body.degreeTypeId;
          profile.student.degreeType =
            degreeOptions.find((opt) => opt.id === body.degreeTypeId) ||
            profile.student.degreeType;
        }
        if (typeof body.gpa === 'number') profile.student.gpa = body.gpa;
        if (typeof body.expectedGraduationYear === 'number') {
          profile.student.expectedGraduationYear = body.expectedGraduationYear;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Profile updated successfully',
            data: profile,
          }),
        });
        return;
      }

      /**
       * Default: mock write requests, allow reads
       */
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, mocked: true }),
        });
        return;
      }

      await route.continue();
    });

    await use(page);
  },
});

export const expect = base.expect;
