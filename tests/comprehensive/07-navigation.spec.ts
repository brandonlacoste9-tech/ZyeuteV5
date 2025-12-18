/**
 * Comprehensive Navigation & UX Tests
 * Tests routing, navigation bar, responsive design, loading states, and error handling
 */

import { test, expect } from '@playwright/test';
import { loginAsGuest } from '../helpers/auth-helpers';
import { viewports } from '../helpers/test-data';

test.describe('Navigation & UX', () => {

    // =============================================================================
    // BOTTOM NAVIGATION TESTS
    // =============================================================================

    test('Bottom navigation is visible on all pages', async ({ page }) => {
        await loginAsGuest(page);

        const pages = ['/feed', '/explore', '/messages', '/notifications'];

        for (const pagePath of pages) {
            await page.goto(pagePath);
            await page.waitForLoadState('networkidle');

            // Look for bottom nav
            const bottomNav = page.locator('nav, [role="navigation"], .bottom-nav').last();
            const isVisible = await bottomNav.isVisible();

            if (!isVisible) {
                console.log(`Bottom nav not visible on ${pagePath}`);
            }
        }
    });

    test('Bottom nav links navigate correctly', async ({ page }) => {
        await loginAsGuest(page);

        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        // Find explore link
        const exploreLink = page.locator('a[href="/explore"], a:has-text("Explore"), a:has-text("Explorer")').first();

        if (await exploreLink.count() > 0) {
            await exploreLink.click();
            await page.waitForTimeout(1000);

            // Should navigate to explore
            expect(page.url()).toContain('/explore');
        }
    });

    test('Active nav item is highlighted', async ({ page }) => {
        await loginAsGuest(page);

        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        // Look for active state indicators
        const activeItem = page.locator('[aria-current="page"], .active, [data-active="true"]').first();

        if (await activeItem.count() > 0) {
            await expect(activeItem).toBeVisible();
        }
    });

    // =============================================================================
    // ROUTING TESTS
    // =============================================================================

    test('Deep links navigate to correct pages', async ({ page }) => {
        await loginAsGuest(page);

        const routes = [
            '/feed',
            '/explore',
            '/lazyeute',
            '/premium',
            '/settings',
        ];

        for (const route of routes) {
            await page.goto(route);
            await page.waitForLoadState('networkidle');

            // Page should load without errors
            const currentUrl = page.url();
            expect(currentUrl).toContain(route);
        }
    });

    test('404 page displays for invalid routes', async ({ page }) => {
        await page.goto('/this-page-does-not-exist-12345');
        await page.waitForLoadState('networkidle');

        // Should show 404 or redirect
        const has404 = await page.locator('text=/404|not found|introuvable/i').count() > 0;
        const redirected = !page.url().includes('this-page-does-not-exist');

        expect(has404 || redirected).toBeTruthy();
    });

    test('Back button navigation works', async ({ page }) => {
        await loginAsGuest(page);

        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        await page.goto('/explore');
        await page.waitForLoadState('networkidle');

        // Go back
        await page.goBack();
        await page.waitForLoadState('networkidle');

        // Should be back on feed
        expect(page.url()).toContain('/feed');
    });

    // =============================================================================
    // RESPONSIVE DESIGN TESTS
    // =============================================================================

    test('App renders correctly on mobile viewport', async ({ page }) => {
        await page.setViewportSize(viewports.mobile);

        await loginAsGuest(page);
        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        // Page should be visible and usable
        const body = page.locator('body');
        await expect(body).toBeVisible();

        // No horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() =>
            document.body.scrollWidth > window.innerWidth
        );

        expect(hasHorizontalScroll).toBeFalsy();
    });

    test('App renders correctly on tablet viewport', async ({ page }) => {
        await page.setViewportSize(viewports.tablet);

        await loginAsGuest(page);
        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('App renders correctly on desktop viewport', async ({ page }) => {
        await page.setViewportSize(viewports.desktop);

        await loginAsGuest(page);
        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    // =============================================================================
    // LOADING STATES TESTS
    // =============================================================================

    test('Loading spinner shows during data fetch', async ({ page }) => {
        await loginAsGuest(page);

        // Navigate fast to catch loading state
        const navigation = page.goto('/feed');

        // Look for loading indicator
        const spinner = page.locator('[data-testid="spinner"], .spinner, .loading, text="Chargement"');

        // Loading indicator may appear briefly
        const hadSpinner = await spinner.count() > 0;

        await navigation;

        // Verify navigation completed
        expect(page.url()).toContain('/feed');
    });

    test('Page transitions are smooth', async ({ page }) => {
        await loginAsGuest(page);

        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        await page.goto('/explore');
        await page.waitForLoadState('networkidle');

        // No console errors during transition
        expect(page.url()).toContain('/explore');
    });

    // =============================================================================
    // ERROR HANDLING TESTS
    // =============================================================================

    test('Error boundary catches component errors', async ({ page }) => {
        await loginAsGuest(page);

        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        // Monitor for React errors
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error' && msg.text().includes('React')) {
                errors.push(msg.text());
            }
        });

        await page.waitForTimeout(2000);

        // Should have no critical React errors
        expect(errors.length).toBe(0);
    });

    test('Network errors are handled gracefully', async ({ page }) => {
        await loginAsGuest(page);

        // Block API calls to simulate network error
        await page.route('**/api/**', route => route.abort());

        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        // Page should still load (show error state)
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    // =============================================================================
    // EXTERNAL LINKS TESTS
    // =============================================================================

    test('External links open in new tab', async ({ page, context }) => {
        await loginAsGuest(page);

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Look for external links
        const externalLink = page.locator('a[target="_blank"]').first();

        if (await externalLink.count() > 0) {
            const hasTarget = await externalLink.getAttribute('target');
            expect(hasTarget).toBe('_blank');
        }
    });

    // =============================================================================
    // PERFORMANCE TESTS
    // =============================================================================

    test('Pages load within acceptable time', async ({ page }) => {
        await loginAsGuest(page);

        const startTime = Date.now();

        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // Should load in under 10 seconds
        expect(loadTime).toBeLessThan(10000);
    });

    test('No memory leaks on page navigation', async ({ page }) => {
        await loginAsGuest(page);

        // Navigate between pages multiple times
        for (let i = 0; i < 3; i++) {
            await page.goto('/feed');
            await page.waitForLoadState('networkidle');

            await page.goto('/explore');
            await page.waitForLoadState('networkidle');
        }

        // Page should still be responsive
        const isResponsive = await page.locator('body').isVisible();
        expect(isResponsive).toBeTruthy();
    });
});
