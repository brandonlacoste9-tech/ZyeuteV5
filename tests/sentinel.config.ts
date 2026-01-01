import { defineConfig, devices } from "@playwright/test";

/**
 * SENTINEL CONFIGURATION v5.0
 * Optimized for high-fidelity verification of the Zyeuté platform.
 */
export default defineConfig({
  testDir: "../tests",
  testMatch: "sentinel.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  reporter: [["html", { open: "never" }], ["./helpers/sentinel-reporter.ts"]],
  use: {
    baseURL: "http://localhost:5000",
    trace: "retain-on-failure",
    screenshot: "on",
    video: "off",
    viewport: { width: 1280, height: 800 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "Sentinel-Baseline",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
