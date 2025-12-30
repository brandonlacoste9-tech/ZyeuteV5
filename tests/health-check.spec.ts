import { test, expect } from "@playwright/test";

test.describe("Zyeuté Health Check", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base URL before each test
    // We handle potential redirects to login if not authenticated
    page.on("console", (msg) =>
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`),
    );
    page.on("pageerror", (exception) =>
      console.log(`[BROWSER-ERROR] ${exception}`),
    );
    await page.goto("/");
  });

  test("Feed Page should load or show empty state", async ({ page }) => {
    // Check if we are redirected to login (which is a valid "working" state for unauth)
    // OR if we are on the feed.

    // For this test, we assume we might be logged out or logged in.
    // If logged out, we should see the login page or be redirected.
    // But the user said "pages are broken", so we want to see if it RENDERS.

    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Expect generic title or specific page elements
    // Adjust selector based on actual generic app shell headers
    await expect(page.locator("body")).toBeVisible();

    // Check for critical crash text
    const errorOverlay = page.locator("text=Something went wrong");
    await expect(errorOverlay).not.toBeVisible();

    // If we are on login page
    if (page.url().includes("/login")) {
      console.log("Redirected to login, page is working.");
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      // If on Feed
      // Check for main layout elements
      await expect(page.locator("nav")).toBeVisible(); // Bottom nav or header

      // Check for "Aucun contenu" OR actual posts
      const emptyState = page.locator("text=Aucun contenu disponible");
      const posts = page.locator("article");

      // Wait for either to be visible
      await Promise.race([
        emptyState.waitFor({ state: "visible" }).catch(() => {}),
        posts
          .first()
          .waitFor({ state: "visible" })
          .catch(() => {}),
      ]);

      const isEmpty = await emptyState.isVisible();
      const hasPosts = (await posts.count()) > 0;

      console.log(
        `Feed status: Empty=${isEmpty}, Posts=${await posts.count()}`,
      );
      expect(isEmpty || hasPosts).toBeTruthy();
    }
  });

  test("Arcade Hub should be accessible", async ({ page }) => {
    // Direct navigation to Arcade
    await page.goto("/arcade");

    if (page.url().includes("/login")) {
      console.log("Skipping Arcade check due to auth redirect");
      return;
    }

    // Check for Arcade specific elements (using text from ArcadeHub.tsx)
    await expect(page.locator("text=Zyeuté Arcade")).toBeVisible();
    await expect(page.locator("text=Poutine Royale")).toBeVisible();
  });

  test("Poutine Lobby should load", async ({ page }) => {
    await page.goto("/games/poutine");

    if (page.url().includes("/login")) {
      console.log("Skipping Poutine check due to auth redirect");
      return;
    }

    // Check for Lobby specific elements
    await expect(page.locator("text=Poutine Royale")).toBeVisible();
    await expect(page.locator("text=Tournois Actifs")).toBeVisible();
  });

  test("Profile Page should not be stuck loading", async ({ page }) => {
    await page.goto("/profile/me"); // Or a known username if 'me' isn't handled yet, but usually is protected

    if (page.url().includes("/login")) {
      console.log("Skipping Profile check due to auth redirect");
      return;
    }

    // Check for avatar or username
    // Also check that it's NOT showing "Chargement..." forever
    const loader = page.locator("text=Chargement...");
    await expect(loader).not.toBeVisible({ timeout: 10000 }); // Wait 10s to ensure loader goes away

    await expect(page.locator("text=Abonnés")).toBeVisible();
  });
});
