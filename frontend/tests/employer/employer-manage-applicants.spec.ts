import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: EMP-TS-009 – Approve / Reject Applicants
 * Area: Employer Dashboard
 * Priority: P0
 * Tags: @smoke
 */
test.describe('EMP-TS-009 Employer Manage Applicants @smoke', () => {
  /**
   * Helper: login as employer and land on dashboard
   */
  const loginAndOpenDashboard = async (page: any) => {
    // ----------------------------
    // Login as employer
    // ----------------------------
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.locator('form').getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => !!localStorage.getItem('user'));

    // ----------------------------
    // Navigate to employer dashboard
    // ----------------------------
    await page.goto('http://localhost:5173/employer');
    await page.waitForURL('**/employer');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Applicants Inbox' })).toBeVisible();
  };

  /**
   * EMP-TS-009-TC01: employer approves an applicant
   * Expected result:
   *  - Modal shows applicant info
   *  - Approving triggers success toast and status updates to Qualified
   */
  test('EMP-TS-009-TC01: approve applicant updates status', async ({ page }) => {
    await loginAndOpenDashboard(page);

    // ----------------------------
    // Open applicant modal
    // ----------------------------
    const applicantRow = page.locator('tr').filter({ hasText: 'Alice K.' }).first();
    await expect(applicantRow.getByText('Pending', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /View application of/i }).first().click();
    await expect(page.getByText('Profile', { exact: true })).toBeVisible();
    await expect(page.getByText('Documents', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download' })).toBeVisible();

    // ----------------------------
    // Approve and verify
    // ----------------------------
    const approveResponse = page.waitForResponse((res) => {
      const req = res.request();
      return req.method() === 'POST' && res.url().includes('/job/') && res.url().includes('/applyer');
    });
    await page.getByRole('button', { name: 'Approve' }).click();
    const approveRes = await approveResponse;
    expect(approveRes.ok()).toBeTruthy();

    await expect(page.getByText('Application qualified', { exact: false })).toBeVisible();
    await expect(applicantRow.getByText('Qualified', { exact: true })).toBeVisible();
  });

  /**
   * EMP-TS-009-TC02: employer rejects an applicant
   * Expected result:
   *  - Modal appears
   *  - Rejecting triggers success toast and status updates to Rejected
   */
  test('EMP-TS-009-TC02: reject applicant updates status', async ({ page }) => {
    await loginAndOpenDashboard(page);

    // ----------------------------
    // Open applicant modal
    // ----------------------------
    const applicantRow = page.locator('tr').filter({ hasText: 'Alice K.' }).first();
    await expect(applicantRow.getByText('Pending', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /View application of/i }).first().click();
    await expect(page.getByText('Profile', { exact: true })).toBeVisible();
    await expect(page.getByText('Documents', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download' })).toBeVisible();

    // ----------------------------
    // Reject and verify
    // ----------------------------
    const rejectResponse = page.waitForResponse((res) => {
      const req = res.request();
      return req.method() === 'POST' && res.url().includes('/job/') && res.url().includes('/applyer');
    });
    await page.getByRole('button', { name: 'Reject' }).click();
    const rejectRes = await rejectResponse;
    expect(rejectRes.ok()).toBeTruthy();

    await expect(page.getByText('Application rejected', { exact: false })).toBeVisible();
    await expect(applicantRow.getByText('Rejected', { exact: true })).toBeVisible();
  });
});
