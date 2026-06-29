# E2E Test Suite

## Overview

This directory contains end-to-end tests for the Fund My Cause platform, powered by Playwright. All tests run across three browser engines: **Chromium**, **Firefox**, and **WebKit**.

## Test Files

- `navigation.spec.ts` - Basic navigation and landing page tests
- `campaign-creation.spec.ts` - Campaign creation wizard flow
- `campaigns.spec.ts` - Campaign listing and discovery
- `contribution-flow.spec.ts` - Full contribution journey (wallet connect → pledge → receipt)
- `refund-flow.spec.ts` - Refund request and processing
- `visual-regression.spec.ts` - Visual regression tests (Chromium only)

## Running Tests

### All browsers (default)
```bash
npm run test:e2e
```

### Specific browser
```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Interactive UI mode
```bash
npm run test:e2e:ui
```

### Debug mode
```bash
npm run test:e2e:debug
```

### Run all browsers with summary
```bash
# Windows
.\scripts\test-browsers.ps1

# Linux/Mac
./scripts/test-browsers.sh
```

## Cross-Browser Strategy

### Core Principle
All core user flows must pass on all three browsers. Browser-specific issues should be tracked and resolved.

### Browser Configurations

#### Chromium (Baseline)
- Used for visual regression tests
- Standard timeouts (15s action, 30s navigation)
- Represents Chrome, Edge, Brave users

#### Firefox
- Standard timeouts
- Visual regression tests disabled
- Represents Firefox users

#### WebKit
- Extended timeouts (20s action, 40s navigation)
- Visual regression tests disabled
- Represents Safari users (macOS/iOS)

### Visual Regression Tests
- Run **only on Chromium** to maintain consistent baselines
- Other browsers skip these tests to avoid false positives from rendering differences

## CI/CD Integration

On every PR, the GitHub Actions workflow:
1. Runs tests in parallel across all three browsers
2. Each browser runs in its own job with isolated artifacts
3. Generates browser-specific test reports
4. Uploads failure artifacts (videos, traces, screenshots)

See `.github/workflows/playwright.yml` for details.

## Writing Cross-Browser Tests

### Best Practices

1. **Use semantic selectors** (role, label, text) over CSS selectors
   ```typescript
   // Good
   await page.getByRole('button', { name: /pledge/i });
   
   // Avoid
   await page.click('.btn-primary');
   ```

2. **Avoid hard-coded waits** - use Playwright's auto-waiting
   ```typescript
   // Good
   await expect(page.locator('h1')).toBeVisible();
   
   // Avoid
   await page.waitForTimeout(1000);
   ```

3. **Handle browser differences** when necessary
   ```typescript
   test('example', async ({ page, browserName }) => {
     if (browserName === 'webkit') {
       // WebKit-specific logic
     }
   });
   ```

4. **Test accessibility** - use ARIA roles and labels
   ```typescript
   await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow');
   ```

### Common Cross-Browser Issues

- **Timing**: WebKit may need longer timeouts for heavy operations
- **Clipboard**: Different browsers have different clipboard API behaviors
- **Date inputs**: Native date pickers render differently
- **Animations**: CSS animations may have subtle timing differences
- **Extensions**: Wallet mocking may behave differently per browser

## Debugging Failures

### 1. Run locally with headed browser
```bash
npx playwright test --project=webkit --headed
```

### 2. Use debug mode
```bash
npx playwright test --project=firefox --debug e2e/contribution-flow.spec.ts
```

### 3. Check CI artifacts
- Go to GitHub Actions → Failed workflow
- Download browser-specific artifacts
- Review videos, screenshots, and traces

### 4. Use Playwright trace viewer
```bash
npx playwright show-trace trace.zip
```

## Fixtures

Custom fixtures are located in `./fixtures/`:
- `wallet.ts` - Mocks Freighter wallet for testing contributions

## Snapshots

Visual regression snapshots are stored in `./snapshots/`:
- Only Chromium snapshots are version-controlled
- Update with: `npx playwright test --update-snapshots --project=chromium`

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Cross-Browser Testing Guide](../CROSS_BROWSER_TESTING.md)
- [Best Practices](https://playwright.dev/docs/best-practices)
