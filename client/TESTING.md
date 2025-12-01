# Testing Setup with Playwright

This document describes the end-to-end testing setup for the NEGCES Lab Tracking System using Playwright.

## Quick Start

### Prerequisites
- Node.js 18 or higher
- MongoDB running locally or remotely
- Firebase project setup for authentication

### Installation
```bash
cd client
npm install
npx playwright install --with-deps
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests
npm run test:debug

# Generate test code
npm run test:codegen

# View test report
npm run test:report
```

### Running Specific Tests
```bash
# Run tests from specific file
npx playwright test auth/login.spec.ts

# Run tests matching pattern
npx playwright test --grep "should login"

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests for mobile
npx playwright test --project="Mobile Chrome"
```

## Project Structure

```
client/tests/
├── pages/              # Page Object Models
│   ├── LoginPage.ts
│   ├── ComputerGridPage.ts
│   └── BookingFormPage.ts
├── helpers/            # Test utilities and helpers
│   └── TestHelpers.ts
├── auth/               # Authentication tests
│   ├── login.spec.ts
│   ├── registration.spec.ts
│   └── forgot-password.spec.ts
├── computers/          # Computer browsing tests
│   ├── computer-grid.spec.ts
│   └── computer-details.spec.ts
├── booking/            # Booking system tests
│   ├── booking-form.spec.ts
│   └── booking-calendar.spec.ts
├── admin/              # Admin functionality tests
│   ├── admin-dashboard.spec.ts
│   └── booking-management.spec.ts
└── api/                # API integration tests
    ├── auth-api.spec.ts
    └── booking-api.spec.ts
```

## Configuration

### Environment Variables
Create a `.env` file in the client directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
PLAYWRIGHT_BASE_URL=http://localhost:5173
```

### Test Users
The tests require pre-configured test users in your Firebase project:
```typescript
const testUsers = {
  regularUser: {
    email: 'testuser@amrita.edu',
    password: 'TestUser123!',
    role: 'user'
  },
  adminUser: {
    email: 'admin@amrita.edu',
    password: 'AdminTest123!',
    role: 'admin'
  }
};
```

## Writing Tests

### Page Object Model Example
```typescript
// pages/ExamplePage.ts
import { Page, expect } from '@playwright/test';

export class ExamplePage {
  constructor(private page: Page) {}

  // Locators
  private get submitButton() {
    return this.page.locator('[data-testid="submit-button"]');
  }

  // Actions
  async goto() {
    await this.page.goto('/example');
  }

  async submit() {
    await this.submitButton.click();
  }

  // Assertions
  async expectToBeVisible() {
    await expect(this.submitButton).toBeVisible();
  }
}
```

### Test File Example
```typescript
// example.spec.ts
import { test, expect } from '@playwright/test';
import { ExamplePage } from '../pages/ExamplePage';
import { TestHelpers } from '../helpers/TestHelpers';

test.describe('Example Feature', () => {
  let examplePage: ExamplePage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    examplePage = new ExamplePage(page);
    helpers = new TestHelpers(page);
  });

  test('should work correctly', async () => {
    await examplePage.goto();
    await examplePage.expectToBeVisible();
    await examplePage.submit();
    // Add assertions
  });
});
```

## Testing Guidelines

### 1. Use Data Test IDs
Add `data-testid` attributes to key elements:
```tsx
<button data-testid="submit-button">Submit</button>
```

### 2. Follow Page Object Model
- Create page objects for each major page/component
- Keep locators and actions in page objects
- Keep assertions in page objects where possible

### 3. Use Helpers for Common Actions
```typescript
// Good
await helpers.loginAsUser();

// Instead of repeating login logic everywhere
```

### 4. Test Data Management
- Use factories for generating test data
- Clean up test data after tests
- Use unique identifiers to avoid conflicts

### 5. Error Handling
- Test both success and failure scenarios
- Test network errors and timeouts
- Test validation errors

## Debugging Tests

### Visual Debugging
```bash
# Run with browser visible
npm run test:headed

# Debug specific test
npx playwright test example.spec.ts --debug
```

### Screenshots and Videos
Tests automatically capture:
- Screenshots on failure
- Videos on failure
- Full traces on retry

### Playwright Inspector
```bash
# Open Playwright Inspector
npx playwright test --debug

# Record new test
npx playwright codegen http://localhost:5173
```

## CI/CD Integration

The project includes GitHub Actions workflow that:
1. Sets up test environment
2. Starts backend and frontend servers
3. Runs all Playwright tests
4. Uploads test results and reports

### Local CI Testing
```bash
# Run tests as they would run in CI
CI=true npm test
```

## Performance Testing

### Load Time Testing
```typescript
test('should load within 3 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000);
});
```

### Memory Testing
```typescript
test('should not have memory leaks', async ({ page }) => {
  await page.goto('/');
  const initialMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize);
  
  // Perform actions
  await page.click('button');
  
  // Force garbage collection if available
  await page.evaluate(() => window.gc && window.gc());
  
  const finalMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize);
  
  // Memory should not increase significantly
  expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

## Troubleshooting

### Common Issues

#### 1. Tests failing due to timing
```typescript
// Wait for element to be visible
await page.waitForSelector('[data-testid="element"]');

// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Wait for specific condition
await page.waitForFunction(() => 
  document.querySelectorAll('.item').length > 0
);
```

#### 2. Firebase authentication in tests
```typescript
// Mock Firebase auth for testing
await page.addInitScript(() => {
  window.mockFirebaseAuth = true;
});
```

#### 3. Database state issues
- Use separate test database
- Clean up test data after each test
- Use transactions for atomic operations

#### 4. Flaky tests
- Add proper waits
- Use retry logic where appropriate
- Check for race conditions

### Getting Help

1. Check the [Playwright Documentation](https://playwright.dev/)
2. Review existing tests for patterns
3. Use `npx playwright codegen` to record actions
4. Check browser console for errors during test runs

## Best Practices

1. **Keep tests independent** - Each test should be able to run in isolation
2. **Use meaningful test names** - Describe what the test is verifying
3. **Test user journeys** - Focus on real user workflows
4. **Keep tests maintainable** - Use page objects and helpers
5. **Test edge cases** - Error conditions, boundary values
6. **Performance matters** - Don't make tests slower than necessary
7. **Mobile first** - Test responsive design
8. **Accessibility** - Include accessibility checks where relevant

## Metrics and Reporting

### Test Coverage
- Track which features are tested
- Monitor test execution time
- Identify flaky tests

### Performance Baselines
- Page load times
- API response times
- Memory usage

### Reports
- HTML reports for detailed test results
- JSON reports for CI/CD integration
- JUnit XML for test management tools
