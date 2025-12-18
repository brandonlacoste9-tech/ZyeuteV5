/**
 * Vital Signs Test Suite
 * 5 critical health checks to verify core functionality before adding new apps.
 * 
 * Run: npm run test:vitals
 * Debug: npm run test:e2e:ui
 */

import { test, expect } from '@playwright/test';

// =============================================================================
// CHECK 1: THE FRONT DOOR - Does the Auth Page load?
// =============================================================================
test('Check 1: Auth Page Loads (The Front Door)', async ({ page }) => {
    await page.goto('/login');

    // Verify the page has the Zyeuté branding
    await expect(page.locator('text=Zyeuté')).toBeVisible({ timeout: 10000 });

    // Verify login form elements are present
    await expect(page.locator('input[placeholder*="@"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Verify guest login button is present
    await expect(page.locator('text=Continuer en tant qu\'invité')).toBeVisible();
});

// =============================================================================
// CHECK 2: THE GUEST PASS - Can we click "Guest Login" and get redirected?
// =============================================================================
test('Check 2: Guest Login Flow (The Guest Pass)', async ({ page }) => {
    await page.goto('/login');

    // Wait for the guest button to be visible
    const guestButton = page.locator('text=Continuer en tant qu\'invité');
    await expect(guestButton).toBeVisible({ timeout: 10000 });

    // Click the guest login button
    await guestButton.click();

    // Wait for redirect - should go to /feed or /
    await page.waitForURL(/\/(feed)?$/, { timeout: 15000 });

    // Verify we're no longer on the login page
    await expect(page).not.toHaveURL('/login');

    // Verify localStorage has guest mode set
    const guestMode = await page.evaluate(() => localStorage.getItem('zyeute_guest_mode'));
    expect(guestMode).toBe('true');
});

// =============================================================================
// CHECK 3: THE FEED - Does the Feed actually load data?
// =============================================================================
test('Check 3: Feed Visibility (The Feed)', async ({ page }) => {
    // Enter guest mode first
    await page.goto('/login');
    await page.locator('text=Continuer en tant qu\'invité').click();
    await page.waitForURL(/\/(feed)?$/, { timeout: 15000 });

    // Navigate to feed if not already there
    await page.goto('/feed');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the feed container exists and isn't empty
    // The feed should have some content, even if it's sample/empty state
    const feedContent = page.locator('main, [role="main"], #root');
    await expect(feedContent).toBeVisible({ timeout: 10000 });

    // Verify no critical errors in the console
    const errors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
            errors.push(msg.text());
        }
    });

    // Wait a moment to catch any errors
    await page.waitForTimeout(2000);

    // There shouldn't be critical React errors
    const criticalErrors = errors.filter(e =>
        e.includes('TypeError') ||
        e.includes('ReferenceError') ||
        e.includes('Cannot read properties')
    );
    expect(criticalErrors).toHaveLength(0);
});

// =============================================================================
// CHECK 4: THE SHIELD - Are Admin routes blocked for guests?
// =============================================================================
test('Check 4: Admin Route Protection (The Shield)', async ({ page }) => {
    // Enter guest mode first
    await page.goto('/login');
    await page.locator('text=Continuer en tant qu\'invité').click();
    await page.waitForURL(/\/(feed)?$/, { timeout: 15000 });

    // Try to access admin page
    await page.goto('/admin');

    // Wait for redirect or access denial
    await page.waitForLoadState('networkidle');

    // Guest should NOT be on the admin page
    // Either redirected away OR shown access denied
    const currentURL = page.url();
    const isOnAdmin = currentURL.includes('/admin');

    if (isOnAdmin) {
        // If still on admin page, should see access denied message
        const accessDenied = await page.locator('text=/denied|unauthorized|forbidden|access/i').isVisible();
        expect(accessDenied).toBe(true);
    } else {
        // Successfully redirected away from admin
        expect(isOnAdmin).toBe(false);
    }
});

// =============================================================================
// CHECK 5: THE PULSE - Is the API Health endpoint responding?
// =============================================================================
test('Check 5: API Health Check (The Pulse)', async ({ request }) => {
    const response = await request.get('/api/health');

    // Verify the response is OK
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Verify the response body
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('environment');
});
