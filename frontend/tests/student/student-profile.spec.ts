import path from 'path';
import { test, expect } from '../fixtures/student.fixture';

/**
 * Scenario: STU-TS-005 – Student profile management
 * Priority: P1
 * Tags: @regression
 */
test.describe('STU-TS-005 Student Profile management @regression', () => {
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

  test(
    'STU-TS-005-TC01: student updates profile information and uploads resume',
    async ({ page }) => {
      await loginAsStudent(page);

      // ----------------------------
      // Navigate directly to the profile page to avoid mobile nav issues
      // ----------------------------
      await page.goto('http://localhost:5173/student/profile/student-1', {
        waitUntil: 'networkidle',
      });
      await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();

      const firstNameInput = page.getByRole('textbox', { name: 'First Name *' });
      const lastNameInput = page.getByRole('textbox', { name: 'Last Name *' });
      const phoneInput = page.getByRole('textbox', { name: /Phone Number/ });
      const addressInput = page.getByRole('textbox', { name: /^Address/ });

      // ----------------------------
      // Assert existing data from fixture
      // ----------------------------
      await expect(firstNameInput).toHaveValue('Thanakorn');
      await expect(lastNameInput).toHaveValue('Ratanaporn');
      await expect(phoneInput).toHaveValue('+66812345678');
      await expect(addressInput).toHaveValue('Ram Inthra Road, Bangkok 10230');

      // ----------------------------
      // Enable edit mode and update key fields
      // ----------------------------
      await page.getByRole('button', { name: 'Edit profile' }).click();
      await firstNameInput.fill('Thanakarn');
      await lastNameInput.fill('Ratanapoom');
      await phoneInput.fill('+6612345555');
      await page.getByRole('textbox', { name: /Graduation Year/ }).fill('2028');
      await page.getByRole('spinbutton', { name: 'GPA' }).fill('3.50');
      await page.getByRole('combobox', { name: 'Degree Type' }).click();
      await page.getByRole('option', { name: 'Master' }).click();

      const updateResponsePromise = page.waitForResponse(
        (res) => res.request().method() === 'PATCH' && res.url().includes('/profile')
      );

      await page.getByRole('button', { name: 'Save' }).click();
      const updateResponse = await updateResponsePromise;
      expect(updateResponse.ok()).toBeTruthy();
      await expect(page.getByText('Profile Updated')).toBeVisible();

      // ----------------------------
      // Values should persist in read-only mode
      // ----------------------------
      await expect(firstNameInput).toHaveValue('Thanakarn');
      await expect(lastNameInput).toHaveValue('Ratanapoom');
      await expect(phoneInput).toHaveValue('+6612345555');

      // ----------------------------
      // Reload to ensure persistence coming from mocked API
      // ----------------------------
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(firstNameInput).toHaveValue('Thanakarn');
      await expect(lastNameInput).toHaveValue('Ratanapoom');
      await expect(phoneInput).toHaveValue('+6612345555');
      await page.getByRole('button', { name: 'Edit profile' }).click();
      await expect(page.getByRole('textbox', { name: /Graduation Year/ })).toHaveValue('2028');
      await expect(page.getByRole('spinbutton', { name: 'GPA' })).toHaveValue('3.5');
      await expect(page.getByRole('combobox', { name: 'Degree Type' })).toHaveText(/Master/);

      // ----------------------------
      // Upload resume using hidden file input
      // ----------------------------
      await page.getByRole('button', { name: 'Cancel' }).click();
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.getByRole('button', { name: 'Upload resume' }).click(),
      ]);
      await fileChooser.setFiles(resumeFilePath);
      await expect(page.getByText('Resume uploaded successfully.')).toBeVisible();

      // ----------------------------
      // After upload the section should show replace button instead of empty state
      // ----------------------------
      await expect(page.getByRole('button', { name: 'Replace' })).toBeVisible();
    }
  );
});
