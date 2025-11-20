import { test, expect } from '../fixtures/admin.fixture';

/**
 * Scenario: ADM-TS-003 – Admin login
 * Area: Auth / Happy path
 * Priority: P0
 * Tags: @smoke
 */
test.describe('ADM-TS-003 Admin login @smoke', () => {
  const appUrl = 'http://localhost:5173';

  /**
   * Helper: perform admin login flow
   */
  const loginAsAdmin = async (page: any) => {
    await page.goto(appUrl);

    // ----------------------------
    // Open sign-in modal
    // ----------------------------
    await page.getByRole('button', { name: 'Sign in' }).click();

    // ----------------------------
    // Fill credentials
    // ----------------------------
    await page.getByRole('textbox', { name: 'Email' }).fill('admin@ku.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');

    // ----------------------------
    // Submit login form
    // ----------------------------
    await page.getByRole('button', { name: 'Login' }).click();
  };

  /**
   * Helper: assert admin dashboard UI is visible
   */
  const assertAdminDashboardVisible = async (page: any) => {
    // ----------------------------
    // Await: guard navigation finishes at /admin
    // ----------------------------
    await page.waitForURL('**/admin', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(
      page.getByText('Monitor platform health, growth metrics, and pending actions.')
    ).toBeVisible();

    const expectMetricButton = async (name: RegExp | string) => {
      await expect(page.getByRole('button', { name }).first()).toBeVisible();
    };

    await expectMetricButton(/Total Users/i);
    await expectMetricButton(/Active Jobs/i);
    await expectMetricButton(/Pending Approvals/i);
    await expectMetricButton(/Unresolved Reports/i);
    await expectMetricButton(/Total Announcements/i);

    await expect(page.getByText('Platform overview')).toBeVisible();
    await expect(page.getByText('Registration trend (7 days)')).toBeVisible();
    await expect(page.getByText('Application status mix')).toBeVisible();
    await expect(page.getByText('Recent platform activity')).toBeVisible();
    await expect(page.getByText('Alerts & follow-ups')).toBeVisible();
    await expect(page.getByText('Trending jobs')).toBeVisible();
  };

  /**
   * TC01: Admin logs in successfully and reaches dashboard
   * Expected result:
   *   - Login call succeeds with admin credentials
   *   - User is redirected to /admin
   *   - Dashboard hero copy and metric cards are rendered
   */
  test('ADM-TS-003-TC01: admin login lands on dashboard', async ({ page }) => {
    // ----------------------------
    // Arrange: login with valid admin credentials
    // ----------------------------
    await loginAsAdmin(page);
    // ----------------------------
    // Assert: dashboard renders with analytics cards
    // ----------------------------
    await assertAdminDashboardVisible(page);
  });

  /**
   * TC02: Admin enters invalid password
   * Expected result:
   *   - Error message is displayed
   *   - User stays on login page (no redirect to /admin)
   */
  test('ADM-TS-003-TC02: admin login fails with invalid password', async ({ page }) => {
    // ----------------------------
    // Arrange: open login dialog
    // ----------------------------
    await page.goto(appUrl);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // ----------------------------
    // Act: submit incorrect password
    // ----------------------------
    await page.getByRole('textbox', { name: 'Email' }).fill('admin@ku.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('WrongPassword123');
    await page.getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Assert: login fails and user remains on login page
    // ----------------------------
    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).not.toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: 'Login to KU-Connect' })).toBeVisible();
  });
});
