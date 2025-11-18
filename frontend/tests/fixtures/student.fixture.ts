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

const degreeOptions = [
  { id: 'deg-bachelor', name: 'Bachelor' },
  { id: 'deg-master', name: 'Master' },
  { id: 'deg-doctor', name: 'Doctor' },
];

let studentAccounts: Record<string, StudentAccount> = {};
let studentProfiles: Record<string, StudentProfile> = {};
let studentNotifications: Record<
  string,
  { id: string; title: string; content: string; isRead: boolean; createdAt: string }[]
> = {};
let savedJobIds: Set<string> = new Set();
let studentResume: {
  filename: string;
  contentType: string;
  content: string;
  updatedAt: string;
} | null = null;

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
        id: 'notif-1',
        title: 'Welcome to KU-Connect',
        content: 'Complete your profile to get better matches.',
        isRead: false,
        createdAt: new Date('2025-11-01T09:00:00Z').toISOString(),
      },
    ],
  };

  savedJobIds = new Set(['job-mock-1']);
  studentResume = null;
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
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                items: Array.from(savedJobIds).map((id) => ({
                  savedAt: new Date().toISOString(),
                  job: {
                    id,
                    hrId: 'hr-1',
                    title: 'Mock Internship',
                    companyName: 'KU Connect',
                    description: 'Assist product team with student projects.',
                    location: 'Bangkok, Thailand',
                    jobType: 'internship',
                    workArrangement: 'hybrid',
                    duration: '3 months',
                    minSalary: 10000,
                    maxSalary: 15000,
                    application_deadline: '2025-12-31T23:59:59Z',
                    email: 'hr@kuconnect.app',
                    phone_number: '+66 80 000 0000',
                    other_contact_information: null,
                    tags: [],
                    requirements: [],
                    qualifications: [],
                    responsibilities: [],
                    benefits: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isSaved: true,
                  },
                })),
                total: savedJobIds.size,
                page: Number(url.searchParams.get('page') ?? 1),
                pageSize: Number(url.searchParams.get('pageSize') ?? 25),
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
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              notifications: notifications.map((item) => ({
                id: item.id,
                announcementId: item.id,
                userId: 'student-1',
                isRead: item.isRead,
                createdAt: item.createdAt,
                announcement: {
                  id: item.id,
                  title: item.title,
                  content: item.content,
                  priority: 'LOW',
                  createdAt: item.createdAt,
                },
              })),
              unreadCount: notifications.filter((n) => !n.isRead).length,
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
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: notifId,
              announcementId: notifId,
              userId: 'student-1',
              isRead: true,
              createdAt: target?.createdAt ?? new Date().toISOString(),
            },
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
        };
        const pageValue = Number.isFinite(body.page) ? Number(body.page) : 1;
        const limitValue = Number.isFinite(body.limit) ? Number(body.limit) : 25;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              jobs: [],
              total: 0,
              page: pageValue,
              limit: limitValue,
            },
          }),
        });
        return;
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
