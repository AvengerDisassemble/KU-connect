import { test, expect } from '../fixtures/admin.fixture';

/**
 * Scenario: ADM-TS-006 – Admin reviews reported jobs
 * Area: Admin / Moderation
 * Priority: P1
 * Tags: @regression
 */
test.describe('ADM-TS-006 Admin report moderation @regression', () => {
  const appUrl = 'http://localhost:5173';

  const loginAsAdmin = async (page: any) => {
    // ----------------------------
    // Arrange: open app and login as admin
    // ----------------------------
    await page.goto(appUrl);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('admin@ku.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.locator('form').getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/admin', { waitUntil: 'networkidle' });
  };

  const navigateToReportManagement = async (page: any) => {
    // ----------------------------
    // Act: open Report Management view
    // ----------------------------
    await page.getByRole('link', { name: 'Reports' }).click();
    await page.waitForURL('**/admin/reports', { waitUntil: 'networkidle' });

    // ----------------------------
    // Assert: hero content and summary cards visible
    // ----------------------------
    await expect(page.getByRole('heading', { name: 'Report Management' })).toBeVisible();
    await expect(
      page.getByText('Monitor and resolve user reports related to job postings.')
    ).toBeVisible();
    await expect(page.getByText('Total Reports')).toBeVisible();
    await expect(page.getByText('Unresolved Reports')).toBeVisible();
    await expect(page.getByText('Investigate reported job postings')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reported Jobs' })).toBeVisible();
  };

  const openReportDetails = async (page: any, jobTitle: string) => {
    // ----------------------------
    // Act: open report dialog for specific job
    // ----------------------------
    await page
      .getByRole('row', { name: new RegExp(jobTitle, 'i') })
      .getByRole('button', { name: 'View Details' })
      .click();

    const dialog = page.getByRole('dialog');
    // ----------------------------
    // Assert: dialog sections render
    // ----------------------------
    await expect(dialog.getByRole('heading', { name: 'Report Details' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Job', exact: true })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Reporter' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Reason' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Job Overview' })).toBeVisible();
    return dialog;
  };

  /**
   * TC01: Admin resolves report and keeps job active
   * Expected result: Report details shown, moderator marks as resolved, report disappears from table
   */
  test('ADM-TS-006-TC01: resolve report without deleting job', async ({ page }) => {
    // ----------------------------
    // Arrange: login and navigate to reports
    // ----------------------------
    await loginAsAdmin(page);
    await navigateToReportManagement(page);

    // ----------------------------
    // Act: open report dialog for Technical Intern
    // ----------------------------
    const dialog = await openReportDetails(page, 'Technical Intern');
    await expect(dialog.getByText('i dont like this job')).toBeVisible();
    await expect(dialog.getByText('Submitted')).toBeVisible();
    await expect(dialog.getByText('Report ID')).toBeVisible();

    // ----------------------------
    // Act: resolve report without deleting job
    // ----------------------------
    await dialog.getByRole('button', { name: 'Mark as Resolved' }).click();
    await expect(page.getByText('Report marked as resolved')).toBeVisible();

    // ----------------------------
    // Assert: resolved report removed; remaining reports visible
    // ----------------------------
    await expect(page.getByRole('row', { name: /Technical Intern/i })).toHaveCount(0);
    await expect(page.getByRole('row', { name: /Contract On-site Role/i })).toBeVisible();
  });

  /**
   * TC02: Admin deletes reported job and resolves report simultaneously
   * Expected result: Deletion confirms via toast and report row disappears
   */
  test('ADM-TS-006-TC02: delete job and resolve report', async ({ page }) => {
    // ----------------------------
    // Arrange: login and open Report Management
    // ----------------------------
    await loginAsAdmin(page);
    await navigateToReportManagement(page);

    // ----------------------------
    // Act: open report dialog for Contract On-site Role
    // ----------------------------
    const dialog = await openReportDetails(page, 'Contract On-site Role');
    await expect(dialog.getByText('not relieable information')).toBeVisible();

    // ----------------------------
    // Act: delete job and resolve report simultaneously
    // ----------------------------
    await dialog.getByRole('button', { name: 'Delete Job & Resolve' }).click();
    await expect(page.getByText('Job deleted and report resolved')).toBeVisible();

    // ----------------------------
    // Assert: report removed and other listings remain
    // ----------------------------
    await expect(page.getByRole('row', { name: /Contract On-site Role/i })).toHaveCount(0);
    await expect(page.getByRole('row', { name: /Technical Intern/i })).toBeVisible();
  });
});
