import { test, expect } from '../fixtures/student.fixture';

/**
 * Scenario: STU-TS-003 – Student Registration (Alumni flow)
 * Priority: P1
 * Tags: @regression
 */
test.describe('STU-TS-003 Student Registration @regression', () => {
  test('STU-TS-003-TC01: alumni registration submits and lands on student home', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // ----------------------------
    // Open alumni registration
    // ----------------------------
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Register as Alumni' }).click();

    // ----------------------------
    // Fill registration form
    // ----------------------------
    await page.getByRole('textbox', { name: 'First Name' }).fill('Saranya');
    await page.getByRole('textbox', { name: 'Last Name' }).fill('Kasemsri');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('saranya.k@ku.ac.th');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('Password123!');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('Password123!');
    await page.getByRole('textbox', { name: 'Phone Number' }).fill('+66823456789');
    await page.getByRole('textbox', { name: 'Address', exact: true }).fill('Bangkok, Thailand');

    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Bachelor' }).click();

    const registerResponsePromise = page.waitForResponse((res) => {
      const req = res.request();
      return req.method() === 'POST' && res.url().includes('/register/alumni');
    });

    // ----------------------------
    // Submit and verify welcome
    // ----------------------------
    await page.getByRole('checkbox', { name: 'I consent to the processing' }).click();
    await page.getByRole('button', { name: 'Create Account' }).click();
    const registerRes = await registerResponsePromise;
    expect(registerRes.ok()).toBeTruthy();

    await expect(page.getByText('Welcome Saranya!')).toBeVisible();
    // await page.waitForURL('**/student/browse-jobs', { waitUntil: 'networkidle', timeout: 20000 });
  });
});
