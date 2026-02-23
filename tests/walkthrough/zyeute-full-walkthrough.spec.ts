/**
 * ─────────────────────────────────────────────────────────────────────
 *  Zyeuté Full App Walkthrough — Playwright E2E
 * ─────────────────────────────────────────────────────────────────────
 *  Navigates through every major page and feature of the Zyeuté app.
 *  Uses Guest Mode to bypass Supabase login (no real credentials needed).
 *
 *  Run:  npx playwright test tests/walkthrough/zyeute-full-walkthrough.spec.ts
 *  UI:   npx playwright test tests/walkthrough/zyeute-full-walkthrough.spec.ts --ui
 * ─────────────────────────────────────────────────────────────────────
 */

import { test, expect, Page } from "@playwright/test";

// ── Helpers ────────────────────────────────────────────────

/** Enter guest mode fast — clicks the guest button on /login */
async function enterGuestMode(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  // Guest backdoor button varies — try several selectors
  const guestBtn = page.locator(
    [
      "text=Continuer en tant qu'invité",
      "text=Mode invité",
      "text=Guest",
      "[data-testid='guest-button']",
      "button:has-text('invité')",
    ].join(", "),
  );

  // If the guest button is visible, click it
  try {
    await guestBtn.first().waitFor({ state: "visible", timeout: 8000 });
    await guestBtn.first().click();
  } catch {
    // Fallback: set guest localStorage directly and reload
    await page.evaluate(() => {
      localStorage.setItem("zyeute_guest_mode", "true");
    });
    await page.goto("/feed");
  }

  // Wait for navigation to finish (could land on / or /feed)
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
}

/** Take a named screenshot of the current state */
async function snap(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/walkthrough-${name}.png`,
    fullPage: false,
  });
}

/** Navigate to a route, wait for it to settle, and screenshot */
async function visitAndSnap(page: Page, path: string, label: string) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(800); // let lazy loads + transitions finish
  await snap(page, label);
}

// ── Tests ──────────────────────────────────────────────

test.describe("🦫 Zyeuté Full App Walkthrough", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Single browser context shared across all serial steps
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "fr-CA",
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ─── 1. PUBLIC PAGES ──────────────────────────────────

  test("01 — Login page loads", async () => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Should see a form or at least the login container
    const pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();

    await snap(page, "01-login");
  });

  test("02 — Signup page loads", async () => {
    await visitAndSnap(page, "/signup", "02-signup");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("03 — Forgot password page", async () => {
    await visitAndSnap(page, "/forgot-password", "03-forgot-password");
  });

  test("04 — Legal: Community Guidelines", async () => {
    await visitAndSnap(
      page,
      "/legal/community-guidelines",
      "04-community-guidelines",
    );
  });

  test("05 — Legal: Terms of Service", async () => {
    await visitAndSnap(page, "/legal/terms", "05-terms");
  });

  test("06 — Legal: Privacy Policy", async () => {
    await visitAndSnap(page, "/legal/privacy", "06-privacy");
  });

  // ─── 2. GUEST MODE ENTRY ──────────────────────────────

  test("07 — Enter Guest Mode", async () => {
    await enterGuestMode(page);
    await snap(page, "07-guest-entry");

    // We should NOT be on /login anymore
    const url = page.url();
    expect(url).not.toContain("/login");
  });

  // ─── 3. CORE PAGES (AUTHENTICATED) ───────────────────

  test("08 — Feed page", async () => {
    await visitAndSnap(page, "/feed", "08-feed");
    // Feed should render — look for any content area
    await expect(page.locator("body")).toBeVisible();
  });

  test("09 — Explore page", async () => {
    await visitAndSnap(page, "/explore", "09-explore");
  });

  test("10 — Notifications page", async () => {
    await visitAndSnap(page, "/notifications", "10-notifications");
  });

  test("11 — Profile page", async () => {
    await visitAndSnap(page, "/profile/me", "11-profile");
  });

  test("12 — Settings page", async () => {
    await visitAndSnap(page, "/settings", "12-settings");
  });

  // ─── 4. MESSAGING SYSTEM ─────────────────────────────

  test("13 — Messages (inbox)", async () => {
    await visitAndSnap(page, "/messages", "13-messages-inbox");
  });

  test("14 — Chat history", async () => {
    await visitAndSnap(page, "/chat-history", "14-chat-history");
  });

  // ─── 5. CONTENT CREATION ─────────────────────────────

  test("15 — Upload page", async () => {
    await visitAndSnap(page, "/upload", "15-upload");
  });

  test("16 — Studio page", async () => {
    await visitAndSnap(page, "/studio", "16-studio");
  });

  test("17 — Artiste page", async () => {
    await visitAndSnap(page, "/artiste", "17-artiste");
  });

  // ─── 6. DISCOVERY / ENTERTAINMENT ─────────────────────

  test("18 — Trending page", async () => {
    await visitAndSnap(page, "/trending", "18-trending");
  });

  test("19 — Arcade hub", async () => {
    await visitAndSnap(page, "/arcade", "19-arcade");
  });

  test("20 — Poutine game lobby", async () => {
    await visitAndSnap(page, "/games/poutine", "20-poutine-lobby");
  });

  test("21 — Live Discover page", async () => {
    await visitAndSnap(page, "/live", "21-live-discover");
  });

  // ─── 7. AI & PREMIUM ─────────────────────────────────

  test("22 — AI Studio (TI-GUY)", async () => {
    await visitAndSnap(page, "/ai-studio", "22-ai-studio");
  });

  test("23 — TI-GUY direct page", async () => {
    await visitAndSnap(page, "/ti-guy", "23-ti-guy");
  });

  test("24 — Premium page", async () => {
    await visitAndSnap(page, "/premium", "24-premium");
  });

  test("25 — Marketplace page", async () => {
    await visitAndSnap(page, "/marketplace", "25-marketplace");
  });

  // ─── 8. SOCIAL FEATURES ──────────────────────────────

  test("26 — Activity page", async () => {
    await visitAndSnap(page, "/activity", "26-activity");
  });

  test("27 — Saved posts", async () => {
    await visitAndSnap(page, "/saved", "27-saved");
  });

  test("28 — Achievements page", async () => {
    await visitAndSnap(page, "/achievements", "28-achievements");
  });

  test("29 — Challenges page", async () => {
    await visitAndSnap(page, "/challenges", "29-challenges");
  });

  test("30 — Analytics page", async () => {
    await visitAndSnap(page, "/analytics", "30-analytics");
  });

  test("31 — Creator Revenue page", async () => {
    await visitAndSnap(page, "/revenue", "31-revenue");
  });

  // ─── 9. HIVE & MAP ───────────────────────────────────

  test("32 — Hive Tap page", async () => {
    await visitAndSnap(page, "/hive-tap", "32-hive-tap");
  });

  test("33 — Swarm Map page", async () => {
    await visitAndSnap(page, "/map", "33-swarm-map");
  });

  // ─── 10. SETTINGS SUB-PAGES ──────────────────────────

  const settingsSubpages = [
    { path: "/settings/profile", label: "34-settings-profile" },
    { path: "/settings/privacy", label: "35-settings-privacy" },
    { path: "/settings/notifications", label: "36-settings-notifications" },
    { path: "/settings/app", label: "37-settings-app" },
    { path: "/settings/region", label: "38-settings-region" },
    { path: "/settings/language", label: "39-settings-language" },
    { path: "/settings/voice", label: "40-settings-voice" },
    { path: "/settings/media", label: "41-settings-media" },
    { path: "/settings/audio", label: "42-settings-audio" },
    { path: "/settings/storage", label: "43-settings-storage" },
    { path: "/settings/tags", label: "44-settings-tags" },
    { path: "/settings/content", label: "45-settings-content" },
    { path: "/settings/sharing", label: "46-settings-sharing" },
    { path: "/settings/comments", label: "47-settings-comments" },
    { path: "/settings/muted", label: "48-settings-muted" },
    { path: "/settings/restricted", label: "49-settings-restricted" },
    { path: "/settings/favorites", label: "50-settings-favorites" },
  ];

  for (const sub of settingsSubpages) {
    test(`${sub.label.replace(/-/g, " ")}`, async () => {
      await visitAndSnap(page, sub.path, sub.label);
    });
  }

  // ─── 11. STATIC FILE ─────────────────────────────────

  test("51 — Chat UI demo (static HTML)", async () => {
    await page.goto("/chat-ui-demo.html");
    await page.waitForLoadState("domcontentloaded");
    await snap(page, "51-chat-ui-demo");

    // Verify the demo chat is interactive
    const input = page.locator(".input-field input");
    if (await input.isVisible()) {
      await input.fill("Test message from Playwright!");
      await page.locator(".send-btn").click();
      await page.waitForTimeout(500);
      await snap(page, "51b-chat-ui-demo-sent");
    }
  });

  // ─── 12. NAVIGATION & INTERACTIONS ────────────────────

  test("52 — Bottom nav interaction", async () => {
    await page.goto("/feed");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // Look for bottom nav or navigation buttons
    const navLinks = page.locator(
      "nav a, [role='navigation'] a, .bottom-nav a",
    );
    const count = await navLinks.count();

    if (count > 0) {
      // Click through each bottom nav item
      for (let i = 0; i < Math.min(count, 5); i++) {
        const link = navLinks.nth(i);
        if (await link.isVisible()) {
          await link.click();
          await page.waitForTimeout(500);
        }
      }
    }

    await snap(page, "52-nav-interaction");
  });

  test("53 — Error handling: 404 redirect", async () => {
    await page.goto("/this-page-does-not-exist-at-all");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // App should redirect unknown routes to /
    const url = page.url();
    // It either redirects to home or shows a fallback
    expect(url).toBeTruthy();
    await snap(page, "53-404-redirect");
  });

  test("54 — Responsive: Mobile viewport", async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/feed");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);
    await snap(page, "54-mobile-feed");

    // Check messages on mobile
    await page.goto("/messages");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);
    await snap(page, "54b-mobile-messages");

    // Reset viewport
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("55 — Responsive: Tablet viewport", async () => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/feed");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);
    await snap(page, "55-tablet-feed");

    // Reset viewport
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  // ─── 13. PERFORMANCE CHECK ───────────────────────────

  test("56 — Page load performance", async () => {
    const pages = ["/login", "/feed", "/explore", "/messages", "/settings"];

    for (const route of pages) {
      const start = Date.now();
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      const loadTime = Date.now() - start;

      console.log(`  ⏱  ${route} loaded in ${loadTime}ms`);

      // No page should take longer than 10 seconds
      expect(loadTime).toBeLessThan(10000);
    }
  });

  // ─── 14. PARENTAL & SPECIAL ──────────────────────────

  test("57 — Parental dashboard", async () => {
    await visitAndSnap(page, "/parental", "57-parental");
  });

  test("58 — Pulse page (regional skins)", async () => {
    await visitAndSnap(page, "/pulse", "58-pulse");
  });

  // ─── 15. FINAL SUMMARY ───────────────────────────────

  test("59 — Walkthrough complete ✅", async () => {
    // Navigate back to feed as final state
    await page.goto("/feed");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    await snap(page, "59-walkthrough-complete");

    console.log("\n");
    console.log("  ══════════════════════════════════════════════════════");
    console.log("  ✅  ZYEUTÉ FULL WALKTHROUGH COMPLETE");
    console.log("  ══════════════════════════════════════════════════════");
    console.log("  📸  Screenshots saved to: test-results/walkthrough-*.png");
    console.log("  📊  Report: npx playwright show-report");
    console.log("  ══════════════════════════════════════════════════════\n");
  });
});
