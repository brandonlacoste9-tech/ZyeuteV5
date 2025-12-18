import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Vital Signs E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './tests',

    /* Run tests in files in parallel */
    fullyParallel: false, // Disable to avoid race conditions

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Single worker for predictable test order */
    workers: 1,

    /* Reporter to use */
    reporter: [
        ['html', { open: 'never' }],
        ['list']
    ],

    /* Shared settings for all the projects below */
    use: {
        /* Base URL to use in actions like `await page.goto('/')` */
        baseURL: 'http://localhost:5000',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video recording for failed tests */
        video: 'retain-on-failure',

        /* Timeout for each action (click, fill, etc.) */
        actionTimeout: 10000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Run your local dev server before starting the tests */
    // Disabled - we expect dev server to already be running
    // webServer: {
    //   command: 'npm run dev',
    //   url: 'http://localhost:5000',
    //   reuseExistingServer: !process.env.CI,
    // },

    /* Timeout for each test */
    timeout: 30000,
});
