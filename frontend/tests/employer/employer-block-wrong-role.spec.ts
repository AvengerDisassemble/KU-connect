import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: EMP-TS-002 – Block wrong role (Student accessing Employer area)
 * Area: Auth / Authorization
 * Priority: P0
 * Tags: @smoke
 */
test.describe('EMP-TS-002 Block wrong role (Student vs Employer) @smoke', () => {
  /**
   * Helper: login as Student (wrong role for Employer area)
   */
  const loginAsStudent = async (page: any) => {
    await page.goto('http://localhost:5173/');

    // ----------------------------
    // Open login page from home
    // ----------------------------
    await page.getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Fill student credentials
    // ----------------------------
    await page.getByRole('textbox', { name: 'Email' }).fill('student1@ku.ac.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');

    // ----------------------------
    // Submit login form
    // ----------------------------
    await page.getByRole('main').getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Wait until navigation after login is done
    // ----------------------------
    await page.waitForLoadState('networkidle');
  };

  /**
   * Helper: assert that Employer profile page is NOT visible
   * (used as generic "employer-only" UI indicator)
   */
  const assertEmployerProfileNotVisible = async (page: any) => {
    // ----------------------------
    // This heading is expected only for Employer profile landing page
    // ----------------------------
    await expect(
      page.getByRole('heading', { name: 'Company Profile & Verification' })
    ).not.toBeVisible();
  };

  /**
   * TC01: Student logs in successfully (baseline)
   * Expected result:
   *   - Login succeeds with student account
   *   - Student is NOT on Employer Company Profile & Verification page
   */
  test('EMP-TS-002-TC01: student login succeeds but not on employer profile', async ({
    page,
  }) => {
    // ----------------------------
    // Act: Login as student
    // ----------------------------
    await loginAsStudent(page);

    // ----------------------------
    // Assert: Should not land on employer profile page
    // ----------------------------
    await assertEmployerProfileNotVisible(page);

    // ----------------------------
    // Optional: Assert we are not on /employer route
    // ----------------------------
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/employer/');
    expect(currentUrl).not.toBe('http://localhost:5173/employer');
  });

  /**
   * TC02: Student tries to access /employer (dashboard) after login
   * Expected result:
   *   - Access is blocked
   *   - Final URL is NOT /employer
   *   - Employer profile page is NOT visible
   */
  test('EMP-TS-002-TC02: student cannot access /employer dashboard', async ({
    page,
  }) => {
    // ----------------------------
    // Arrange: Login as student first
    // ----------------------------
    await loginAsStudent(page);

    // ----------------------------
    // Act: Try to open employer dashboard URL directly
    // ----------------------------
    await page.goto('http://localhost:5173/employer');
    await page.waitForLoadState('networkidle');

    // ----------------------------
    // Assert: We should not stay on /employer
    // ----------------------------
    const currentUrl = page.url();
    expect(currentUrl).not.toBe('http://localhost:5173/employer');

    // ----------------------------
    // Assert: Employer profile UI is not visible
    // ----------------------------
    await assertEmployerProfileNotVisible(page);
  });

  /**
   * TC03: Student tries to access /employer/job-posting/create after login
   * Expected result:
   *   - Access is blocked
   *   - Final URL is NOT the create-job URL
   *   - Employer profile page is NOT visible
   */
  test('EMP-TS-002-TC03: student cannot access create job page', async ({
    page,
  }) => {
    // ----------------------------
    // Arrange: Login as student
    // ----------------------------
    await loginAsStudent(page);

    // ----------------------------
    // Act: Try to open employer create job page
    // ----------------------------
    const targetUrl = 'http://localhost:5173/employer/job-postings/create';
    await page.goto(targetUrl);
    await page.waitForLoadState('networkidle');

    // ----------------------------
    // Assert: We should not stay on the create job URL
    // ----------------------------
    const currentUrl = page.url();
    expect(currentUrl).not.toBe(targetUrl);

    // ----------------------------
    // Assert: Employer profile UI is not visible
    // ----------------------------
    await assertEmployerProfileNotVisible(page);
  });

  /**
   * TC04: Student tries to access /employer/job-postings/:jobId/edit after login
   * Expected result:
   *   - Access is blocked
   *   - Final URL is NOT the edit-job URL
   *   - Employer profile page is NOT visible
   */
  test('EMP-TS-002-TC04: student cannot access edit job page', async ({
    page,
  }) => {
    // ----------------------------
    // Arrange: Login as student
    // ----------------------------
    await loginAsStudent(page);

    // ----------------------------
    // Act: Try to open employer edit job page
    // ----------------------------
    const targetUrl = 'http://localhost:5173/employer/job-postings/mock-job-id/edit';
    await page.goto(targetUrl);
    await page.waitForLoadState('networkidle');

    // ----------------------------
    // Assert: We should not stay on the edit job URL
    // ----------------------------
    const currentUrl = page.url();
    expect(currentUrl).not.toBe(targetUrl);

    // ----------------------------
    // Assert: Employer profile UI is not visible
    // ----------------------------
    await assertEmployerProfileNotVisible(page);
  });
});
