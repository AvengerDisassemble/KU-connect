import { test, expect } from '../fixtures/admin.fixture';

/**
 * Scenario: ADM-TS-004 – Verification Review employer verification
 * Area: Admin / User Management
 * Priority: P1
 * Tags: @regression
 */
test.describe('ADM-TS-004 Admin verification review @regression', () => {
  const appUrl = 'http://localhost:5173';

  const loginAsAdmin = async (page: any) => {
    // ----------------------------
    // Arrange: open landing page and launch sign-in modal
    // ----------------------------
    await page.goto(appUrl);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // ----------------------------
    // Act: submit admin credentials
    // ----------------------------
    await page.getByRole('textbox', { name: 'Email' }).fill('admin@ku.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('**/admin', { waitUntil: 'networkidle' });
  };

  const navigateToUserManagement = async (page: any) => {
    // ----------------------------
    // Act: open User Management section
    // ----------------------------
    await page.getByRole('link', { name: 'User Management' }).click();
    await page.waitForURL('**/admin/users', { waitUntil: 'networkidle' });

    // ----------------------------
    // Assert: hero heading and description
    // ----------------------------
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
    await expect(
      page.getByText('Approve new accounts, suspend misuse, and onboard professors.')
    ).toBeVisible();
  };

  const rowForUser = (page: any, name: string) =>
    page.getByRole('row', { name: new RegExp(name, 'i') });

  const openVerificationPreview = async (page: any) => {
    await expect(
      page.getByRole('heading', { name: 'Employer verification preview' })
    ).toBeVisible();
    await expect(
      page.getByText('Preview submitted documents before making a decision.')
    ).toBeVisible();
  };

  test('ADM-TS-004-TC01: approve and reject employer verification requests', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToUserManagement(page);

    // ----------------------------
    // Arrange: locate first pending employer
    // ----------------------------
    const approveRow = rowForUser(page, 'NewEm2 Test');
    await expect(approveRow.getByText('PENDING', { exact: true })).toBeVisible();

    // ----------------------------
    // Act: preview employer verification document
    // ----------------------------
    await approveRow.getByRole('button', { name: 'Verification' }).click();
    await openVerificationPreview(page);

    await page.getByRole('button', { name: 'Close' }).first().click();

    // ----------------------------
    // Act: approve employer verification
    // ----------------------------
    await approveRow.getByRole('button', { name: 'Approve' }).click();

    // ----------------------------
    // Assert: toast and status change
    // ----------------------------
    await expect(page.getByText('User approved')).toBeVisible();
    await expect(rowForUser(page, 'NewEm2 Test').getByText('APPROVED')).toBeVisible();

    // ----------------------------
    // Arrange: locate second pending employer
    // ----------------------------
    const rejectRow = rowForUser(page, 'NewEm Test');
    await expect(rejectRow.getByText('PENDING', { exact: true })).toBeVisible();

    // ----------------------------
    // Act: preview second employer verification document
    // ----------------------------
    await rejectRow.getByRole('button', { name: 'Verification' }).click();
    await openVerificationPreview(page);

    await page.getByRole('button', { name: 'Close' }).first().click();

    // ----------------------------
    // Act: reject employer via overflow actions
    // ----------------------------
    await rejectRow.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Reject' }).click();

    // ----------------------------
    // Assert: toast and status updates to REJECTED
    // ----------------------------
    await expect(page.getByText('User rejected')).toBeVisible();
  });
});
