import path from 'path';
import { test, expect } from '../fixtures/student.fixture';

/**
 * Scenario: STU-TS-006 – Browsing & Application
 * Priority: P0
 * Tags: @smoke
 */
test.describe('STU-TS-006 Student browsing & application @smoke', () => {
  const resumeFilePath = path.resolve(process.cwd(), 'tests/assets/sample-resume.pdf');

  const loginAsStudent = async (page: any) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('student1@ku.ac.th');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
    await page.getByRole('main').getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/student/browse-jobs', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  };

  test('STU-TS-006-TC01: student filters, paginates, and applies to a job', async ({ page }) => {
    await loginAsStudent(page);

    const searchInput = page.getByPlaceholder('Search jobs, companies, or keywords');

    await expect(page.getByRole('heading', { name: 'Contract Developer' }).first()).toBeVisible();

    await searchInput.fill('contract');
    await expect(page.getByRole('heading', { name: 'Contract Developer' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'UX Research Intern' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page.getByRole('heading', { name: 'UX Research Intern' })).toBeVisible();

    // ----------------------------
    // Filter by job type
    // ----------------------------
    const jobTypeSelect = page.getByRole('combobox').filter({ hasText: 'Job Type' }).first();
    await jobTypeSelect.click();
    await page.getByRole('option', { name: 'Full-time' }).click();
    await expect(page.getByRole('heading', { name: 'Full-Time QA Engineer' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contract Developer' })).toHaveCount(0);

    // ----------------------------
    // Filter by location
    // ----------------------------
    const openLocationSelect = async () => {
      const trigger = page.getByRole('combobox').filter({ hasText: 'Location' }).first();
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toBeVisible();
      await trigger.click({ force: true });
    };

    await openLocationSelect();
    await page.getByRole('option', { name: 'Phuket, Thailand' }).click();
    await expect(page.getByRole('paragraph').filter({ hasText: 'Phuket, Thailand' })).toBeVisible();

    // ----------------------------
    // Reset location to all
    // ----------------------------
    await page.getByRole('combobox').filter({ hasText: 'Phuket, Thailand' }).click();
    await page.getByRole('option', { name: 'All locations' }).click();

    // ----------------------------
    // Filter by work style
    // ----------------------------
    const workStyleSelect = page.getByRole('combobox').filter({ hasText: 'Work Style' }).first();
    await workStyleSelect.click();
    await page.getByRole('option', { name: 'On-site' }).click();
    await expect(page.getByText('On Site').first()).toBeVisible();

    // ----------------------------
    // Use advanced filters to select part-time jobs in Bangkok
    // ----------------------------
    await page.getByRole('button', { name: /^Filters/ }).click();
    await page.getByRole('button', { name: 'Part-time' }).click();
    await page.getByRole('button', { name: 'Bangkok, Thailand' }).click();
    await page.getByRole('button', { name: 'Apply Filters' }).click();

    // ----------------------------
    // Clear filters via the sheet
    // ----------------------------
    await page.getByRole('button', { name: /^Filters/ }).click();
    await page.getByRole('button', { name: 'Clear All' }).click();

    await expect(page.getByRole('heading', { name: 'Contract Developer' })).toBeVisible();

    // ----------------------------
    // Pagination controls
    // ----------------------------
    await expect(page.getByText('1 of 2')).toBeVisible();
    const clickPagination = async (label: string) => {
      const control = page.getByRole('button', { name: label, exact: true }).first();
      await control.scrollIntoViewIfNeeded();
      await expect(control).toBeVisible();
      await control.click({ force: true });
    };

    await clickPagination('›');
    await expect(page.getByText('2 of 2')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI Research Fellow' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contract Developer' })).toHaveCount(0);

    await clickPagination('‹');
    await expect(page.getByText('1 of 2')).toBeVisible();

    // ----------------------------
    // Apply to a job
    // ----------------------------
    await page
      .getByRole('heading', { name: 'Part-Time Remote Software Engineer' })
      .first()
      .click();
    await page.getByRole('button', { name: 'Apply Now' }).click();
    await page.getByLabel('Upload PDF resume').setInputFiles(resumeFilePath);
    await page.getByRole('button', { name: 'Submit application' }).click();

    await expect(page.getByText('Application submitted successfully.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Applied' })).toBeVisible();
  });
});
