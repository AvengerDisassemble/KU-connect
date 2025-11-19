import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: EMP-TS-003 – Employer Registration
 * Area: Auth
 * Priority: P1
 * Tags: @regression
 */
test.describe('EMP-TS-003 Employer Registration @regression', () => {
  /**
   * Helper: open landing page and switch to employer tab on register modal
   */
  const openEmployerRegistration = async (page: any) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await page.getByRole('tab', { name: 'Employer' }).click();
    await expect(page.getByText('Employer Registration')).toBeVisible();
  };

  const clickContinueButton = async (page: any) => {
    const continueButton = page.getByRole('button', { name: 'Continue' });
    await continueButton.scrollIntoViewIfNeeded();
    await continueButton.waitFor({ state: 'visible', timeout: 60000 });
    await continueButton.click({ timeout: 60000 });
  };

  /**
   * EMP-TS-003-TC01: employer registers and sees pending verification state
   * Expected result:
   *  - Multi-step form accepts valid details
   *  - Submission shows success toast
   *  - User is redirected to profile page showing verification checklist (pending)
   */
  test('EMP-TS-003-TC01: register employer account (pending verification)', async ({ page }) => {
    await openEmployerRegistration(page);

    // ----------------------------
    // Step 1: personal info
    // ----------------------------
    await page.getByRole('textbox', { name: 'First Name *' }).fill('Arthit');
    await page.getByRole('textbox', { name: 'Last Name *' }).fill('Srinakarin');
    await page.getByRole('textbox', { name: 'Work Email *' }).fill('arthit.srinakarin@siamma.com');
    await page.getByRole('textbox', { name: 'Password *' }).fill('SiammA123!');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('SiammA123!');
    await clickContinueButton(page);
    const companyNameInput = page.getByRole('textbox', { name: 'Company Name *' });
    await companyNameInput.waitFor({ state: 'visible', timeout: 60000 });

    // ----------------------------
    // Step 2: company info
    // ----------------------------
    await page.getByRole('textbox', { name: 'Company Name *' }).fill('Siam Manufacturing Co., Ltd.');
    await page.getByRole('textbox', { name: 'Company Address *' }).fill('88 Rama IV Road, Pathumwan, Bangkok 10330');
    await page.getByRole('textbox', { name: 'Company Description' }).fill('Manufacturing partner for automotive and energy industries.');
    await page.getByRole('combobox', { name: 'Industry' }).click();
    await page.getByRole('option', { name: 'IT Services' }).click();
    await page.getByRole('combobox', { name: 'Company Size' }).click();
    await page.getByRole('option', { name: '-50 employees' }).click();
    await clickContinueButton(page);
    await page
      .getByRole('button', { name: 'Submit for Verification' })
      .waitFor({ state: 'visible', timeout: 60000 });

    // ----------------------------
    // Step 3: contact info
    // ----------------------------
    await page.getByRole('textbox', { name: 'Phone Number *' }).fill('+66 86 555 1122');
    await page.getByRole('textbox', { name: 'Website' }).fill('https://siammanufacturing.com');

    const registerResponsePromise = page.waitForResponse(
      (res) => {
        const request = res.request();
        return request.method() === 'POST' && res.url().includes('/register/enterprise');
      },
      { timeout: 60000 }
    );

    const submitButton = page.getByRole('button', { name: 'Submit for Verification' });
    await expect(submitButton).toBeEnabled({ timeout: 60000 });
    await submitButton.click();
    const registerResponse = await registerResponsePromise;
    expect(registerResponse.ok()).toBeTruthy();

    await expect(
      page.getByText('Registration submitted! Awaiting verification.', { exact: false })
    ).toBeVisible();

    // ----------------------------
    // Auto login should bring user to profile page (pending verification)
    // ----------------------------
    await expect(
      page.getByRole('heading', { name: 'Company Profile & Verification' })
    ).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Awaiting verification approval')).toBeVisible();
  });
});
