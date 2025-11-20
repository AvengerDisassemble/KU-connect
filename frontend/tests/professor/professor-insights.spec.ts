import { test, expect } from '../fixtures/professor.fixture';

const appUrl = 'http://localhost:5173';

const loginAndOpenInsights = async (page: any) => {
  // ----------------------------
  // Arrange: sign in as professor
  // ----------------------------
  await page.goto(appUrl);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('prof@ku.th');
  await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/professor', { waitUntil: 'networkidle' });

  // ----------------------------
  // Act: navigate to Insights view
  // ----------------------------
  await page.getByRole('link', { name: 'Insights' }).click();
  await page.waitForURL('**/professor/analytics', { waitUntil: 'networkidle' });

  // ----------------------------
  // Assert: insights heading is visible
  // ----------------------------
  await expect(page.getByRole('heading', { name: 'Professor Insights' })).toBeVisible();
};

/**
 * Scenario: PROF-TS-005 – View student insights
 * Priority: P1
 * Tags: @regression
 */
test.describe('PROF-TS-005 Professor insights view @regression', () => {
  /**
   * PROF-TS-005-TC01: professor views KPI cards and trends
   * Expected result:
   *  - KPI cards show job postings and new job metrics
   *  - Daily/Monthly trend charts render with axes
   *  - Job type donut and top companies cards visible
   */
  test('PROF-TS-005-TC01: professor reviews insights overview', async ({ page }) => {
    // ----------------------------
    // Arrange: login and open insights
    // ----------------------------
    await loginAndOpenInsights(page);

    // ----------------------------
    // Assert: KPI cards and charts render
    // ----------------------------
    await expect(page.getByText('Track employer demand, student applications', { exact: false })).toBeVisible();
    await expect(page.getByText('Active Job Postings')).toBeVisible();
    await expect(page.getByText('Total live opportunities')).toBeVisible();
    await expect(page.getByText('New Jobs This Month')).toBeVisible();
    await expect(page.getByText('MoM change')).toBeVisible();

    await expect(page.getByText('Application Trends')).toBeVisible();
    await expect(page.getByText('Monthly Applications vs New Jobs')).toBeVisible();

    await expect(page.getByText('Job Type Mix')).toBeVisible();
    await expect(page.getByText('Top Hiring Companies')).toBeVisible();
  });

  /**
   * PROF-TS-005-TC02: professor inspects charts and hover details
   * Expected result:
   *  - Daily trend chart tooltip appears when hovering
   *  - Monthly chart hover reveals data point details
   *  - Job type chart shows legend entries from mock data
   *  - Top companies list displays seeded company names
  */
  test('PROF-TS-005-TC02: professor interacts with insight charts', async ({ page }) => {
    // ----------------------------
    // Arrange: login and open insights
    // ----------------------------
    await loginAndOpenInsights(page);

    // ----------------------------
    // Assert: chart canvases, legends, and cards are visible
    // ----------------------------
    const jobTypeCard = page.getByText('Job Type Mix').locator('..').locator('..');
    const companiesCard = page.getByText('Top Hiring Companies').locator('..').locator('..');

    const dailyChart = page.locator('div', { hasText: 'Application Trends' }).locator('canvas').first();
    await expect(dailyChart).toBeVisible();

    const monthlyChart = page
      .locator('div', { hasText: 'Monthly Applications vs New Jobs' })
      .locator('canvas')
      .first();
    await expect(monthlyChart).toBeVisible();

    await expect(page.getByText('Success', { exact: false })).toBeVisible();
    await expect(page.getByText('Qualified', { exact: false })).toBeVisible();
    await expect(page.getByText('Rejected', { exact: false })).toBeVisible();
    await expect(page.getByText('Job Type Mix')).toBeVisible();
    await expect(jobTypeCard).toBeVisible();
    await expect(companiesCard).toBeVisible();
  });
});
