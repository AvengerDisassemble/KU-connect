import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: PROF-TS-002 – Professor guard blocks wrong role
 * Priority: P0
 * Tags: @smoke
 */
test.describe('PROF-TS-002 Professor guard blocks wrong role @smoke', () => {
  const appUrl = 'http://localhost:5173';
  const professorRoutes = ['/professor', '/professor/analytics', '/professor/browse-jobs'];

  const loginAsEmployer = async (page: any) => {
    // ----------------------------
    // Arrange: open landing page and trigger login dialog
    // ----------------------------
    await page.goto(appUrl);
    await page.getByRole('button', { name: 'Login' }).click();

    // Submit employer credentials
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.locator('form').getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Assert: wait for session persistence
    // ----------------------------
    await page.waitForLoadState('networkidle');
  };

  /**
   * PROF-TS-002-TC01: non-professor (employer) cannot access professor pages
   * Expected result:
   *  - Guard redirects to /403
   *  - 404/blocked message is shown instead of professor UI
   */
  test('PROF-TS-002-TC01: wrong role gets redirected away from professor pages', async ({ page }) => {
    // ----------------------------
    // Arrange: login as employer (wrong role)
    // ----------------------------
    await loginAsEmployer(page);

    for (const path of professorRoutes) {
      // Navigate directly to professor route; guard should block
      await page.goto(`${appUrl}${path}`);
      await page.waitForURL('**/403', { waitUntil: 'networkidle' });

      // ----------------------------
      // Assert: user is redirected to 403 and professor UI is hidden
      // ----------------------------
      await expect(page).toHaveURL(/\/403$/);
      await expect(page.getByText('Page Not Found')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Professor Analytics' })).toHaveCount(0);
    }
  });
});
