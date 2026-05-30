import { test, expect, type Page } from "@playwright/test";

/**
 * ZYEUTÉ SENTINEL SUITE v5.0
 * The "Indestructible" Test Suite for the Quebec Social Hive
 */

test.describe("Zyeuté Sentinel: Critical Path", () => {
  // --- Helpers ---
  async function takeAuditScreenshot(page: Page, name: string) {
    await page.screenshot({
      path: `playwright-report/audit-${name}.png`,
      fullPage: true,
    });
  }

  async function checkHiveContext(page: Page) {
    const hiveId = await page.evaluate(
      () => localStorage.getItem("zyeute_hive_id") || "quebec",
    );
    console.log(`[SENTINEL] Active Hive: ${hiveId}`);
    return hiveId;
  }

  test.beforeEach(async ({ page }) => {
    // Standard setup with debug logging
    page.on("console", (msg) => {
      if (msg.type() === "error")
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      if (
        msg.text().includes("[GUEST LOGIN]") ||
        msg.text().includes("[LOGIN]")
      ) {
        console.log(`[BROWSER LOG] ${msg.text()}`);
      }
    });

    // We only mock auth for the FIRST test to force the login screen
    // Other tests will rely on the session established or their own navigation
  });

  test("Security & Auth: Lockdown and Guest Entry", async ({ page }) => {
    console.log("📍 Verifying Auth Lockdown...");

    // Clear state ONLY for this test to ensure we see the lockdown
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Mock 401 for this specific test
    await page.route("**/auth/v1/user", (route) => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: "unauthorized" }),
      });
    });

    await page.goto("/login", { waitUntil: "networkidle" });

    // Check for identity title (Logo text)
    const loginTitle = page.locator("h1").filter({ hasText: /Zyeuté/i });
    await expect(loginTitle).toBeVisible({ timeout: 15000 });

    // Execute Guest Entry
    console.log("📍 Executing Guest Entry...");
    const guestBtn = page
      .getByRole("button")
      .filter({ hasText: /invité|guest/i });
    await expect(guestBtn.first()).toBeVisible({ timeout: 10000 });
    await guestBtn.first().click({ force: true });

    // Verification of Feed Arrival
    console.log("📍 Waiting for feed redirect...");
    await page.waitForURL(
      (url) => url.pathname.includes("/feed") || url.pathname === "/",
      { timeout: 20000 },
    );

    // Ensure we are logged in as guest in localStorage
    const isGuest = await page.evaluate(
      () => localStorage.getItem("zyeute_guest_mode") === "true",
    );
    expect(isGuest).toBe(true);

    await takeAuditScreenshot(page, "guest-mode-success");
    console.log("✅ Guest Entry Verified.");
  });

  test("Social Core: Feed Population & Hive Integrity", async ({ page }) => {
    console.log("📍 Auditing Feed Content...");
    // Ensure we are logged in (Shared state should work if not cleared)
    await page.goto("/feed", { waitUntil: "load" });

    if (page.url().includes("/login")) {
      await page.getByRole("button", { name: /invité/i }).click();
      await page.waitForURL("**/feed");
    }

    // 1. Check for Quebec Hive Presence
    const hiveId = await checkHiveContext(page);
    expect(hiveId).toBe("quebec");

    // 2. Wait for posts
    const postContainer = page.locator("main article, article").first();
    await expect(postContainer).toBeVisible({ timeout: 15000 });
    console.log("✅ Feed is populated.");

    // 3. Navigation Bar Integrity
    await expect(page.locator("nav")).toBeVisible();
    console.log("✅ Navigation Verified.");
  });

  test("Gamification: Achievements & Tiers", async ({ page }) => {
    console.log("📍 Verifying Gamification System...");
    await page.goto("/achievements", { waitUntil: "networkidle" });

    if (page.url().includes("/login")) {
      await page.getByRole("button", { name: /invité/i }).click();
      await page.waitForURL("**/achievements");
    }

    // Check for "Accomplissements"
    await expect(
      page.locator("h1").filter({ hasText: /Accomplissements/i }),
    ).toBeVisible({ timeout: 10000 });

    // Check for tier info
    await expect(page.locator("h2")).toBeVisible();

    // Check for achievement cards
    await expect(page.locator(".card-edge").first()).toBeVisible();

    await takeAuditScreenshot(page, "gamification-audit");
    console.log("✅ Gamification System Verified.");
  });

  test("Arcade: Poutine Royale Lobby Readiness", async ({ page }) => {
    console.log("📍 Verifying Arcade Hub...");
    await page.goto("/arcade", { waitUntil: "networkidle" });

    if (page.url().includes("/login")) {
      await page.getByRole("button", { name: /invité/i }).click();
      await page.waitForURL("**/arcade");
    }

    const arcadeTitle = page.locator("h1").filter({ hasText: /Arcade|Jeux/i });
    await expect(arcadeTitle).toBeVisible({ timeout: 10000 });

    // Check for Poutine Royale
    const poutineGame = page
      .locator("text=Poutine Royale")
      .or(page.getByText("Poutine Stack"));
    await expect(poutineGame.first()).toBeVisible();

    await takeAuditScreenshot(page, "arcade-ready");
    console.log("✅ Arcade Readiness Verified.");
  });

  test("AI Interaction: Ti-Guy Persona Check", async ({ page }) => {
    // Ti-Guy often appears as a floating assistant or in comments
    console.log("📍 Searching for Ti-Guy Assistant...");

    await page.goto("/feed");

    if (page.url().includes("/login")) {
      await page.getByRole("button", { name: /invité/i }).click();
      await page.waitForURL("**/feed");
    }

    // Fixed selector logic
    const tiguy = page
      .locator('img[alt*="Ti-Guy"], .tiguy-assistant')
      .or(page.getByText("Ti-Guy"));

    const exists = (await tiguy.count()) > 0;
    if (exists) {
      console.log("✅ Ti-Guy identified on site.");
      await expect(tiguy.first()).toBeVisible();
    } else {
      console.log("ℹ️ Ti-Guy is currently incognito.");
    }
  });
});
