import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: STU-TS-002 – Block wrong role (Employer accessing Student area)
 * Priority: P0
 * Type: Negative
 * Tags: @smoke
 */
test.describe('STU-TS-002 Block wrong role (Employer vs Student) @smoke', () => {
  const loginAsEmployer = async (page: any) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.locator('form').getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('networkidle');
  };

  test('STU-TS-002-TC01: employer cannot access student dashboard', async ({ page }) => {
    await loginAsEmployer(page);

    await page.goto('http://localhost:5173/student');
    await page.waitForURL('**/403', { waitUntil: 'networkidle' });

    expect(page.url()).toContain('/403');
    await expect(page.getByText('Page Not Found')).toBeVisible();
    await expect(
      page.getByText('Student Dashboard', { exact: false })
    ).toHaveCount(0);
  });
});
