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
    await page.locator('form').getByRole('button', { name: 'Login' }).click();

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

  /**
   * STU-TS-004-TC02: student fails to log in with invalid password
   * Expected result:
   *  - Error message is displayed
   *  - User is not redirected to student dashboard/browse routes
   */
  test('STU-TS-004-TC02: login fails with invalid password', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('student1@ku.ac.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('WrongPassword123');
    await page.locator('form').getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).not.toHaveURL(/\/student(\/|$)/);
  });
});
