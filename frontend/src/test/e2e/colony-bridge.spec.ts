import { test, expect } from "@playwright/test";

/**
 * Colony Bridge Integration Test
 *
 * This test validates the full end-to-end flow:
 * 1. React App → ColonyClient → Supabase (colony_tasks table)
 * 2. Python task_poller.py → Polls Supabase every 2s
 * 3. Python task_poller.py → Processes task, updates status to 'completed'
 * 4. React App → Receives completion notification
 *
 * Prerequisites:
 * - Frontend dev server running (npm run dev)
 * - Python task_poller.py running in infrastructure/colony
 * - Supabase connection configured
 */

test.describe("Colony Bridge Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Use Guest Mode for fastest test execution
    // Guest mode bypasses Supabase authentication while still allowing protected routes
    const guestButton = page.getByRole("button", {
      name: /Mode Invité|Guest Mode/i,
    });

    if (await guestButton.isVisible()) {
      await guestButton.click();
      await page.waitForURL("/");
    } else {
      // Fallback: If no guest mode button, skip to home (assumes already logged in)
      await page.goto("/");
    }

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");
  });

  test("should complete full bridge cycle: React → Supabase → Python → React", async ({
    page,
  }) => {
    // Step 1: Verify the SwarmDebug button is visible
    const swarmButton = page.getByRole("button", { name: /Test Swarm/i });
    await expect(swarmButton).toBeVisible({ timeout: 5000 });

    console.log("✅ SwarmDebug button found");

    // Step 2: Click the button to submit a task
    await swarmButton.click();

    console.log("✅ Button clicked - Task submitted to Supabase");

    // Step 3: Verify the "Task submitted" toast appears
    // This confirms the frontend → Supabase write succeeded
    const submittedToast = page.getByText(/Task submitted/i);
    await expect(submittedToast).toBeVisible({ timeout: 3000 });

    console.log("✅ Task submission confirmed");

    // Step 4: Wait for the "Task completed" toast
    // This is THE critical test - it proves:
    // - Python task_poller.py is running
    // - It detected the task in Supabase
    // - It processed the task
    // - It updated the status to 'completed'
    // - The React app received the update (via Realtime or polling)
    const completedToast = page.getByText(/Task completed/i);
    await expect(completedToast).toBeVisible({ timeout: 15000 });

    console.log("✅ Task completion confirmed - BRIDGE IS FULLY OPERATIONAL!");

    // Optional: Check the status indicator changed to "COMPLETED"
    const statusIndicator = page.getByText(/COMPLETED/i);
    await expect(statusIndicator).toBeVisible({ timeout: 2000 });

    console.log("✅ Status indicator shows COMPLETED");
  });

  test("should show proper status transitions", async ({ page }) => {
    const swarmButton = page.getByRole("button", { name: /Test Swarm/i });
    await expect(swarmButton).toBeVisible();

    await swarmButton.click();

    // Check for PENDING state
    await expect(page.getByText(/PENDING/i)).toBeVisible({ timeout: 3000 });
    console.log("✅ Status: PENDING");

    // Note: PROCESSING state might be too fast to catch reliably
    // It depends on the 2-second simulated work in task_poller.py

    // Check for COMPLETED state
    await expect(page.getByText(/COMPLETED/i)).toBeVisible({ timeout: 15000 });
    console.log("✅ Status: COMPLETED");
  });

  test("should handle multiple tasks sequentially", async ({ page }) => {
    const swarmButton = page.getByRole("button", { name: /Test Swarm/i });

    // Submit first task
    await swarmButton.click();
    await expect(page.getByText(/Task completed/i).first()).toBeVisible({
      timeout: 15000,
    });
    console.log("✅ Task 1 completed");

    // Wait a moment for UI to settle
    await page.waitForTimeout(1000);

    // Submit second task
    await swarmButton.click();
    await expect(page.getByText(/Task completed/i).nth(1)).toBeVisible({
      timeout: 15000,
    });
    console.log("✅ Task 2 completed");
  });
});

/**
 * How to run this test:
 *
 * Terminal 1 (Frontend):
 *   npm run dev
 *
 * Terminal 2 (Python Backend):
 *   cd infrastructure/colony
 *   .\venv\Scripts\activate  (Windows)
 *   # or: source venv/bin/activate  (Linux/Mac)
 *   python core/task_poller.py
 *
 * Terminal 3 (Test Runner):
 *   npx playwright test client/src/test/e2e/colony-bridge.spec.ts --headed
 *   # or for debugging:
 *   npx playwright test client/src/test/e2e/colony-bridge.spec.ts --headed --debug
 *
 * Success Criteria:
 * - All 3 tests pass (green checkmarks)
 * - You see the browser click the button
 * - Python terminal shows task processing logs
 * - No timeout errors
 *
 * This proves your distributed AI architecture is 100% functional!
 */
