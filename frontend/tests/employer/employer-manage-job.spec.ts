import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: EMP-TS-008 – Manage Job (Update/Delete)
 * Area: Job Posting
 * Priority: P1
 * Tags: @regression
 */
test.describe('EMP-TS-008 Employer Manage Job @regression', () => {
  /**
   * Helper: login as Employer and land on dashboard job list
   */
  const loginAndOpenDashboard = async (page: any) => {
    // ----------------------------
    // Go to landing and login as employer
    // ----------------------------
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.getByRole('main').getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('networkidle');

    // ----------------------------
    // Ensure auth session persisted before navigating to employer area
    // ----------------------------
    await page.waitForFunction(() => !!localStorage.getItem('user'));

    // ----------------------------
    // Directly visit employer dashboard once session is ready
    // ----------------------------
    await page.goto('http://localhost:5173/employer');
    await page.waitForURL('**/employer');
    await page.waitForLoadState('networkidle');

    // ----------------------------
    // Ensure job card heading is visible
    // ----------------------------
    await expect(
      page.getByRole('heading', { name: 'Backend Developer Intern' }).first()
    ).toBeVisible();
  };

  /**
   * EMP-TS-008-TC01: employer edits an existing job
   * Expected result:
   *  - Job form shows existing values
   *  - Employer can save updated details
   *  - Toast confirms success and dashboard reflects new info
   */
  test('EMP-TS-008-TC01: employer updates an existing job', async ({ page }) => {
    await loginAndOpenDashboard(page);

    // ----------------------------
    // Open the edit form for the first job card
    // ----------------------------
    await page.getByRole('button', { name: 'Edit Job' }).first().click();
    await page.waitForURL('**/job-postings/**/edit');
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();

    // ----------------------------
    // Update core fields
    // ----------------------------
    await page.getByRole('textbox', { name: 'Job Title *' }).fill('Backend Developer Intern (Updated)');
    await page.getByRole('combobox', { name: 'Job Type *' }).click();
    await page.getByRole('option', { name: 'Part-time' }).click();

    await page.getByRole('combobox', { name: 'Work Arrangement *' }).click();
    await page.getByRole('option', { name: 'Remote' }).click();

    await page.getByRole('textbox', { name: 'Location *' }).fill('Remote - Bangkok Hub');
    await page.getByRole('textbox', { name: 'Duration *' }).fill('5 months');

    // ----------------------------
    // Remove an existing tag and add a new one
    // ----------------------------
    await page.getByRole('button', { name: 'remove backend' }).click();
    const tagsInput = page.getByRole('textbox', { name: 'Tags' });
    await tagsInput.fill('expressjs');
    await tagsInput.press('Enter');

    // ----------------------------
    // Save changes and confirm
    // ----------------------------
    const updateResponsePromise = page.waitForResponse((res) => {
      const request = res.request();
      return request.method() === 'PATCH' && res.url().includes('/job/');
    });
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.ok()).toBeTruthy();

    // ----------------------------
    // Expect toast and redirect to dashboard with updated job card
    // ----------------------------
    await expect(page.getByText('Job updated successfully')).toBeVisible();
    await page.waitForURL('**/employer');
    await expect(
      page.getByText('Backend Developer Intern (Updated)', { exact: false }).first()
    ).toBeVisible();
    await expect(
      page.getByText('Remote - Bangkok Hub', { exact: false }).first()
    ).toBeVisible();
  });

  /**
   * EMP-TS-008-TC02: employer deletes a job
   * Expected result:
   *  - Delete confirmation works
   *  - Toast shows success and job card disappears from dashboard
   */
  test('EMP-TS-008-TC02: employer deletes a job', async ({ page }) => {
    await loginAndOpenDashboard(page);

    // ----------------------------
    // Edit the job to reach delete controls
    // ----------------------------
    await page.getByRole('button', { name: 'Edit Job' }).first().click();
    await page.waitForURL('**/job-postings/**/edit');

    const deleteResponsePromise = page.waitForResponse((res) => {
      const request = res.request();
      return request.method() === 'DELETE' && res.url().includes('/job/');
    });

    await page.getByRole('button', { name: 'Delete Job' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.ok()).toBeTruthy();

    await expect(page.getByText('Job deleted')).toBeVisible();
    await page.waitForURL('**/employer');

    // ----------------------------
    // Deleted job should be gone, remaining listings still visible
    // ----------------------------
    await expect(
      page.getByText('Backend Developer Intern (Updated)', { exact: false })
    ).toHaveCount(0);
    await expect(
      page.getByText('UI/UX Designer Intern', { exact: false }).first()
    ).toBeVisible();
  });
});
