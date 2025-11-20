import { test, expect } from '../fixtures/student.fixture';

/**
 * Scenario: STU-TS-001 – Redirect unauthenticated (Student)
 * Priority: P0
 * Tags: @smoke
 */
test.describe('STU-TS-001 Student redirect unauthenticated @smoke', () => {
  const assertLoginPageVisible = async (page: any) => {
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Login to KU-Connect' })).toBeVisible();
    await expect(page.getByText('Email', { exact: true })).toBeVisible();
    await expect(page.getByText('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  };

  test('STU-TS-001-TC01: redirect unauthenticated from /student to /login', async ({ page }) => {
    await page.goto('http://localhost:5173/student', { waitUntil: 'load' });
    await assertLoginPageVisible(page);
  });

  test('STU-TS-001-TC02: redirect unauthenticated from /student/profile/:id to /login', async ({
    page,
  }) => {
    await page.goto('http://localhost:5173/student/profile/mock-student-id', { waitUntil: 'domcontentloaded' });
    await assertLoginPageVisible(page);
  });

  test('STU-TS-001-TC03: redirect unauthenticated from /student/browse-jobs to /login', async ({
    page,
  }) => {
    await page.goto('http://localhost:5173/student/browse-jobs', { waitUntil: 'domcontentloaded' });
    await assertLoginPageVisible(page);
  });
});
