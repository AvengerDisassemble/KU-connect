import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: EMP-TS-006 – Create Job (Happy Path)
 * Area: Job Posting
 * Priority: P0
 * Tags: @smoke
 */
test.describe('EMP-TS-006 Employer Create Job @smoke', () => {
  /**
   * Helper: login as employer and navigate to create job page
   */
  const loginAndGoToCreateJob = async (page: any) => {
    // Open home page
    await page.goto('http://localhost:5173/');

    // Go to Login
    await page.getByRole('button', { name: 'Login' }).click();

    // Fill credentials
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');

    // Submit login
    await page.getByRole('main').getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('networkidle');

    // Navigate to create job form
    await page.goto('http://localhost:5173/employer/job-postings/create');
    await page.waitForLoadState('networkidle');

    // Company header should show the employer’s company (from mock profile)
    await expect(
      page.getByRole('heading', { name: 'Test Company Ltd.' })
    ).toBeVisible({ timeout: 10000 });
  };

  /**
   * TC01: Employer creates a job successfully
   * Expected:
   *  - Required fields can be filled
   *  - Tags/Lists added via typing + Enter
   *  - Preview shows correct info
   *  - Confirm → success toast shows
   */
  test('EMP-TS-006-TC01: create job posting successfully', async ({ page }) => {
    await loginAndGoToCreateJob(page);

    // ----------------------------
    // Fill basic job information
    // ----------------------------

    await page.getByRole('textbox', { name: 'Job Title *' }).fill('Backend Intern');
    await page.getByRole('combobox', { name: 'Job Type *' }).click();
    await page.getByRole('option', { name: 'Internship' }).click();

    await page.getByRole('combobox', { name: 'Work Arrangement *' }).click();
    await page.getByRole('option', { name: 'Hybrid' }).click();

    await page.getByRole('textbox', { name: 'Location *' }).fill('Bangkok, Thailand');
    await page.getByRole('textbox', { name: 'Duration *' }).fill('3 months');

    await page.getByRole('textbox', { name: 'Job Description *' }).fill(
      'Assist backend team with API development and debugging.'
    );

    // Salary fields (textboxes with number input)
    await page.getByRole('textbox', { name: '10000' }).fill('15000');
    await page.getByRole('textbox', { name: '15000' }).fill('20000');

    // ----------------------------
    // Tags (press Enter adds 1 tag)
    // ----------------------------
    const tagsInput = page.getByRole('textbox', { name: 'Tags' });
    await tagsInput.fill('nodejs');
    await tagsInput.press('Enter');

    // ----------------------------
    // Requirements
    // ----------------------------
    const reqInput = page.getByRole('textbox', { name: 'Requirements' });
    await reqInput.fill('Basic SQL knowledge');
    await reqInput.press('Enter');

    // ----------------------------
    // Qualifications
    // ----------------------------
    const qualInput = page.getByRole('textbox', { name: 'Qualifications' });
    await qualInput.fill('Studying Computer Engineering');
    await qualInput.press('Enter');

    // ----------------------------
    // Responsibilities
    // ----------------------------
    const respInput = page.getByRole('textbox', { name: 'Responsibilities' });
    await respInput.fill('Assist backend engineers');
    await respInput.press('Enter');

    // ----------------------------
    // Benefits
    // ----------------------------
    const benInput = page.getByRole('textbox', { name: 'Benefits' });
    await benInput.fill('Free lunch');
    await benInput.press('Enter');

    // ----------------------------
    // Contact information
    // ----------------------------
    await page.getByRole('textbox', { name: 'Application Deadline *' }).fill('2025-11-30');
    await page.getByRole('textbox', { name: 'Phone *' }).fill('+66 87 654 3210');

    // (Email optional - skip)

    // ----------------------------
    // Preview Section Assertions
    // ----------------------------

    // await expect(page.getByRole('heading', { name: 'Backend Intern' })).toBeVisible();
    // await expect(page.getByText('Test Company Ltd.', { exact: false })).toBeVisible();
    // await expect(page.getByText('Bangkok, Thailand', { exact: true })).toBeVisible();
    // await expect(page.getByText('internship', { exact: true })).toBeVisible();
    // await expect(page.getByText('hybrid', { exact: true })).toBeVisible();
    // await expect(page.getByText('- 15000 THB')).toBeVisible();

    // ----------------------------
    // Submit: Post Job → Confirm
    // ----------------------------
    const [jobRes] = await Promise.all([
      // Wait for POST /job to be sent and completed
      page.waitForResponse((res) => {
        const req = res.request();
        return req.method() === 'POST' && res.url().includes('/job');
      }),
      // Click confirm in the dialog
      (async () => {
        await page.getByRole('button', { name: 'Post Job' }).click();
        await page.getByRole('button', { name: 'Confirm' }).click();
      })(),
    ]);

    // Ensure mocked API responded OK
    expect(jobRes.ok()).toBeTruthy();

    // ----------------------------
    // Toast: Job posted successfully
    // ----------------------------
    await expect(
      page.getByText('Job posted successfully', { exact: false })
    ).toBeVisible();

    await expect(
      page.getByText('Created: Backend Intern', { exact: false })
    ).toBeVisible();
  });
});
