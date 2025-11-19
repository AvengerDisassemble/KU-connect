import { test, expect } from '../fixtures/professor.fixture';

const appUrl = 'http://localhost:5173';

const loginAsProfessor = async (page: any) => {
  await page.goto(appUrl);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('prof@ku.th');
  await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
  await page.locator('form').getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/professor', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Student Analytics' })).toBeVisible();
};

const studentNameCell = (page: any, first: string, last: string) =>
  page
    .locator('td')
    .filter({ has: page.locator('span', { hasText: first }) })
    .filter({ has: page.locator('span', { hasText: last }) });

/**
 * Scenario: PROF-TS-004 – View professor dashboard
 * Priority: P1
 * Tags: @regression
 */
test.describe('PROF-TS-004 Professor dashboard overview @regression', () => {
  /**
   * PROF-TS-004-TC01: professor views dashboard summary
   * Expected result:
   *  - Landing on /professor shows stat cards, filters, and student list
   *  - KPI cards show key labels (students monitored, applications, placement)
   *  - Student list table renders seeded student rows
   */
  test('PROF-TS-004-TC01: professor sees dashboard stats and student list', async ({ page }) => {
    await loginAsProfessor(page);

    await expect(page).toHaveURL(/\/professor$/);
    await expect(page.getByText('Students Monitored', { exact: false })).toBeVisible();
    await expect(page.getByText('Job Applications', { exact: false })).toBeVisible();
    await expect(page.getByText('Placement Success', { exact: false })).toBeVisible();

    await expect(
      page.getByPlaceholder('Search students by name, ID, or degree...')
    ).toBeVisible();
    await expect(page.getByText('Export filtered CSV')).toBeVisible();
    await expect(page.getByText('Student Job Search Analytics')).toBeVisible();

    await expect(studentNameCell(page, 'Anya', 'Tanaporn').first()).toBeVisible();
    await expect(studentNameCell(page, 'Chai', 'Phan').first()).toBeVisible();
  });

  /**
   * PROF-TS-004-TC02: professor filters and exports student insight data
   * Expected result:
   *  - Degree/year/time filters can be changed to narrow the list
   *  - Search narrows down results and empty state appears when no student matches
   *  - Export button triggers a CSV download and refresh button resets filters summary text
   */
  test('PROF-TS-004-TC02: professor filters students and exports data', async ({ page }) => {
    await loginAsProfessor(page);

    // Apply dropdown filters
    await page.getByRole('combobox').filter({ hasText: 'All Degrees' }).click();
    await page.getByRole('option', { name: 'Bachelor' }).click();

    await page.getByRole('combobox').filter({ hasText: 'All Years' }).click();
    await page.getByRole('option', { name: /Grad 2025/ }).click();

    await page.getByRole('combobox').filter({ hasText: 'Last 90 Days' }).click();
    await page.getByRole('option', { name: 'Last 30 Days' }).click();

    // Search for a specific student
    const searchInput = page.getByPlaceholder('Search students by name, ID, or degree...');
    await searchInput.fill('Anya');
    await expect(studentNameCell(page, 'Anya', 'Tanaporn').first()).toBeVisible();
    await expect(studentNameCell(page, 'Chai', 'Phan')).toHaveCount(0);

    // Search mismatch to show empty state
    await searchInput.fill('somchai');
    await expect(
      page.locator('tbody td').filter({ hasText: 'No students match the current filters.' }).nth(0)
    ).toBeVisible();

    // Clear search to bring results back
    await searchInput.fill('');
    await expect(studentNameCell(page, 'Anya', 'Tanaporn').first()).toBeVisible();

    // Export current filter set
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export filtered CSV' }).click();
    await downloadPromise;

    // Refresh data to reset filters (text summary remains visible)
    await page.getByRole('button', { name: 'Refresh data' }).click();
    await expect(page.getByText('Showing insights for', { exact: false })).toBeVisible();
  });
});
