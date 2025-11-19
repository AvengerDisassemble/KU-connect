import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: EMP-TS-004 – Employer Login
 * Area: Auth
 * Priority: P0
 * Tags: @smoke
 */
test.describe('EMP-TS-004 Employer Login @smoke', () => {
  /**
   * TC1: Employer logs in with valid credentials
   * Expected result:
   *   - Login succeeds
   *   - User is redirected to Company Profile & Verification page
   */
  test('EMP-TS-004-TC1: login with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // ----------------------------
    // Open login page from home
    // ----------------------------
    await page.getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Fill valid credentials
    // ----------------------------
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');

    // ----------------------------
    // Submit login form
    // ----------------------------
    await page.getByRole('main').getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Expect profile landing page to be visible
    // ----------------------------
    await expect(
      page.getByRole('heading', { name: 'Company Profile & Verification' })
    ).toBeVisible();
  });

  /**
   * TC2: Employer fails to log in with invalid password
   * Expected result:
   *   - Error message visible
   *   - NOT redirected to Company Profile & Verification page
   */
  test('EMP-TS-004-TC2: login fails with invalid password', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // ----------------------------
    // Open login page
    // ----------------------------
    await page.getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Fill correct email but wrong password
    // ----------------------------
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('WrongPassword123');

    // ----------------------------
    // Submit login form
    // ----------------------------
    await page.getByRole('main').getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Expect error toast/message "Invalid credentials" to appear
    // ----------------------------
    await expect(page.getByText('Invalid credentials')).toBeVisible();

    // ----------------------------
    // Expect NOT to be on profile page
    // ----------------------------
    await expect(
      page.getByRole('heading', { name: 'Company Profile & Verification' })
    ).not.toBeVisible();
  });
});
