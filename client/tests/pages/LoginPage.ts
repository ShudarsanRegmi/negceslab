import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  // Locators
  private get emailInput() {
    return this.page.locator('input[type="email"]');
  }

  private get passwordInput() {
    return this.page.locator('input[type="password"]');
  }

  private get loginButton() {
    return this.page.locator('button[type="submit"]').first();
  }

  private get googleLoginButton() {
    return this.page.locator('button:has-text("Continue with Google")');
  }

  private get microsoftLoginButton() {
    return this.page.locator('button:has-text("Continue with Microsoft")');
  }

  private get forgotPasswordLink() {
    return this.page.locator('a[href="/forgot-password"]');
  }

  private get signUpLink() {
    return this.page.locator('a[href="/register"]');
  }

  private get errorMessage() {
    return this.page.locator('[role="alert"]');
  }

  // Actions
  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async clickGoogleLogin() {
    await this.googleLoginButton.click();
  }

  async clickMicrosoftLogin() {
    await this.microsoftLoginButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async clickSignUp() {
    await this.signUpLink.click();
  }

  // Assertions
  async expectToBeVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoginSuccessful() {
    // Should redirect to dashboard or home
    await expect(this.page).toHaveURL(/\/(dashboard|$)/);
  }
}
