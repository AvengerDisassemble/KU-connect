import { test, expect } from '@playwright/test';

/**
 * Scenario: PROF-TS-001 – Professor Auth Guard
 * Area: Authentication
 * Priority: P0
 * Tags: @smoke
 */
test.describe('PROF-TS-001 Professor auth guard @smoke', () => {
  const appUrl = 'http://localhost:5173';
  const professorRoutes = ['/professor', '/professor/analytics', '/professor/browse-jobs'];

  const resetSession = async (page: any) => {
    // ----------------------------
    // Arrange: visit login page and clear storage
    // ----------------------------
    await page.goto(`${appUrl}/login`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  };

  /**
   * PROF-TS-001-TC01: unauthenticated professor routes redirect to sign-in
   * Expected result:
   *  - Visiting any professor-only path without a user session navigates to /login
   *  - Login page hero text is visible
   */
  test('PROF-TS-001-TC01: unauthenticated professor routes redirect to login', async ({ page }) => {
    for (const path of professorRoutes) {
      // ----------------------------
      // Arrange: reset session to simulate unauthenticated user
      // ----------------------------
      await resetSession(page);

      // ----------------------------
      // Act: navigate directly to a protected professor route
      // ----------------------------
      await page.goto(`${appUrl}${path}`);
      await page.waitForURL('**/login', { timeout: 10000 });

      // ----------------------------
      // Assert: login page hero text is visible
      // ----------------------------
      await expect(page.getByRole('heading', { name: 'Login to KU-Connect' })).toBeVisible();
      await expect(page).toHaveURL(`${appUrl}/login`);
    }
  });
});
