import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: EMP-TS-001 – Redirect unauthenticated
 * Area: Auth / Routing
 * Priority: P0
 * Tags: @smoke
 */
test.describe('EMP-TS-001 Redirect unauthenticated @smoke', () => {
  /**
   * Helper: assert login page is visible
   */
  const assertLoginPageVisible = async (page: any) => {
    // Scope all checks under <main> to avoid navbar duplicates
    const main = page.getByRole('main');

    // Assert: URL is login
    await expect(page).toHaveURL(/\/login/);

    // Assert: Login heading and form fields are visible
    await expect(main.getByRole('heading', { name: 'Login to KU-Connect' })).toBeVisible();
    await expect(main.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(main.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Login' })).toBeVisible();
  };

  /**
   * TC01: Unauthenticated user visits /employer (dashboard)
   * Expected result:
   *   - User is redirected to Login page
   *   - Login form is visible
   */
  test('EMP-TS-001-TC01: redirect unauthenticated from /employer (dashboard) to /login', async ({
    page,
  }) => {
    // Act: Directly navigate to employer dashboard without login
    await page.goto('http://localhost:5173/employer');

    // Assert: Login page is shown
    await assertLoginPageVisible(page);
  });

  /**
   * TC02: Unauthenticated user visits /employer/profile/:userId
   * Expected result:
   *   - User is redirected to Login page
   *   - Login form is visible
   */
  test('EMP-TS-001-TC02: redirect unauthenticated from /employer/profile/:userId to /login', async ({
    page,
  }) => {
    // Act: Directly navigate to employer profile page without login
    await page.goto('http://localhost:5173/employer/profile/mock-employer-id');

    // Assert: Login page is shown
    await assertLoginPageVisible(page);
  });

  /**
   * TC03: Unauthenticated user visits /employer/job-postings/create
   * Expected result:
   *   - User is redirected to Login page
   *   - Login form is visible
   */
  test('EMP-TS-001-TC03: redirect unauthenticated from create job page to /login', async ({
    page,
  }) => {
    // Act: Directly navigate to create job page without login
    await page.goto('http://localhost:5173/employer/job-postings/create');

    // Assert: Login page is shown
    await assertLoginPageVisible(page);
  });

  /**
   * TC04: Unauthenticated user visits /employer/job-postings/:jobId/edit
   * Expected result:
   *   - User is redirected to Login page
   *   - Login form is visible
   */
  test('EMP-TS-001-TC04: redirect unauthenticated from edit job page to /login', async ({
    page,
  }) => {
    // Act: Directly navigate to edit job page without login
    await page.goto('http://localhost:5173/employer/job-postings/mock-job-id/edit');

    // Assert: Login page is shown
    await assertLoginPageVisible(page);
  });
});
