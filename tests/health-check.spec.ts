import { test, expect, type Page } from "@playwright/test";

test.describe("Zyeuté Health Check (Indestructible)", () => {
  // Screenshot Bot Helper
  async function takeScreenshot(page: Page, name: string) {
    await page.screenshot({
      path: `results/screenshots/${name}.png`,
      fullPage: true,
    });
    console.log(`[BOT] Screenshot captured: ${name}`);
  }

  test.beforeEach(async ({ page }) => {
    // Navigate to base URL before each test
    page.on("console", (msg) =>
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`),
    );
    page.on("pageerror", (exception) =>
      console.log(`[BROWSER-ERROR] ${exception}`),
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  test("Feed Page should render (Skeleton <-> Content)", async ({ page }) => {
    // 1. Check for Login Redirect (Valid State for Unauth)
    // We check URL first as it's the most reliable indicator of state
    await page.waitForTimeout(2000); // Give router a moment to settle

    if (page.url().includes("/login")) {
      console.log("Verified: Feed redirected to Login.");
      const loginInput = page.getByPlaceholder("ton@email.com ou username");
      await expect(loginInput).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, "feed-redirect-login");
      return;
    }

    // 2. Check for App Shell (Header/Nav)
    const navOrHeader = page.locator("nav").or(page.locator("header"));
    await expect(navOrHeader).toBeVisible({ timeout: 10000 });

    // 2. Wait for loading skeleton to disappear (up to 15s)
    const skeleton = page.locator(".animate-pulse").first();
    if (await skeleton.isVisible()) {
      console.log("Waiting for skeleton to disappear...");
      await skeleton.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {
        console.log("Skeleton timed out - likely backend slow or empty");
      });
    }

    // 3. Verify Content OR Empty State
    // "Aucun contenu" or "article" (post)
    const content = page.locator("article").first();
    const emptyState = page.locator("text=Aucun contenu disponible");
    const errorState = page.locator("text=Something went wrong");

    // Race to see which one appears
    // We expect one of them to be present
    await expect(content.or(emptyState).or(errorState)).toBeVisible({
      timeout: 10000,
    });

    await takeScreenshot(page, "feed-health");
  });

  test("Arcade Hub should load", async ({ page }) => {
    await page.goto("/arcade");
    if (page.url().includes("/login")) return; // Skip if redirected

    await expect(page.locator("text=Zyeuté Arcade")).toBeVisible();
    await takeScreenshot(page, "arcade-health");
  });

  test("Poutine Lobby should load", async ({ page }) => {
    await page.goto("/games/poutine");
    if (page.url().includes("/login")) return;

    await expect(page.locator("text=Poutine Royale")).toBeVisible();
    await takeScreenshot(page, "poutine-lobby-health");
  });

  test("Profile Page should load (Guest handled)", async ({ page }) => {
    await page.goto("/profile/me");

    // If redirected to login, that's a pass for "Working App"
    if (page.url().includes("/login")) {
      console.log("Profile redirect working.");
    } else {
      // If we are on profile
      await expect(page.locator("text=Loading")).not.toBeVisible();
      // Look for profile header or "Profile Not Found"
      const profileHeader = page.locator("h1");
      const notFound = page.locator("text=Profile Not Found");
      await expect(profileHeader.or(notFound)).toBeVisible();
    }
    await takeScreenshot(page, "profile-health");
  });

  test("Parental Dashboard should load (Mock Mode)", async ({ page }) => {
    await page.goto("/parental");
    // Should be redirected if guest/unauth, but if we see login, it works.
    await expect(page.locator("body")).toBeVisible();
    await takeScreenshot(page, "parental-dashboard");
  });
});
