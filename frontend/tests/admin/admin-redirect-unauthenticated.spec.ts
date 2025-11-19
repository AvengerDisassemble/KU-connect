import { test, expect } from '../fixtures/admin.fixture';

/**
 * Scenario: ADM-TS-001 – Redirect unauthenticated
 * Area: Auth / Routing
 * Priority: P0
 * Tags: @smoke
 */
test.describe('ADM-TS-001 Redirect unauthenticated @smoke', () => {
  const appUrl = 'http://localhost:5173';

  /**
   * Helper: assert login page is visible
   */
  const assertLoginPageVisible = async (page: any) => {
    // ----------------------------
    // Assert: URL points to the login page
    // ----------------------------
    await expect(page).toHaveURL(/\/login/);

    // ----------------------------
    // Assert: Login heading and form fields are visible
    // ----------------------------
    await expect(page.getByRole('heading', { name: 'Login to KU-Connect' })).toBeVisible();
    await expect(page.getByText('Email', { exact: true })).toBeVisible();
    await expect(page.getByText('Password')).toBeVisible();
    await expect(page.locator('form').getByRole('button', { name: 'Login' })).toBeVisible();
  };

  /**
   * TC01: Unauthenticated user visits /admin (dashboard)
   * Expected result:
   *   - User is redirected to Login page
   *   - Login form is visible
   */
  test('ADM-TS-001-TC01: redirect unauthenticated from /admin (dashboard) to /login', async ({
    page,
  }) => {
    // ----------------------------
    // Act: Directly navigate to admin dashboard without login
    // ----------------------------
    await page.goto(`${appUrl}/admin`);

    // ----------------------------
    // Assert: Login page is shown
    // ----------------------------
    await assertLoginPageVisible(page);
  });

  /**
   * TC02: Unauthenticated user visits /admin/users
   * Expected result:
   *   - User is redirected to Login page
   *   - Login form is visible
   */
  test('ADM-TS-001-TC02: redirect unauthenticated from /admin/users to /login', async ({ page }) => {
    // ----------------------------
    // Act: Directly navigate to admin user management without login
    // ----------------------------
    await page.goto(`${appUrl}/admin/users`);

    // ----------------------------
    // Assert: Login page is shown
    // ----------------------------
    await assertLoginPageVisible(page);
  });

  /**
   * TC03: Unauthenticated user visits /admin/announcements
   * Expected result:
   *   - User is redirected to Login page
   *   - Login form is visible
   */
  test('ADM-TS-001-TC03: redirect unauthenticated from /admin/announcements to /login', async ({
    page,
  }) => {
    // ----------------------------
    // Act: Directly navigate to admin announcements without login
    // ----------------------------
    await page.goto(`${appUrl}/admin/announcements`);

    // ----------------------------
    // Assert: Login page is shown
    // ----------------------------
    await assertLoginPageVisible(page);
  });

  /**
   * TC04: Unauthenticated user visits /admin/reports
   * Expected result:
   *   - User is redirected to Login page
   *   - Login form is visible
   */
  test('ADM-TS-001-TC04: redirect unauthenticated from /admin/reports to /login', async ({ page }) => {
    // ----------------------------
    // Act: Directly navigate to admin reports without login
    // ----------------------------
    await page.goto(`${appUrl}/admin/reports`);

    // ----------------------------
    // Assert: Login page is shown
    // ----------------------------
    await assertLoginPageVisible(page);
  });

  /**
   * TC05: Unauthenticated user visits /admin/browse-jobs
   * Expected result:
   *   - User is redirected to Login page
   *   - Login form is visible
   */
  test('ADM-TS-001-TC05: redirect unauthenticated from /admin/browse-jobs to /login', async ({
    page,
  }) => {
    // ----------------------------
    // Act: Directly navigate to admin browse jobs without login
    // ----------------------------
    await page.goto(`${appUrl}/admin/browse-jobs`);

    // ----------------------------
    // Assert: Login page is shown
    // ----------------------------
    await assertLoginPageVisible(page);
  });
});
