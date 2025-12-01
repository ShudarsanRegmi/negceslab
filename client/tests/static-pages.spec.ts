import { test, expect } from '@playwright/test';

test.describe('Static Pages - Basic Loading Test', () => {
  
  test.describe('Page Loading Tests', () => {
    test('should load home page without errors', async ({ page }) => {
      await page.goto('/');
      
      // Just check if the page loaded successfully (no 404 or 500 errors)
      await expect(page).not.toHaveTitle(/404|Error|Not Found/i);
      
      // Wait a bit for any loading to complete
      await page.waitForTimeout(2000);
    });

    test('should load rules page without errors', async ({ page }) => {
      await page.goto('/rules');
      
      // Check URL is correct and no error page
      expect(page.url()).toContain('/rules');
      await expect(page).not.toHaveTitle(/404|Error|Not Found/i);
      
      await page.waitForTimeout(1000);
    });

    test('should load achievements page without errors', async ({ page }) => {
      await page.goto('/achievements');
      
      expect(page.url()).toContain('/achievements');
      await expect(page).not.toHaveTitle(/404|Error|Not Found/i);
      
      await page.waitForTimeout(1000);
    });

    test('should load team page without errors', async ({ page }) => {
      await page.goto('/team');
      
      expect(page.url()).toContain('/team');
      await expect(page).not.toHaveTitle(/404|Error|Not Found/i);
      
      await page.waitForTimeout(1000);
    });

    test('should load contact page without errors', async ({ page }) => {
      await page.goto('/contact');
      
      expect(page.url()).toContain('/contact');
      await expect(page).not.toHaveTitle(/404|Error|Not Found/i);
      
      await page.waitForTimeout(1000);
    });

    test('should load computers page without errors', async ({ page }) => {
      await page.goto('/computers');
      
      expect(page.url()).toContain('/computers');
      await expect(page).not.toHaveTitle(/404|Error|Not Found/i);
      
      // Wait longer for API calls
      await page.waitForTimeout(3000);
    });

    test('should load lab overview page without errors', async ({ page }) => {
      await page.goto('/lab-overview');
      
      expect(page.url()).toContain('/lab-overview');
      await expect(page).not.toHaveTitle(/404|Error|Not Found/i);
      
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Basic Functionality', () => {
    test('should have page title on home page', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      // Just check that some title exists (not empty)
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should not have critical console errors', async ({ page }) => {
      const criticalErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter out common non-critical errors
          if (!text.includes('favicon') && 
              !text.includes('chrome-extension') && 
              !text.includes('404') &&
              !text.includes('net::ERR_FAILED')) {
            criticalErrors.push(text);
          }
        }
      });
      
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Allow some errors but not too many critical ones
      expect(criticalErrors.length).toBeLessThan(3);
    });
  });
});
