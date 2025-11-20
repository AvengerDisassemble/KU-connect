import { test, expect } from '../fixtures/student.fixture';

/**
 * Scenario: STU-TS-009 – Notifications show status changes
 * Priority: P2
 * Tags: @regression
 */
test.describe('STU-TS-009 Student notifications @regression', () => {
  // Helper mirrors other student specs for consistency.
  const loginAsStudent = async (page: any) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('student1@ku.ac.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/student/browse-jobs', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  };

  test('STU-TS-009-TC01: student reviews notification feed and filters unread items', async ({
    page,
  }) => {
    // ----------------------------
    // Login and open notification tray
    // ----------------------------
    await loginAsStudent(page);
    await page.getByRole('button', { name: 'Open notifications' }).click();
    await expect(page.getByText('Notifications')).toBeVisible();

    // ----------------------------
    // Expand each notification entry
    // ----------------------------
    await page.getByRole('button', { name: 'Application Update' }).first().click();
    await expect(
      page.getByText('Your job application for "Contract Developer" has been rejected.')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Application Update' }).nth(1).click();
    await expect(
      page.getByText('Great news! "UX Research Intern" has moved to qualified status.')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Career Fair Announcement' }).click();
    await expect(
      page.getByText('Join the KU career fair on February 20 at the main auditorium.')
    ).toBeVisible();

    // ----------------------------
    // Toggle filters and mark read
    // ----------------------------
    await page.getByRole('button', { name: 'Unread' }).click();
    await expect(page.getByRole('button', { name: 'Career Fair Announcement' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Application Update' })).toHaveCount(2);

    await page.getByRole('button', { name: 'All' }).click();
    await page.getByRole('button', { name: 'Mark notification as read' }).first().click();

    await page.getByRole('button', { name: 'Unread' }).click();
    await expect(page.getByRole('button', { name: 'Application Update' })).toHaveCount(1);
    await page.getByRole('button', { name: 'All' }).click();
  });
});
