import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TestHelpers, TEST_USERS } from '../helpers/TestHelpers';

test.describe('Authentication - Login Flow', () => {
  let loginPage: LoginPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    helpers = new TestHelpers(page);
    await loginPage.goto();
  });

  test('should display login form correctly', async () => {
    await loginPage.expectToBeVisible();
  });

  test('should login successfully with valid credentials', async () => {
    await loginPage.login(TEST_USERS.regularUser.email, TEST_USERS.regularUser.password);
    await loginPage.expectLoginSuccessful();
    await helpers.expectToBeLoggedIn();
  });

  test('should show error for invalid email format', async () => {
    await loginPage.login('invalid-email', 'password123');
    await loginPage.expectErrorMessage('Enter a valid email');
  });

  test('should show error for incorrect credentials', async () => {
    await loginPage.login('nonexistent@amrita.edu', 'wrongpassword');
    await loginPage.expectErrorMessage('auth/user-not-found');
  });

  test('should show error for empty fields', async ({ page }) => {
    await loginPage.login('', '');
    
    // Check for form validation
    await expect(page.locator('input[type="email"]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('input[type="password"]')).toHaveAttribute('aria-invalid', 'true');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.clickForgotPassword();
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should navigate to registration page', async ({ page }) => {
    await loginPage.clickSignUp();
    await expect(page).toHaveURL('/register');
  });

  test('should handle social login flow', async ({ page }) => {
    // Note: In real tests, you might mock Firebase auth
    await loginPage.clickGoogleLogin();
    
    // Should show social login warning dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Email Domain Requirement')).toBeVisible();
  });

  test('should remember login state after page refresh', async ({ page }) => {
    await loginPage.login(TEST_USERS.regularUser.email, TEST_USERS.regularUser.password);
    await loginPage.expectLoginSuccessful();
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await helpers.expectToBeLoggedIn();
  });

  test('should work on mobile viewport', async ({ page }) => {
    await helpers.setMobileViewport();
    await loginPage.goto();
    await loginPage.expectToBeVisible();
    
    // Login should work on mobile
    await loginPage.login(TEST_USERS.regularUser.email, TEST_USERS.regularUser.password);
    await loginPage.expectLoginSuccessful();
  });
});
