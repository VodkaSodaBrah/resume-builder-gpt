import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /* Default test directory */
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: false, // Serial for conversation tests
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1, // Serial execution for conversation state
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testDir: './e2e',
    },
    {
      name: 'parameterized',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/e2e/parameterized/specs',
      testMatch: '**/*.spec.ts',
    },
    {
      name: 'critical-paths',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/e2e/parameterized/specs',
      testMatch: '**/*.spec.ts',
      grep: /Critical Boundary Paths/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
