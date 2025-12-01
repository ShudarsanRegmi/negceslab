# Simple Testing Setup

## Overview
This is a minimal Playwright testing setup that just checks if your static pages load without errors. No complex interactions, animations, or cross-browser testing.

## What it tests:
✅ **Page Loading**: Checks if pages load successfully (no 404/500 errors)  
✅ **Basic Navigation**: Verifies URLs are correct  
✅ **No Critical Errors**: Ensures no major console errors  
✅ **Page Titles**: Basic page title validation  

## Quick Commands

```bash
# Run the basic tests (default)
npm test

# Same as above, explicit
npm run test:static

# Run tests with browser visible (good for debugging)
npm run test:static:headed

# Interactive debugging
npm run test:debug

# View test report
npm run test:report
```

## What Pages Are Tested:
- `/` (Home)
- `/rules`
- `/achievements`
- `/team`
- `/contact`
- `/computers`
- `/lab-overview`

## Adding New Pages
To test a new page, just add it to the `static-pages.spec.ts` file:

```typescript
test('should load my-new-page without errors', async ({ page }) => {
  await page.goto('/my-new-page');
  
  expect(page.url()).toContain('/my-new-page');
  await expect(page).not.toHaveTitle(/404|Error|Not Found/i);
  
  await page.waitForTimeout(1000);
});
```

## Files:
- `tests/static-pages.spec.ts` - The test file
- `playwright-simple.config.ts` - Simple configuration
- This approach ignores complex tests in `tests/` folder

## Notes:
- Tests run only in Chrome (fastest)
- Uses timeouts instead of complex waiting
- Automatically starts dev server before testing
- Ignores most console errors (favicon, extensions, etc.)
- No authentication testing - only public pages
