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

// ---------------------------------------------------
// In-memory job list for create-job tests
// ---------------------------------------------------
const mockJobs: any[] = [];

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/api/**', async (route, request) => {
      const url = new URL(request.url());
      const pathname = url.pathname;
      const method = request.method().toUpperCase();

      // ---------------------------------------------------
      // LOGIN: POST /api/login
      // ---------------------------------------------------
      if (method === 'POST' && pathname.endsWith('/login')) {
        const body = (request.postDataJSON?.() ?? {}) as {
          email?: string;
          password?: string;
        };

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
                  role: 'EMPLOYER',
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
                  role: 'STUDENT',
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
      // PROFILE GET: GET /api/profile/:id
      // ---------------------------------------------------
      if (method === 'GET' && pathname.includes('/profile/')) {
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
