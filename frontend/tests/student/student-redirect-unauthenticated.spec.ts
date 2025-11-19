import { test, expect } from '../fixtures/student.fixture';

/**
 * Scenario: STU-TS-001 – Redirect unauthenticated (Student)
 * Priority: P0
 * Type: Positive
 * Tags: @smoke
 */
test.describe('STU-TS-001 Student Redirect unauthenticated @smoke', () => {
  test('STU-TS-001-TC01: redirect unauthenticated user to login', async ({ page }) => {
    // ----------------------------
    // Attempt to open student dashboard without logging in
    // ----------------------------
    await page.goto('http://localhost:5173/student', { waitUntil: 'load' });

    // ----------------------------
    // Expect guard to send user to login page
    // ----------------------------
    await page.waitForURL('**/login', { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('heading', { name: 'Login to KU-Connect' })
    ).toBeVisible();
  });
});
