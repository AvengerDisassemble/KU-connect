import { test, expect } from '../fixtures/professor.fixture';

/**
 * Scenario: PROF-TS-003 – Professor login
 * Area: Auth
 * Priority: P0
 * Tags: @smoke
 */
test.describe('PROF-TS-003 Professor login @smoke', () => {
  /**
   * PROF-TS-003-TC01: professor signs in successfully and reaches dashboard
   * Expected result:
   *  - Login accepts valid professor credentials
   *  - User is redirected to the Professor dashboard
   *  - Dashboard hero content is visible
   */
  test('PROF-TS-003-TC01: professor logs in and lands on dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('prof@ku.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.locator('form').getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('**/professor', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/professor$/);
    await expect(page.getByRole('heading', { name: 'Student Analytics' })).toBeVisible();
    await expect(
      page.getByText('Monitor outcomes and guide your students', { exact: false })
    ).toBeVisible();
  });
});
