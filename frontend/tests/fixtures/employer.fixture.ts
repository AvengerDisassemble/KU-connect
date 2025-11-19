import { test as base } from '@playwright/test';

// ---------------------------------------------------
// In-memory employer profile state
// ---------------------------------------------------
let employerProfileData = {
  id: 'cmhvfmg0j0002kidix73p1pr8', // same as example userId
  name: 'Harry',
  surname: 'Recruiter',
  email: 'hr1@company.com',
  username: 'hr1',
  role: 'EMPLOYER',
  status: 'APPROVED',
  verified: true,
  avatarKey: null as string | null,
  phoneNumber: '+66-81-000-0000',
  createdAt: '2025-11-12T20:11:48.649Z',
  updatedAt: '2025-11-12T20:15:47.374Z',
  hr: {
    id: 'hr-1',
    userId: 'cmhvfmg0j0002kidix73p1pr8',
    // ---- Company fields (prefill all main fields) ----
    companyName: 'Test Company Ltd.',
    address: '789 Business District, Bangkok, Thailand',
    industry: 'IT_SOFTWARE',        // backend enum
    companySize: 'ONE_TO_TEN',      // backend enum
    website: 'http://testcompany.com',
  },
};

type MockJob = {
  id: string;
  title: string;
  location: string;
  application_deadline: string;
  minSalary: number;
  maxSalary: number;
  jobType: 'internship' | 'part-time' | 'full-time' | 'contract';
  workArrangement: 'on-site' | 'remote' | 'hybrid';
  duration: string;
  description: string;
  companyName: string;
  email: string;
  phone_number: string;
  other_contact_information?: string | null;
  tags: string[];
  requirements: string[];
  qualifications: string[];
  responsibilities: string[];
  benefits: string[];
  applications: number;
};

type EmployerNotificationRecord = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notificationType: 'ANNOUNCEMENT' | 'APPLICATION_STATUS' | 'EMPLOYER_APPLICATION';
  jobId?: string | null;
  applicationId?: string | null;
  sender?:
    | {
        id: string;
        name: string;
        surname: string;
        role: string;
      }
    | null;
};

const createEmployerJobs = (): MockJob[] => [
  {
    id: 'job-mock-1',
    title: 'Backend Developer Intern',
    location: 'Bangkok, Thailand (Hybrid)',
    application_deadline: '2025-12-31T23:59:59.000Z',
    minSalary: 15000,
    maxSalary: 20000,
    jobType: 'internship',
    workArrangement: 'hybrid',
    duration: '4 months',
    description:
      'Work with our backend team to build REST APIs, maintain Node.js services, and improve deployment pipelines.',
    companyName: 'Test Company Ltd.',
    email: 'backend.hr@testcompany.com',
    phone_number: '+66-89-123-4567',
    other_contact_information: null,
    tags: ['backend', 'nodejs', 'internship'],
    requirements: [
      'Experience with JavaScript or TypeScript',
      'Basic SQL knowledge',
      'Understanding of REST APIs',
    ],
    qualifications: ['Currently studying Computer Engineering'],
    responsibilities: [
      'Implement API endpoints',
      'Write integration tests',
      'Collaborate with frontend team',
    ],
    benefits: ['Mentorship', 'Hybrid work', 'Allowance 15,000 THB'],
    applications: 2,
  },
  {
    id: 'job-mock-2',
    title: 'UI/UX Designer Intern',
    location: 'Bangkok, Thailand (On-site)',
    application_deadline: '2025-11-30T23:59:59.000Z',
    minSalary: 12000,
    maxSalary: 15000,
    jobType: 'internship',
    workArrangement: 'on-site',
    duration: '3 months',
    description:
      'Design user flows, wireframes, and high-fidelity mockups for our internal admin tools.',
    companyName: 'Test Company Ltd.',
    email: 'design.hr@testcompany.com',
    phone_number: '+66-82-222-3333',
    other_contact_information: null,
    tags: ['design', 'uiux'],
    requirements: ['Portfolio of design work', 'Figma knowledge'],
    qualifications: ['Studying Design, HCI, or related field'],
    responsibilities: ['Create mockups', 'Run usability tests'],
    benefits: ['Free lunch', 'Office equipment', 'Training budget'],
    applications: 0,
  },
];

let employerJobs = createEmployerJobs();
let employerNotifications: EmployerNotificationRecord[] = [];

const dashboardResponse = () => ({
  success: true,
  message: 'Dashboard data retrieved successfully',
  data: {
    userRole: 'EMPLOYER',
    dashboard: {
      myJobPostings: employerJobs.map((job) => ({
        id: job.id,
        title: job.title,
        location: job.location,
        application_deadline: job.application_deadline,
        _count: {
          applications: job.applications,
        },
      })),
      quickActions: [
        'Post New Job',
        'Review Applications',
        'Edit Company Profile',
        'View Analytics',
      ],
    },
    timestamp: new Date().toISOString(),
  },
});

const buildJobDetail = (job: MockJob) => ({
  id: job.id,
  hrId: 'hr-1',
  title: job.title,
  companyName: job.companyName,
  description: job.description,
  location: job.location,
  jobType: job.jobType,
  workArrangement: job.workArrangement,
  duration: job.duration,
  minSalary: job.minSalary,
  maxSalary: job.maxSalary,
  application_deadline: job.application_deadline,
  email: job.email,
  phone_number: job.phone_number,
  other_contact_information: job.other_contact_information,
  createdAt: '2025-11-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  hr: {
    id: 'hr-1',
    companyName: job.companyName,
    address: '789 Business District, Bangkok, Thailand',
    industry: 'IT_SOFTWARE',
    companySize: 'ONE_TO_TEN',
    website: 'http://testcompany.com',
  },
  tags: job.tags.map((name, idx) => ({
    id: `${job.id}-tag-${idx}`,
    name,
  })),
  requirements: job.requirements.map((text, idx) => ({
    id: `${job.id}-req-${idx}`,
    jobId: job.id,
    text,
  })),
  qualifications: job.qualifications.map((text, idx) => ({
    id: `${job.id}-qual-${idx}`,
    jobId: job.id,
    text,
  })),
  responsibilities: job.responsibilities.map((text, idx) => ({
    id: `${job.id}-resp-${idx}`,
    jobId: job.id,
    text,
  })),
  benefits: job.benefits.map((text, idx) => ({
    id: `${job.id}-benefit-${idx}`,
    jobId: job.id,
    text,
  })),
});

// ---------------------------------------------------
// In-memory job list for create-job tests
// ---------------------------------------------------
const mockJobs: any[] = [];

type RegisteredEmployer = {
  id: string;
  name: string;
  surname: string;
  email: string;
  password: string;
};

let registeredEmployers: Record<string, RegisteredEmployer> = {};

const createJobApplicants = (): Record<string, any[]> => ({
  'job-mock-1': [
    {
      id: 'app-mock-1',
      jobId: 'job-mock-1',
      studentId: 'student-mock-1',
      status: 'PENDING',
      createdAt: '2025-11-20T08:00:00.000Z',
      updatedAt: '2025-11-20T08:00:00.000Z',
      student: {
        id: 'student-mock-1',
        degreeType: {
          id: 'deg-1',
          name: 'Computer Engineering',
        },
        user: {
          id: 'student-mock-1',
          name: 'Alice',
          surname: 'K.',
          email: 'alice@student.ku.th',
        },
      },
      resume: {
        id: 'resume-mock-1',
        link: 'https://files.testcompany.com/resume/alice-k.pdf',
        source: 'PROFILE',
        jobId: 'job-mock-1',
        studentId: 'student-mock-1',
      },
    },
  ],
  'job-mock-2': [],
});

let jobApplicants = createJobApplicants();
const createEmployerNotifications = (): EmployerNotificationRecord[] => [
  {
    id: 'notif-employer-application',
    title: 'New Job Application',
    content: 'Student Example has applied for "Backend Developer Intern".',
    isRead: false,
    createdAt: new Date('2025-02-15T07:45:00Z').toISOString(),
    priority: 'HIGH',
    notificationType: 'EMPLOYER_APPLICATION',
    jobId: 'job-mock-1',
    applicationId: 'app-mock-1',
    sender: {
      id: 'student-example',
      name: 'Student',
      surname: 'Example',
      role: 'STUDENT',
    },
  },
  {
    id: 'notif-job-fair',
    title: 'Job Fair',
    content: 'University will host a campus job fair on March 10.',
    isRead: true,
    createdAt: new Date('2025-02-14T10:00:00Z').toISOString(),
    priority: 'LOW',
    notificationType: 'ANNOUNCEMENT',
  },
];

const toEmployerNotificationResponse = (record: EmployerNotificationRecord) => {
  const base = {
    id: record.id,
    userId: employerProfileData.id,
    type: record.notificationType,
    title: record.title,
    message: record.content,
    priority: record.priority ?? 'MEDIUM',
    isRead: record.isRead,
    createdAt: record.createdAt,
    senderId: record.sender?.id ?? null,
    announcementId: record.notificationType === 'ANNOUNCEMENT' ? record.id : null,
    jobId: record.jobId ?? null,
    applicationId: record.applicationId ?? null,
    sender: record.sender ?? null,
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
            audience: 'EMPLOYERS',
          }
        : null,
  };
};

export const test = base.extend({
  page: async ({ page }, use) => {
    employerJobs = createEmployerJobs();
    jobApplicants = createJobApplicants();
    employerNotifications = createEmployerNotifications();
    registeredEmployers = {};
    await page.route('**/api/**', async (route, request) => {
      const url = new URL(request.url());
      const pathname = url.pathname;
      const method = request.method().toUpperCase();

      // ---------------------------------------------------
      // EMPLOYER REGISTRATION: POST /register/enterprise
      // ---------------------------------------------------
      if (method === 'POST' && pathname.endsWith('/register/enterprise')) {
        const body = (request.postDataJSON?.() ?? {}) as {
          name?: string;
          surname?: string;
          email?: string;
          password?: string;
          companyName?: string;
          address?: string;
          phoneNumber?: string;
        };

        if (!body.email || !body.password) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Email and password are required',
            }),
          });
          return;
        }

        const emailKey = body.email.toLowerCase();
        const newEmployer: RegisteredEmployer = {
          id: `registered-employer-${Date.now()}`,
          name: body.name ?? 'Employer',
          surname: body.surname ?? 'User',
          email: body.email,
          password: body.password,
        };
        registeredEmployers[emailKey] = newEmployer;

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Registration submitted! Awaiting verification.',
            data: {
              user: {
                id: newEmployer.id,
                name: newEmployer.name,
                surname: newEmployer.surname,
                email: newEmployer.email,
                role: 'EMPLOYER',
                status: 'PENDING',
                verified: false,
              },
            },
          }),
        });
        return;
      }

      // ---------------------------------------------------
      // LOGIN: POST /api/login
      // ---------------------------------------------------
      if (method === 'POST' && pathname.endsWith('/login')) {
        const body = (request.postDataJSON?.() ?? {}) as {
          email?: string;
          password?: string;
        };

        const normalizedEmail = body.email?.toLowerCase();

        const registered = normalizedEmail
          ? registeredEmployers[normalizedEmail]
          : undefined;
        if (registered && body.password === registered.password) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Login successful',
              data: {
                user: {
                  id: registered.id,
                  name: registered.name,
                  surname: registered.surname,
                  email: registered.email,
                  role: 'employer',
                  status: 'PENDING',
                  verified: false,
                },
              },
            }),
          });
          return;
        }

        const isEmployer =
          body.email === 'hr1@company.com' &&
          body.password === 'Password123';

        const isStudent =
          body.email === 'student1@ku.th' &&
          body.password === 'Password123';

        if (isEmployer) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Login successful',
              data: {
                user: {
                  id: employerProfileData.id,
                  name: employerProfileData.name,
                  surname: employerProfileData.surname,
                  email: employerProfileData.email,
                  role: 'employer',
                  status: employerProfileData.status,
                  verified: employerProfileData.verified,
                },
              },
            }),
          });
          return;
        }

        if (isStudent) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Login successful',
              data: {
                user: {
                  id: 'student-1',
                  name: 'Student',
                  surname: 'User',
                  email: 'student1@ku.th',
                  role: 'student',
                  status: 'APPROVED',
                  verified: true,
                },
              },
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

      // ---------------------------------------------------
      // NOTIFICATIONS: GET /api/notifications + PATCH /api/notifications/:id/read
      // ---------------------------------------------------
      if (method === 'GET' && pathname.endsWith('/notifications')) {
        const entries = employerNotifications.map(toEmployerNotificationResponse);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              notifications: entries,
              unreadCount: employerNotifications.filter((n) => !n.isRead).length,
              hasMore: false,
              lastFetchedAt: new Date().toISOString(),
            },
          }),
        });
        return;
      }

      const employerNotifReadMatch = pathname.match(/\/notifications\/([^/]+)\/read$/);
      if (method === 'PATCH' && employerNotifReadMatch) {
        const notifId = employerNotifReadMatch[1];
        const target = employerNotifications.find((notification) => notification.id === notifId);
        if (target) target.isRead = true;
        const entry = target
          ? toEmployerNotificationResponse(target)
          : {
              id: notifId,
              userId: employerProfileData.id,
              type: 'ANNOUNCEMENT',
              title: 'Notification updated',
              message: 'Notification marked as read',
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

      // ---------------------------------------------------
      // EMPLOYER DASHBOARD: GET /api/profile/dashboard
      // ---------------------------------------------------
      if (
        method === 'GET' &&
        (pathname.endsWith('/profile/dashboard') || pathname.endsWith('/user-profile/dashboard'))
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(dashboardResponse()),
        });
        return;
      }

      // ---------------------------------------------------
      // PROFILE GET: GET /api/profile/:id
      // ---------------------------------------------------
      const profileMatch = pathname.match(/\/profile\/([^/]+)$/);
      if (method === 'GET' && profileMatch) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Profile retrieved successfully',
            data: employerProfileData,
          }),
        });
        return;
      }

      // ---------------------------------------------------
      // PROFILE UPDATE: PATCH /api/profile
      //   body example:
      //   {
      //     "userId": "...",
      //     "companyName": "...",
      //     "address": "...",
      //     "industry": "IT_SOFTWARE",
      //     "companySize": "ONE_TO_TEN",
      //     "website": "http://..."
      //   }
      // ---------------------------------------------------
      if (method === 'PATCH' && pathname.endsWith('/profile')) {
        const body = (request.postDataJSON?.() ?? {}) as {
          userId?: string;
          companyName?: string;
          address?: string;
          industry?: string;
          companySize?: string;
          website?: string;
        };

        // Update in-memory state (ignore/accept userId, assumed valid)
        if (body.companyName !== undefined) {
          employerProfileData.hr.companyName = body.companyName;
        }
        if (body.address !== undefined) {
          employerProfileData.hr.address = body.address;
        }
        if (body.industry !== undefined) {
          employerProfileData.hr.industry = body.industry;
        }
        if (body.companySize !== undefined) {
          employerProfileData.hr.companySize = body.companySize;
        }
        if (body.website !== undefined) {
          employerProfileData.hr.website = body.website;
        }

        employerProfileData.updatedAt = new Date().toISOString();

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Profile updated successfully',
            data: employerProfileData,
          }),
        });
        return;
      }

      // ---------------------------------------------------
      // JOB DETAIL / APPLICANTS ROUTES
      // ---------------------------------------------------
      const jobApplicantsMatch = pathname.match(/\/job\/([^/]+)\/applyer$/);
      const jobIdMatch = pathname.match(/\/job\/([^/]+)$/);

      if (method === 'GET' && jobApplicantsMatch) {
        const jobId = jobApplicantsMatch[1];
        const applicants = jobApplicants[jobId] ?? [];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Applicants retrieved successfully',
            data: applicants,
          }),
        });
        return;
      }

      if (method === 'POST' && jobApplicantsMatch) {
        const jobId = jobApplicantsMatch[1];
        const body = (request.postDataJSON?.() ?? {}) as {
          applicationId?: string;
          status?: 'QUALIFIED' | 'REJECTED';
        };

        if (!body.applicationId || !body.status) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'applicationId and status are required',
            }),
          });
          return;
        }

        const applicants = jobApplicants[jobId] ?? [];
        const target = applicants.find((app) => app.id === body.applicationId);
        if (!target) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Application not found',
            }),
          });
          return;
        }

        target.status = body.status;
        target.updatedAt = new Date().toISOString();

        const message =
          body.status === 'QUALIFIED'
            ? 'Application qualified successfully'
            : 'Application rejected successfully';

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message,
            data: {
              id: target.id,
              jobId,
              studentId: target.studentId,
              resumeId: target.resumeId ?? null,
              status: target.status,
              createdAt: target.createdAt,
              updatedAt: target.updatedAt,
            },
          }),
        });
        return;
      }

      if (method === 'GET' && jobIdMatch) {
        const jobId = jobIdMatch[1];
        const job = employerJobs.find((item) => item.id === jobId);
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

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Job retrieved successfully',
            data: buildJobDetail(job),
          }),
        });
        return;
      }

      // ---------------------------------------------------
      // JOB UPDATE: PATCH /api/job/:id
      // ---------------------------------------------------
      if (method === 'PATCH' && jobIdMatch) {
        const jobId = jobIdMatch[1];
        const body = (request.postDataJSON?.() ?? {}) as Record<string, any>;
        const job = employerJobs.find((item) => item.id === jobId);
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

        const errors: string[] = [];
        const checkMin = (key: string, min: number) => {
          if (key in body) {
            const value = typeof body[key] === 'string' ? body[key].trim() : '';
            if (value.length < min) {
              errors.push(`"${key}" length must be at least ${min} characters long`);
            }
          }
        };

        checkMin('title', 3);
        checkMin('location', 2);
        checkMin('duration', 1);

        if ('minSalary' in body || 'maxSalary' in body) {
          const minSalary =
            typeof body.minSalary === 'number' ? body.minSalary : job.minSalary;
          const maxSalary =
            typeof body.maxSalary === 'number' ? body.maxSalary : job.maxSalary;
          if (minSalary > maxSalary) {
            errors.push('"maxSalary" must be greater than or equal to "minSalary"');
          }
        }

        if (errors.length > 0) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: errors.join(', '),
            }),
          });
          return;
        }

        job.title = typeof body.title === 'string' ? body.title.trim() : job.title;
        job.location =
          typeof body.location === 'string' ? body.location.trim() : job.location;
        job.duration =
          typeof body.duration === 'string' ? body.duration.trim() : job.duration;
        job.description =
          typeof body.description === 'string'
            ? body.description.trim()
            : job.description;
        job.minSalary =
          typeof body.minSalary === 'number' ? body.minSalary : job.minSalary;
        job.maxSalary =
          typeof body.maxSalary === 'number' ? body.maxSalary : job.maxSalary;
        job.application_deadline =
          typeof body.application_deadline === 'string'
            ? body.application_deadline
            : job.application_deadline;
        if (Array.isArray(body.tags)) {
          job.tags = body.tags.map((tag: string) => tag.trim()).filter(Boolean);
        }
        if (Array.isArray(body.requirements)) {
          job.requirements = body.requirements.map((item: string) => item.trim()).filter(Boolean);
        }
        if (Array.isArray(body.qualifications)) {
          job.qualifications = body.qualifications.map((item: string) => item.trim()).filter(Boolean);
        }
        if (Array.isArray(body.responsibilities)) {
          job.responsibilities = body.responsibilities
            .map((item: string) => item.trim())
            .filter(Boolean);
        }
        if (Array.isArray(body.benefits)) {
          job.benefits = body.benefits.map((item: string) => item.trim()).filter(Boolean);
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Job updated successfully',
            data: buildJobDetail(job),
          }),
        });
        return;
      }

      // ---------------------------------------------------
      // JOB DELETE: DELETE /api/job/:id
      // ---------------------------------------------------
      if (method === 'DELETE' && jobIdMatch) {
        const jobId = jobIdMatch[1];
        const index = employerJobs.findIndex((item) => item.id === jobId);
        if (index === -1) {
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

        const [deletedJob] = employerJobs.splice(index, 1);
        delete jobApplicants[jobId];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Job deleted successfully',
            data: buildJobDetail(deletedJob),
          }),
        });
        return;
      }

      // ---------------------------------------------------
      // JOB CREATE: POST /api/job-postings
      // ---------------------------------------------------
      const isCreateJobEndpoint =
        method === 'POST' &&
        (pathname.endsWith('/job') || pathname.includes('job-postings'));

      if (isCreateJobEndpoint) {
        const body = (request.postDataJSON?.() ?? {}) as Record<string, any>;
        const errors: string[] = [];

        const textValue = (key: string, min: number, max?: number) => {
          const value = typeof body[key] === 'string' ? body[key].trim() : '';
          if (value.length < min) {
            errors.push(`"${key}" length must be at least ${min} characters long`);
          }
          if (typeof max === 'number' && value.length > max) {
            errors.push(`"${key}" length must be less than or equal to ${max} characters long`);
          }
        };

        textValue('title', 3, 150);
        textValue('description', 10);
        textValue('location', 2, 150);

        if (errors.length > 0) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: errors.join(', '),
            }),
          });
          return;
        }

        const newJob = {
          id: `job-mock-${Date.now()}`,
          ...body,
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Job created successfully',
            data: newJob,
          }),
        });
        return;
      }
      
      // ---------------------------------------------------
      // BLOCK ALL OTHER WRITES (no real DB writes)
      // ---------------------------------------------------
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, mocked: true }),
        });
        return;
      }

      // ---------------------------------------------------
      // ALLOW OTHER GETs
      // ---------------------------------------------------
      await route.continue();
    });

    await use(page);
  },
});

export const expect = test.expect;
