import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToLogin() {
    await this.page.goto('/login');
  }

  async navigateToRegister() {
    await this.page.goto('/register');
  }

  async navigateToComputers() {
    await this.page.goto('/computers');
  }

  async navigateToDashboard() {
    await this.page.goto('/dashboard');
  }

  async navigateToAdmin() {
    await this.page.goto('/admin');
  }

  // Authentication helpers
  async loginAsUser(email: string = 'testuser@amrita.edu', password: string = 'TestUser123!') {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await this.page.waitForURL(/\/(dashboard|$)/);
  }

  async loginAsAdmin(email: string = 'admin@amrita.edu', password: string = 'AdminTest123!') {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await this.page.waitForURL(/\/(dashboard|admin|$)/);
  }

  async logout() {
    // Click user menu
    await this.page.click('[data-testid="user-menu-button"]');
    // Click logout
    await this.page.click('button:has-text("Logout")');
    // Wait for navigation to login or home
    await this.page.waitForURL(/\/(login|$)/);
  }

  // Waiting helpers
  async waitForLoadingToComplete() {
    // Wait for any loading indicators to disappear
    await this.page.waitForSelector('.MuiCircularProgress-root', { state: 'detached', timeout: 10000 });
  }

  async waitForApiCall(url: string) {
    await this.page.waitForResponse(response => 
      response.url().includes(url) && response.status() === 200
    );
  }

  async waitForFormSubmission() {
    // Wait for form submission to complete
    await this.page.waitForSelector('button[type="submit"][disabled]', { timeout: 5000 });
    await this.page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 10000 });
  }

  // Screenshot helpers
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  async takeElementScreenshot(selector: string, name: string) {
    await this.page.locator(selector).screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  // Data generation helpers
  generateRandomEmail(): string {
    const timestamp = Date.now();
    return `test${timestamp}@amrita.edu`;
  }

  generateRandomComputerName(): string {
    const timestamp = Date.now();
    return `Test-Computer-${timestamp}`;
  }

  generateBookingData(computerName?: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    return {
      computer: computerName || 'Computer-01',
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: dayAfter.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      reason: 'Automated test booking for machine learning project'
    };
  }

  generateAdvancedBookingData(computerName?: string) {
    return {
      ...this.generateBookingData(computerName),
      requiresGPU: true,
      gpuMemory: '8',
      problemStatement: 'Training deep learning models for computer vision tasks',
      datasetType: 'Image',
      datasetSize: '50',
      datasetUnit: 'GB',
      datasetLink: 'https://example.com/dataset',
      mentor: 'Dr. Test Professor'
    };
  }

  // Assertion helpers
  async expectToBeLoggedIn() {
    await expect(this.page.locator('[data-testid="user-menu-button"]')).toBeVisible();
  }

  async expectToBeLoggedOut() {
    await expect(this.page.locator('[href="/login"]')).toBeVisible();
  }

  async expectNotificationToast(message: string) {
    await expect(this.page.locator('.MuiSnackbar-root')).toContainText(message);
  }

  async expectPageTitle(title: string) {
    await expect(this.page).toHaveTitle(new RegExp(title, 'i'));
  }

  async expectUrl(pattern: string | RegExp) {
    await expect(this.page).toHaveURL(pattern);
  }

  // Mobile helpers
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 812 });
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }

  // Theme helpers
  async switchToLightTheme() {
    await this.page.click('[data-testid="theme-toggle"]');
    // Add logic to ensure light theme is selected
  }

  async switchToDarkTheme() {
    await this.page.click('[data-testid="theme-toggle"]');
    // Add logic to ensure dark theme is selected
  }

  // Error handling helpers
  async dismissAlert() {
    await this.page.locator('.MuiAlert-standardError .MuiAlert-action button').click();
  }

  async expectNoConsoleErrors() {
    const errors: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any potential errors
    await this.page.waitForTimeout(1000);
    
    expect(errors).toHaveLength(0);
  }

  // Local storage helpers
  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  async setLocalStorageItem(key: string, value: string) {
    await this.page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      { key, value }
    );
  }

  async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate(
      (key) => localStorage.getItem(key),
      key
    );
  }
}

// Test data constants
export const TEST_USERS = {
  regularUser: {
    email: 'testuser@amrita.edu',
    password: 'TestUser123!',
    name: 'Test User'
  },
  adminUser: {
    email: 'admin@amrita.edu',
    password: 'AdminTest123!',
    name: 'Admin User'
  },
  unverifiedUser: {
    email: 'unverified@amrita.edu',
    password: 'Unverified123!',
    name: 'Unverified User'
  }
};

export const TEST_COMPUTERS = {
  available: {
    name: 'Computer-01',
    status: 'available'
  },
  maintenance: {
    name: 'Computer-02',
    status: 'maintenance'
  },
  booked: {
    name: 'Computer-03',
    status: 'booked'
  }
};
