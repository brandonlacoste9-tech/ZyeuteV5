/**
 * Minimal smoke: guest session + La Zyeute shell (skips intro splash for stability).
 * Run: npx playwright test tests/smoke/feed-smoke.spec.ts
 */
import { test, expect } from "@playwright/test";

test("feed page shows La Zyeute chrome", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("zyeute_splash_seen", "true");
    } catch {
      /* */
    }
  });

  await page.goto("/login");
  await page.getByText("Continuer en tant qu'invité").click();
  await page.waitForURL(/\/(feed)?$/, { timeout: 20_000 });
  await page.goto("/feed");

  await expect(page.getByTestId("button-back")).toBeVisible({
    timeout: 30_000,
  });
});
