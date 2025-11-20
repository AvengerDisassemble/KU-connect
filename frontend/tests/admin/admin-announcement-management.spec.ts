import { test, expect } from '../fixtures/admin.fixture';

/**
 * Scenario: ADM-TS-005 – Announcement management
 * Area: Admin / Communications
 * Priority: P1
 * Tags: @regression
 */
test.describe('ADM-TS-005 Announcement management @regression', () => {
  const appUrl = 'http://localhost:5173';

  const loginAsAdmin = async (page: any) => {
    // ----------------------------
    // Arrange: open landing page and launch login dialog
    // ----------------------------
    await page.goto(appUrl);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // ----------------------------
    // Act: submit admin credentials
    // ----------------------------
    await page.getByRole('textbox', { name: 'Email' }).fill('admin@ku.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Assert: guard redirects to admin dashboard
    // ----------------------------
    await page.waitForURL('**/admin', { waitUntil: 'networkidle' });
  };

  const navigateToAnnouncementManagement = async (page: any) => {
    // ----------------------------
    // Act: open Announcement Management page
    // ----------------------------
    await page.getByRole('link', { name: 'Announcements' }).click();
    await page.waitForURL('**/admin/announcements', { waitUntil: 'networkidle' });

    // ----------------------------
    // Assert: page heading and description visible
    // ----------------------------
    await expect(page.getByRole('heading', { name: 'Announcement Management' })).toBeVisible();
    await expect(
      page.getByText('Create announcements and ensure news reaches the right audience.')
    ).toBeVisible();
  };

  const fillAnnouncementForm = async (
    page: any,
    {
      title,
      content,
      audience,
      priority,
      expiresAt,
    }: {
      title: string;
      content: string;
      audience: 'All Users' | 'Students' | 'Employers' | 'Professors' | 'Admins';
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      expiresAt: string;
    }
  ) => {
    const dialog = page.getByRole('dialog');

    // ----------------------------
    // Arrange: populate announcement fields
    // ----------------------------
    await dialog.getByRole('textbox', { name: 'Title' }).fill(title);
    await dialog.getByRole('textbox', { name: 'Content' }).fill(content);

    await dialog.getByRole('combobox').filter({ hasText: /All Users|Students|Employers|Professors|Admins/ }).click();
    await page.getByRole('option', { name: audience }).click();

    await dialog.getByRole('combobox').filter({ hasText: /LOW|MEDIUM|HIGH/ }).click();
    await page.getByRole('option', { name: priority }).click();

    await dialog.getByRole('textbox', { name: 'Expiration Date' }).fill(expiresAt);
    await dialog.getByRole('button', { name: 'Save Announcement' }).click();
  };

  /**
   * TC01: Admin creates multiple announcements and filters list
   * Expected:
   *  - Two announcements are created with distinct audiences/priorities
   *  - Audience filter narrows list to the selected segment
   *  - Status filter (Active) still lists active announcements
   */
  test('ADM-TS-004-TC01: create announcements and filter by audience/status', async ({ page }) => {
    // ----------------------------
    // Arrange: login and open Announcement Management
    // ----------------------------
    await loginAsAdmin(page);
    await navigateToAnnouncementManagement(page);

    const filterComboboxes = page
      .getByRole('combobox')
      .filter({
        hasText: /(All audiences|All Users|Students|Employers|Professors|Admins|All|Active|Inactive)/,
      });
    const audienceFilter = () => filterComboboxes.nth(0);
    const statusFilter = () => filterComboboxes.nth(1);

    const studentAnnouncement = {
      title: 'Internship Policy Update',
      content: 'University career services updated the internship submission policy.',
      audience: 'Students' as const,
      priority: 'MEDIUM' as const,
      expiresAt: '2025-11-30',
    };

    await page.getByRole('button', { name: 'New Announcement' }).click();
    // ----------------------------
    // Act: create student-focused announcement
    // ----------------------------
    await fillAnnouncementForm(page, studentAnnouncement);
    await page.waitForTimeout(500);
    await expect(page.getByText('Announcement created')).toBeVisible();
    await expect(page.getByText(studentAnnouncement.title, { exact: true })).toBeVisible();
    await page.waitForTimeout(4000);

    const employerAnnouncement = {
      title: 'Job Fair 2025',
      content: 'Employers are invited to join Job Fair 2025 on campus.',
      audience: 'Employers' as const,
      priority: 'LOW' as const,
      expiresAt: '2025-11-29',
    };

    await page.getByRole('button', { name: 'New Announcement' }).click();
    // ----------------------------
    // Act: create employer-focused announcement
    // ----------------------------
    await fillAnnouncementForm(page, employerAnnouncement);
    await expect(page.getByText('Announcement created')).toBeVisible();
    await expect(page.getByText(employerAnnouncement.title, { exact: true })).toBeVisible();

    // ----------------------------
    // Assert: filtering by Students shows student announcement only
    // ----------------------------
    await audienceFilter().click();
    await page.getByRole('option', { name: 'Students' }).click();
    await expect(page.getByText(studentAnnouncement.title, { exact: true })).toBeVisible();
    await expect(page.getByText(employerAnnouncement.title, { exact: true })).toHaveCount(0);

    // ----------------------------
    // Assert: filtering by Employers shows employer announcement only
    // ----------------------------
    await audienceFilter().click();
    await page.getByRole('option', { name: 'Employers' }).click();
    await expect(page.getByText(employerAnnouncement.title, { exact: true })).toBeVisible();
    await expect(page.getByText(studentAnnouncement.title, { exact: true })).toHaveCount(0);

    // ----------------------------
    // Assert: All audiences displays both announcements
    // ----------------------------
    await audienceFilter().click();
    await page.getByRole('option', { name: 'All audiences' }).click();
    await expect(page.getByText(studentAnnouncement.title, { exact: true })).toBeVisible();
    await expect(page.getByText(employerAnnouncement.title, { exact: true })).toBeVisible();

    // ----------------------------
    // Assert: Active status retains both entries
    // ----------------------------
    await statusFilter().click();
    await page.getByRole('option', { name: 'Active', exact: true }).click();
    await expect(page.getByText(studentAnnouncement.title, { exact: true })).toBeVisible();
    await expect(page.getByText(employerAnnouncement.title, { exact: true })).toBeVisible();
  });
});
