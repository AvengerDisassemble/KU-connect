import { test, expect } from '../fixtures/student.fixture';

/**
 * Scenario: STU-TS-007 – Application status reflects backend data
 * Priority: P1
 * Tags: @regression
 */
test.describe('STU-TS-007 Student application status @regression', () => {
  // Reuse the same login helper as other student specs.
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

  test('STU-TS-007-TC01: student sees dashboard statuses that match the API payload', async ({
    page,
  }) => {
    // ----------------------------
    // Login and reach the student dashboard
    // ----------------------------
    await loginAsStudent(page);
    await page.getByRole('link', { name: 'Home' }).click();
    await page.waitForURL('**/student', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // ----------------------------
    // Open the applications widget and verify table rows
    // ----------------------------
    await page.getByText('My applications').click();
    await expect(page.getByText('Monitor your latest submissions')).toBeVisible();

    const expectStatusFor = async (jobTitle: string, statusLabel: string) => {
      const row = page.getByRole('row', {
        name: new RegExp(`${jobTitle}.*${statusLabel}`, 'i'),
      });
      await expect(row).toBeVisible();
      await expect(row.getByRole('cell', { name: jobTitle, exact: true })).toBeVisible();
      await expect(row.getByRole('cell', { name: statusLabel, exact: true })).toBeVisible();
    };

    await expectStatusFor('UX Research Intern', 'Qualified');
    await expectStatusFor('Full-Time QA Engineer', 'Pending');
    await expectStatusFor('Contract Developer', 'Rejected');
  });
});
