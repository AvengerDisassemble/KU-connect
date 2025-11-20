import { test, expect } from '../fixtures/admin.fixture';

/**
 * Scenario: ADM-TS-002 – Block wrong role (Non-admin hits Admin pages)
 * Area: Auth / Authorization
 * Priority: P0
 * Tags: @smoke
 */
test.describe('ADM-TS-002 Block wrong role @smoke', () => {
  const appUrl = 'http://localhost:5173';
  const adminRoutes = ['/admin', '/admin/users', '/admin/announcements', '/admin/reports', '/admin/browse-jobs'];

  /**
   * Helper: login as Employer (wrong role for Admin area)
   */
  const loginAsEmployer = async (page: any) => {
    // ----------------------------
    // Arrange: open landing page and launch login dialog
    // ----------------------------
    await page.goto(appUrl);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // ----------------------------
    // Act: submit employer credentials
    // ----------------------------
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.getByRole('button', { name: 'Login' }).click();
    // ----------------------------
    // Assert: wait for session to complete before navigating
    // ----------------------------
    await page.waitForLoadState('networkidle');
  };

  /**
   * Helper: assert Admin dashboard UI is not visible
   */
  const assertAdminUiHidden = async (page: any) => {
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toHaveCount(0);
  };

  /**
   * Helper: assert guard redirected user to /403 with generic blocked copy
   */
  const assertForbiddenRedirect = async (page: any) => {
    await page.waitForURL('**/403', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/403$/);
    await expect(page.getByText('not found', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: "We couldn't find that page." })).toBeVisible();
    await assertAdminUiHidden(page);
  };

  /**
   * TC01: Employer login baseline
   * Expected result:
   *   - Login succeeds
   *   - Do not land on /admin
   *   - Admin dashboard UI is hidden
   */
  test('ADM-TS-002-TC01: employer login does not land on admin area', async ({ page }) => {
    // ----------------------------
    // Arrange: login as employer (non-admin)
    // ----------------------------
    await loginAsEmployer(page);

    // ----------------------------
    // Assert: guard prevents entering admin area
    // ----------------------------
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin');
    await assertAdminUiHidden(page);
  });

  /**
   * TC02: Employer attempts to open each Admin route directly
   * Expected result:
   *   - Guard redirects to /403
   *   - "Page Not Found" copy displayed
   *   - Admin UI hidden
   */
  test('ADM-TS-002-TC02: employer cannot access admin routes', async ({ page }) => {
    // ----------------------------
    // Arrange: login as employer
    // ----------------------------
    await loginAsEmployer(page);

    // ----------------------------
    // Act & Assert: each admin route redirects to 403
    // ----------------------------
    for (const path of adminRoutes) {
      await page.goto(`${appUrl}${path}`);
      await assertForbiddenRedirect(page);
    }
  });
});
