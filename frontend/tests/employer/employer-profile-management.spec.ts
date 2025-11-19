import { test, expect } from '../fixtures/employer.fixture';

/**
 * Scenario: EMP-TS-005 – Profile management
 * Area: Employer Profile
 * Priority: P1
 * Tags: @regression
 */
test.describe('EMP-TS-005 Employer Profile management @regression', () => {
  /**
   * Helper: login as Employer and land on profile page
   */
  const loginAsEmployerAndGoToProfile = async (page: any) => {
    // ----------------------------
    // Open home page
    // ----------------------------
    await page.goto('http://localhost:5173/');

    // ----------------------------
    // Open login page from home
    // ----------------------------
    await page.getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Fill employer credentials
    // ----------------------------
    await page.getByRole('textbox', { name: 'Email' }).fill('hr1@company.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123');

    // ----------------------------
    // Submit login form
    // ----------------------------
    await page.locator('form').getByRole('button', { name: 'Login' }).click();

    // ----------------------------
    // Wait until profile page is loaded
    // ----------------------------
    await page.waitForLoadState('networkidle');

    // ----------------------------
    // Assert: Employer profile landing page is visible
    // ----------------------------
    await expect(
      page.getByRole('heading', { name: 'Company Profile & Verification' })
    ).toBeVisible();
  };

  /**
   * EMP-TS-005-TC01: Employer sees pre-filled profile data
   * Expected result:
   *   - Profile page visible after login
   *   - Required fields are visible and pre-filled from mock API
   */
  test('EMP-TS-005-TC01: view pre-filled employer profile', async ({ page }) => {
    // ----------------------------
    // Arrange: login and go to profile page
    // ----------------------------
    await loginAsEmployerAndGoToProfile(page);

    // ----------------------------
    // Locate main fields on company profile form
    // ----------------------------
    const companyNameInput = page.getByRole('textbox', {
      name: 'Company Name *',
    });
    const industryCombobox = page.getByRole('combobox', {
      name: 'Industry *',
    });
    const companySizeCombobox = page.getByRole('combobox', {
      name: 'Company Size *',
    });
    const websiteInput = page.getByRole('textbox', { name: 'Website' });
    const contactEmailInput = page.getByRole('textbox', {
      name: 'Contact Email *',
    });
    const phoneNumberInput = page.getByRole('textbox', {
      name: 'Phone Number *',
    });
    const addressInput = page.getByRole('textbox', {
      name: 'Address *',
    });

    // ----------------------------
    // Assert: fields are visible
    // ----------------------------
    await expect(companyNameInput).toBeVisible();
    await expect(industryCombobox).toBeVisible();
    await expect(companySizeCombobox).toBeVisible();
    await expect(websiteInput).toBeVisible();
    await expect(contactEmailInput).toBeVisible();
    await expect(phoneNumberInput).toBeVisible();
    await expect(addressInput).toBeVisible();

    // ----------------------------
    // Assert: pre-filled values from mocked profile (see employer.fixture.ts)
    // ----------------------------
    await expect(companyNameInput).toHaveValue('Test Company Ltd.');
    await expect(websiteInput).toHaveValue('http://testcompany.com');
    await expect(contactEmailInput).toHaveValue('hr1@company.com');
    await expect(phoneNumberInput).toHaveValue('+66-81-000-0000');
    await expect(addressInput).toHaveValue(
      '789 Business District, Bangkok, Thailand'
    );

    // ----------------------------
    // For dropdowns we just assert they are not empty
    // ----------------------------
    await expect(industryCombobox).not.toHaveText('');
    await expect(companySizeCombobox).not.toHaveText('');
  });

  /**
   * EMP-TS-005-TC02: Employer updates profile, saves, and data persists after reload
   * Expected result:
   *   - User can edit Company Name, Industry, Company Size
   *   - After clicking "Save Changes" and reloading the page,
   *     fields still show the updated values (coming from mocked backend)
   */
  test('EMP-TS-005-TC02: update employer profile and persist after reload', async ({
    page,
  }) => {
    // ----------------------------
    // Arrange: login and go to profile page
    // ----------------------------
    await loginAsEmployerAndGoToProfile(page);

    const companyNameInput = page.getByRole('textbox', {
      name: 'Company Name *',
    });
    const industryCombobox = page.getByRole('combobox', {
      name: 'Industry *',
    });
    const companySizeCombobox = page.getByRole('combobox', {
      name: 'Company Size *',
    });

    // ----------------------------
    // Act: change company name
    // ----------------------------
    await companyNameInput.click();
    await companyNameInput.fill('Test2 Company Ltd.');

    // ----------------------------
    // Act: change industry
    // ----------------------------
    await industryCombobox.click();
    await page.getByRole('option', { name: 'IT Services' }).click();

    // ----------------------------
    // Act: change company size
    // ----------------------------
    await companySizeCombobox.click();
    await page.getByRole('option', { name: '51-200' }).click();

    // ----------------------------
    // Submit profile form
    // ----------------------------
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // ----------------------------
    // Wait for mocked PATCH /api/profile to be processed
    // ----------------------------
    await page.waitForLoadState('networkidle');

    // ----------------------------
    // Reload page to verify data is coming from mocked backend state
    // ----------------------------
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ----------------------------
    // Re-locate fields after reload
    // ----------------------------
    const companyNameAfterReload = page.getByRole('textbox', {
      name: 'Company Name *',
    });
    const industryAfterReload = page.getByRole('combobox', {
      name: 'Industry *',
    });
    const companySizeAfterReload = page.getByRole('combobox', {
      name: 'Company Size *',
    });

    // ----------------------------
    // Assert: updated values are still present after reload
    // ----------------------------
    await expect(companyNameAfterReload).toHaveValue('Test2 Company Ltd.');
    await expect(industryAfterReload).toHaveText(/IT Services/);
    await expect(companySizeAfterReload).toHaveText(/51-200/);
  });
});
