import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for running against deployed app (no local server).
 * Use when PostgreSQL/Redis are not running locally.
 *
 * Run: npx playwright test --config=playwright.config.external.ts
 */
export default defineConfig({
  testDir: "./tests",

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://zyeute-v5.vercel.app",

    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* No webServer - tests run against deployed URL */
  timeout: 30000,
});
