import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: EMP-TS-010 – Employer notifications
 * Priority: P2
 * Tags: @regression
 */
test.describe('EMP-TS-010 Employer notifications @regression', () => {
  // Mirrors the dashboard login helper from other employer specs.
  const loginAndOpenDashboard = async (page: any) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => !!localStorage.getItem('user'));
    await page.goto('http://localhost:5173/employer');
    await page.waitForURL('**/employer');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Backend Developer Intern' }).first()).toBeVisible();
  };

  test('EMP-TS-010-TC01: employer views application + announcement notifications', async ({ page }) => {
    // ----------------------------
    // Login and open employer notification tray
    // ----------------------------
    await loginAndOpenDashboard(page);

    await page.getByRole('button', { name: 'Open notifications' }).click();
    await expect(page.getByText('Notifications')).toBeVisible();

    // ----------------------------
    // Expand each notification
    // ----------------------------
    await page.getByRole('button', { name: 'New Job Application' }).click();
    await expect(
      page.getByText('Student Example has applied for "Backend Developer Intern".')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Job Fair' }).click();
    await expect(page.getByText('University will host a campus job fair on March 10.')).toBeVisible();

    // ----------------------------
    // Filter unread and mark application notification as read
    // ----------------------------
    await page.getByRole('button', { name: 'Unread' }).click();
    await expect(page.getByRole('button', { name: 'Job Fair' })).toHaveCount(0);

    await page.getByRole('button', { name: 'All' }).click();
    await page
      .getByRole('listitem')
      .filter({
        hasText: 'New Job ApplicationStudent Example has applied for "Backend Developer Intern".',
      })
      .getByLabel('Mark notification as read')
      .click();

    await page.getByRole('button', { name: 'Unread' }).click();
    await expect(page.getByRole('button', { name: 'New Job Application' })).toHaveCount(0);
    await page.getByRole('button', { name: 'All' }).click();
  });
});
