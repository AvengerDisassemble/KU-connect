import { test, expect } from '../fixtures/student.fixture';

/**
 * Scenario: STU-TS-004 – Student Login (Happy Path)
 * Priority: P0
 * Tags: @smoke
 */
test.describe('STU-TS-004 Student Login @smoke', () => {
  test('STU-TS-004-TC01: student logs in and reaches browse jobs', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // ----------------------------
    // Open login dialog
    // ----------------------------
    await page.getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Fill credentials and submit
    // ----------------------------
    await page.getByRole('textbox', { name: 'Email' }).fill('student1@ku.ac.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.getByRole('main').getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Verify landing on browse jobs
    // ----------------------------
    await expect(
      page.getByText('Welcome back, Thanakorn!', { exact: false })
    ).toBeVisible();

    await page.waitForURL('**/student/browse-jobs', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    expect(page.url()).toContain('/student/browse-jobs');
  });
});
