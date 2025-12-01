import { test, expect } from '@playwright/test';
import { BookingFormPage } from '../pages/BookingFormPage';
import { TestHelpers, TEST_USERS } from '../helpers/TestHelpers';

test.describe('Booking System', () => {
  let bookingForm: BookingFormPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    bookingForm = new BookingFormPage(page);
    helpers = new TestHelpers(page);
    
    // Login as regular user for booking tests
    await helpers.loginAsUser();
  });

  test.describe('Basic Booking Flow', () => {
    test('should display booking form correctly', async () => {
      await bookingForm.goto();
      await bookingForm.expectToBeVisible();
    });

    test('should create a basic booking successfully', async () => {
      const bookingData = helpers.generateBookingData('Computer-01');
      
      await bookingForm.goto();
      await bookingForm.fillBasicBookingForm(bookingData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectBookingSubmitted();
      await helpers.expectNotificationToast('Booking request submitted successfully');
    });

    test('should validate required fields', async ({ page }) => {
      await bookingForm.goto();
      await bookingForm.submitBooking();
      
      // Should show validation errors for required fields
      await bookingForm.expectFormValidationError('reason');
      await expect(page.locator('text=Computer is required')).toBeVisible();
    });

    test('should validate date range', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const bookingData = {
        ...helpers.generateBookingData(),
        startDate: yesterday.toISOString().split('T')[0]
      };
      
      await bookingForm.goto();
      await bookingForm.fillBasicBookingForm(bookingData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectErrorMessage('Start date cannot be in the past');
    });

    test('should validate time range', async () => {
      const bookingData = {
        ...helpers.generateBookingData(),
        startTime: '17:00',
        endTime: '09:00'
      };
      
      await bookingForm.goto();
      await bookingForm.fillBasicBookingForm(bookingData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectErrorMessage('End time must be after start time');
    });

    test('should validate business hours', async () => {
      const bookingData = {
        ...helpers.generateBookingData(),
        startTime: '06:00',
        endTime: '08:00'
      };
      
      await bookingForm.goto();
      await bookingForm.fillBasicBookingForm(bookingData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectErrorMessage('Booking must be within lab hours');
    });
  });

  test.describe('Advanced Booking Features', () => {
    test('should handle GPU requirements correctly', async () => {
      await bookingForm.goto();
      
      // Initially GPU fields should be hidden
      await bookingForm.expectGPUFieldsHidden();
      
      // Enable GPU requirement
      await bookingForm.enableGPURequirement();
      await bookingForm.expectGPUFieldsVisible();
      
      // Fill advanced form with GPU requirements
      const advancedData = helpers.generateAdvancedBookingData();
      await bookingForm.fillAdvancedBookingForm(advancedData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectBookingSubmitted();
    });

    test('should validate GPU memory requirement', async () => {
      await bookingForm.goto();
      await bookingForm.enableGPURequirement();
      await bookingForm.setGPUMemory('invalid');
      
      const basicData = helpers.generateBookingData();
      await bookingForm.fillBasicBookingForm(basicData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectErrorMessage('GPU memory must be a valid number');
    });

    test('should handle dataset information', async () => {
      const advancedData = helpers.generateAdvancedBookingData();
      
      await bookingForm.goto();
      await bookingForm.fillAdvancedBookingForm(advancedData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectBookingSubmitted();
    });

    test('should validate dataset link format', async () => {
      await bookingForm.goto();
      await bookingForm.setDatasetLink('invalid-url');
      
      const basicData = helpers.generateBookingData();
      await bookingForm.fillBasicBookingForm(basicData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectErrorMessage('Please enter a valid URL');
    });
  });

  test.describe('Booking Conflicts', () => {
    test('should detect overlapping bookings', async ({ page }) => {
      // Mock API response for conflict
      await page.route('**/api/bookings', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 400,
            json: { 
              message: 'Computer is not available for the selected time period',
              conflictingBookings: [{
                startDate: '2024-01-15',
                endDate: '2024-01-16',
                startTime: '10:00',
                endTime: '16:00'
              }]
            }
          });
        }
      });
      
      const bookingData = helpers.generateBookingData();
      await bookingForm.goto();
      await bookingForm.fillBasicBookingForm(bookingData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectErrorMessage('Computer is not available');
    });

    test('should suggest alternative time slots', async ({ page }) => {
      // This test would require the backend to return suggestions
      const bookingData = helpers.generateBookingData();
      
      await bookingForm.goto();
      await bookingForm.fillBasicBookingForm(bookingData);
      
      // Simulate conflict and suggestion response
      await page.route('**/api/bookings/check-availability', route => {
        route.fulfill({
          json: {
            available: false,
            suggestions: [
              { startTime: '18:00', endTime: '20:00' },
              { startTime: '08:00', endTime: '10:00' }
            ]
          }
        });
      });
      
      await bookingForm.submitBooking();
      
      // Should show alternative suggestions
      await expect(page.locator('text=Alternative time slots')).toBeVisible();
    });
  });

  test.describe('Mobile Booking Experience', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      await helpers.setMobileViewport();
      await bookingForm.goto();
      
      // Form should be responsive
      await bookingForm.expectToBeVisible();
      
      // Should be able to complete booking on mobile
      const bookingData = helpers.generateBookingData();
      await bookingForm.fillBasicBookingForm(bookingData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectBookingSubmitted();
    });

    test('should have proper touch interactions on mobile', async ({ page }) => {
      await helpers.setMobileViewport();
      await bookingForm.goto();
      
      // Date pickers should work with touch
      await bookingForm.setStartDate('2024-12-15');
      
      // Time pickers should work with touch
      await bookingForm.setStartTime('10:00');
      
      // Dropdowns should work with touch
      await bookingForm.selectComputer('Computer-01');
      
      // Form should still be functional
      await bookingForm.expectToBeVisible();
    });
  });

  test.describe('Form Persistence', () => {
    test('should save form data when navigating away', async ({ page }) => {
      await bookingForm.goto();
      
      // Fill partial form
      await bookingForm.selectComputer('Computer-01');
      await bookingForm.setReason('Test booking reason');
      
      // Navigate away
      await page.goto('/computers');
      
      // Return to form
      await bookingForm.goto();
      
      // Data should be preserved (if implemented)
      // This would depend on local storage implementation
      await expect(page.locator('textarea[name="reason"]')).toHaveValue('Test booking reason');
    });

    test('should clear form data after successful submission', async ({ page }) => {
      const bookingData = helpers.generateBookingData();
      
      await bookingForm.goto();
      await bookingForm.fillBasicBookingForm(bookingData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectBookingSubmitted();
      
      // Return to form - should be empty
      await bookingForm.goto();
      const reasonInput = page.locator('textarea[name="reason"]');
      await expect(reasonInput).toHaveValue('');
    });
  });

  test.describe('Error Recovery', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.route('**/api/bookings', route => route.abort());
      
      const bookingData = helpers.generateBookingData();
      await bookingForm.goto();
      await bookingForm.fillBasicBookingForm(bookingData);
      await bookingForm.submitBooking();
      
      await bookingForm.expectErrorMessage('Network error. Please try again.');
    });

    test('should retry failed submissions', async ({ page }) => {
      let attemptCount = 0;
      await page.route('**/api/bookings', route => {
        attemptCount++;
        if (attemptCount === 1) {
          route.abort();
        } else {
          route.fulfill({
            status: 201,
            json: { message: 'Booking created successfully' }
          });
        }
      });
      
      const bookingData = helpers.generateBookingData();
      await bookingForm.goto();
      await bookingForm.fillBasicBookingForm(bookingData);
      await bookingForm.submitBooking();
      
      // Should eventually succeed after retry
      await bookingForm.expectBookingSubmitted();
    });
  });
});
