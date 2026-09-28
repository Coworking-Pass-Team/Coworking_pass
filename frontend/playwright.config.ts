import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for Coworking Pass platform.
 * Runs tests against the locally running frontend (port 3000).
 * Screenshots are saved to testing/screenshots/ for review.
 */
export default defineConfig({
  testDir: './tests',

  // Run tests sequentially — our SPA has shared auth state
  fullyParallel: false,

  // Retry once on flaky tests
  retries: 1,

  // Use 1 worker to avoid auth conflicts
  workers: 1,

  // HTML report + list reporter for terminal output
  reporter: [
    ['html', { outputFolder: '../testing/playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    // All tests point to local frontend
    baseURL: 'http://localhost:3000',

    // Keep browser open briefly so you can see what's happening
    actionTimeout: 10_000,
    navigationTimeout: 15_000,

    // Record video + screenshot on failure for debugging
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  // Only test on Chromium for speed — add Firefox/WebKit when needed
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    // Uncomment to also test on Firefox and WebKit:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  // Auto-create screenshots directory
  outputDir: '../testing/screenshots/failed',
});
