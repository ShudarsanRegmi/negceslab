import { test, expect } from '@playwright/test';
import { ComputerGridPage } from '../pages/ComputerGridPage';
import { TestHelpers, TEST_USERS } from '../helpers/TestHelpers';

test.describe('Computer Grid and Browsing', () => {
  let computerGrid: ComputerGridPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    computerGrid = new ComputerGridPage(page);
    helpers = new TestHelpers(page);
  });

  test.describe('Public Access (No Login Required)', () => {
    test('should display computers without authentication', async () => {
      await computerGrid.goto();
      await computerGrid.expectComputersToBeVisible();
    });

    test('should allow searching computers', async () => {
      await computerGrid.goto();
      await computerGrid.searchComputers('Computer-01');
      await computerGrid.expectSearchResults('Computer-01');
    });

    test('should allow filtering by status', async () => {
      await computerGrid.goto();
      await computerGrid.filterByStatus('available');
      await computerGrid.expectFilteredResults('Available');
    });

    test('should switch between grid and list view', async ({ page }) => {
      await computerGrid.goto();
      
      // Switch to list view
      await computerGrid.switchToListView();
      await expect(page.locator('[data-testid="computer-list"]')).toBeVisible();
      
      // Switch back to grid view
      await computerGrid.switchToGridView();
      await expect(page.locator('[data-testid="computer-grid"]')).toBeVisible();
    });

    test('should show computer details when clicked', async () => {
      await computerGrid.goto();
      await computerGrid.clickComputer('Computer-01');
      await computerGrid.expectBookingDialogToBeOpen();
    });
  });

  test.describe('Authenticated User Access', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.loginAsUser();
      await computerGrid.goto();
    });

    test('should show booking options for authenticated users', async ({ page }) => {
      await computerGrid.expectComputersToBeVisible();
      
      // Book button should be visible for available computers
      await expect(
        page.locator('[data-testid="computer-card"]:has([data-testid="status-chip"]:has-text("Available")) button:has-text("Book")')
      ).toBeVisible();
    });

    test('should open booking form when clicking book button', async () => {
      await computerGrid.clickBookComputer('Computer-01');
      await computerGrid.expectBookingDialogToBeOpen();
    });

    test('should open calendar view when clicking calendar button', async () => {
      await computerGrid.clickCalendarView('Computer-01');
      await computerGrid.expectCalendarDialogToBeOpen();
    });

    test('should display user-specific booking information', async ({ page }) => {
      // Should show user's own bookings highlighted
      await expect(page.locator('[data-testid="my-booking-indicator"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      await helpers.setMobileViewport();
      await computerGrid.goto();
      
      // Should automatically switch to list view on mobile
      await computerGrid.expectComputersToBeVisible();
      
      // Mobile-specific interactions should work
      await computerGrid.searchComputers('Computer-01');
      await computerGrid.expectSearchResults('Computer-01');
    });

    test('should work correctly on tablet devices', async ({ page }) => {
      await helpers.setTabletViewport();
      await computerGrid.goto();
      await computerGrid.expectComputersToBeVisible();
      
      // Should maintain grid view on tablet
      await expect(page.locator('[data-testid="computer-grid"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/computers**', route => route.abort());
      
      await computerGrid.goto();
      
      // Should show error message
      await expect(page.locator('[role="alert"]')).toContainText('Failed to load computers');
    });

    test('should handle empty computer list', async ({ page }) => {
      // Mock empty response
      await page.route('**/api/computers**', route => 
        route.fulfill({ json: { data: [] } })
      );
      
      await computerGrid.goto();
      
      // Should show no computers message
      await expect(page.locator('text=No computers found')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load computers within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await computerGrid.goto();
      await computerGrid.expectComputersToBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle large number of computers efficiently', async ({ page }) => {
      // Mock response with many computers
      const manyComputers = Array.from({ length: 50 }, (_, i) => ({
        _id: `computer-${i}`,
        name: `Computer-${String(i + 1).padStart(2, '0')}`,
        location: `Lab ${Math.floor(i / 10) + 1}`,
        status: 'available',
        specifications: 'Test specs',
        bookings: []
      }));
      
      await page.route('**/api/computers**', route => 
        route.fulfill({ json: { data: manyComputers } })
      );
      
      await computerGrid.goto();
      await computerGrid.expectComputersToBeVisible();
      
      // Search should still be responsive
      await computerGrid.searchComputers('Computer-05');
      await computerGrid.expectSearchResults('Computer-05');
    });
  });
});
