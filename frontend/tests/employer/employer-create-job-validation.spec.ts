// frontend/tests/employer/employer-create-job-validation.spec.ts
import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: EMP-TS-007 – Create Job Validation
 * Priority: P0
 */
test.describe('EMP-TS-007 Employer Create Job Validation', () => {
  // ----------------------------------------
  // Helper: login + go to create job page
  // ----------------------------------------
  const gotoCreateJobPage = async (page: any) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.getByRole('main').getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('networkidle');

    await page.goto('http://localhost:5173/employer/job-postings/create');
    await page.waitForLoadState('networkidle');
  };

  // ----------------------------------------
  // TC01: Invalid phone number
  // ----------------------------------------
  // test('EMP-TS-007-TC01: invalid phone number shows validation toast', async ({
  //   page,
  // }) => {
  //   await gotoCreateJobPage(page);

  //   // Fill required fields (valid)
  //   await page.getByRole('textbox', { name: 'Job Title *' }).fill('Backend Intern');
  //   await page.getByRole('combobox', { name: 'Job Type *' }).click();
  //   await page.getByRole('option', { name: 'Internship' }).click();
  //   await page.getByRole('combobox', { name: 'Work Arrangement *' }).click();
  //   await page.getByRole('option', { name: 'Hybrid' }).click();
  //   await page.getByRole('textbox', { name: 'Location *' }).fill('Bangkok');
  //   await page.getByRole('textbox', { name: 'Duration *' }).fill('3 months');
  //   await page.getByRole('textbox', { name: 'Job Description *' }).fill('Valid job description');
  //   await page.getByRole('textbox', { name: '10000' }).fill('10000');
  //   await page.getByRole('textbox', { name: '15000' }).fill('15000');
  //   await page.getByRole('textbox', { name: 'Application Deadline *' }).fill('2025-11-30');

  //   // Invalid phone number
  //   await page.getByRole('textbox', { name: 'Phone *' }).fill('123');

  //   // Submit
  //   await page.getByRole('button', { name: 'Post Job' }).click();
  //   await page.getByRole('button', { name: 'Confirm' }).click();

  //   // Expect toast
  //   await expect(page.getByText('Invalid phone number', { exact: false })).toBeVisible();
  // });

  // ----------------------------------------
  // TC02: Salary validation
  // ----------------------------------------
  test('EMP-TS-007-TC02: salary validation toasts appear', async ({ page }) => {
    await gotoCreateJobPage(page);

    // Fill required fields (valid)
    await page.getByRole('textbox', { name: 'Job Title *' }).fill('Backend Intern');
    await page.getByRole('combobox', { name: 'Job Type *' }).click();
    await page.getByRole('option', { name: 'Internship' }).click();
    await page.getByRole('combobox', { name: 'Work Arrangement *' }).click();
    await page.getByRole('option', { name: 'Hybrid' }).click();
    await page.getByRole('textbox', { name: 'Location *' }).fill('Bangkok');
    await page.getByRole('textbox', { name: 'Duration *' }).fill('3 months');
    await page.getByRole('textbox', { name: 'Job Description *' }).fill('Valid job description');
    await page.getByRole('textbox', { name: 'Application Deadline *' }).fill('2025-11-30');
    await page.getByRole('textbox', { name: 'Phone *' }).fill('+66876543210');

    // Min > Max
    await page.getByRole('textbox', { name: '10000' }).fill('20000');
    await page.getByRole('textbox', { name: '15000' }).fill('10000');

    await page.getByRole('button', { name: 'Post Job' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(
      page.getByText('Min Salary must be less than or equal to Max Salary', {
        exact: false,
      })
    ).toBeVisible();
  });

  // ----------------------------------------
  // TC03: Text length validation
  // ----------------------------------------
  test('EMP-TS-007-TC03: text length validation appears in toast', async ({
    page,
  }) => {
    await gotoCreateJobPage(page);

    // Short/invalid fields
    await page.getByRole('textbox', { name: 'Job Title *' }).fill('A');
    await page.getByRole('textbox', { name: 'Job Description *' }).fill('short');
    await page.getByRole('textbox', { name: 'Location *' }).fill('B');

    // Other required valid fields
    await page.getByRole('combobox', { name: 'Job Type *' }).click();
    await page.getByRole('option', { name: 'Internship' }).click();
    await page.getByRole('combobox', { name: 'Work Arrangement *' }).click();
    await page.getByRole('option', { name: 'Hybrid' }).click();
    await page.getByRole('textbox', { name: 'Duration *' }).fill('3 months');
    await page.getByRole('textbox', { name: 'Application Deadline *' }).fill('2025-11-30');
    await page.getByRole('textbox', { name: 'Phone *' }).fill('+66876543210');
    await page.getByRole('textbox', { name: '10000' }).fill('1000');
    await page.getByRole('textbox', { name: '15000' }).fill('2000');

    await page.getByRole('button', { name: 'Post Job' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(
      page.getByText('Failed to post job', { exact: false })
    ).toBeVisible();

    await expect(
      page.getByText('"title" length must be at least 3 characters long', {
        exact: false,
      })
    ).toBeVisible();

    await expect(
      page.getByText('"description" length must be at least 10 characters long', {
        exact: false,
      })
    ).toBeVisible();

    await expect(
      page.getByText('"location" length must be at least 2 characters long', {
        exact: false,
      })
    ).toBeVisible();
  });
});
