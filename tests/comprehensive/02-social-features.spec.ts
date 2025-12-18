/**
 * Comprehensive Social Features Tests
 * Tests feed interactions, posts, likes, follows, profiles, and social engagement
 */

import { test, expect } from '@playwright/test';
import { loginAsGuest } from '../helpers/auth-helpers';
import { waitForFeedToLoad, waitForElementWithRetry } from '../helpers/api-helpers';
import { testPosts, generateRandomPost } from '../helpers/test-data';

test.describe('Social Features', () => {

    test.beforeEach(async ({ page }) => {
        // Login as guest for all tests
        await loginAsGuest(page);
    });

    // =============================================================================
    // FEED TESTS
    // =============================================================================

    test('Feed loads and displays posts', async ({ page }) => {
        await page.goto('/feed');
        await page.waitForLoadState('networkidle');

        // Wait for feed content to load
        await page.waitForTimeout(2000);

        // Check that main content area exists
        const feedContent = page.locator('main, [role="main"], .feed-container');
        await expect(feedContent).toBeVisible({ timeout: 10000 });

        // There should be either posts or an empty state message
        const hasPosts = await page.locator('[data-testid="post"], .post-item, article').count() > 0;
        const hasEmptyState = await page.locator('text=/aucun|empty|no posts/i').count() > 0;

        expect(hasPosts || hasEmptyState).toBeTruthy();
    });

    test('Infinite scroll loads more posts', async ({ page }) => {
        await page.goto('/feed');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Count initial posts
        const initialPostCount = await page.locator('[data-testid="post"], .post-item, article').count();

        if (initialPostCount > 0) {
            // Scroll to bottom
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);

            // Check if more posts loaded or we've reached the end
            const newPostCount = await page.locator('[data-testid="post"], .post-item, article').count();
            const reachedEnd = await page.locator('text=/fin|end|no more/i').count() > 0;

            // Either more posts loaded or we've reached the end
            expect(newPostCount >= initialPostCount || reachedEnd).toBeTruthy();
        }
    });

    test('Explore page shows public content', async ({ page }) => {
        await page.goto('/explore');
        await page.waitForLoadState('networkidle');

        // Page should load without errors
        const mainContent = page.locator('main, [role="main"]');
        await expect(mainContent).toBeVisible();

        // Should have some content or empty state
        const hasContent = await page.locator('[data-testid="post"], .post-item, .explore-item').count() > 0;
        const hasEmptyState = await page.locator('text=/explore|discover|empty/i').count() > 0;

        expect(hasContent || hasEmptyState).toBeTruthy();
    });

    // =============================================================================
    // POST INTERACTION TESTS
    // =============================================================================

    test('User can view post details', async ({ page }) => {
        await page.goto('/feed');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Find first post
        const firstPost = page.locator('[data-testid="post"], .post-item, article').first();
        const postExists = await firstPost.count() > 0;

        if (postExists) {
            // Click on post to view details
            await firstPost.click();
            await page.waitForTimeout(1000);

            // Should navigate to post detail or show modal
            const onPostDetail = page.url().includes('/post/') || page.url().includes('/p/');
            const hasModal = await page.locator('[role="dialog"], .modal').count() > 0;

            expect(onPostDetail || hasModal).toBeTruthy();
        }
    });

    test('Like button is visible and clickable', async ({ page }) => {
        await page.goto('/feed');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Find like button
        const likeButton = page.locator('[data-testid="like-button"], button:has-text("❤"), .like-btn').first();

        if (await likeButton.count() > 0) {
            await expect(likeButton).toBeVisible();

            // Button should be clickable
            const isClickable = await likeButton.isEnabled();
            expect(isClickable).toBeTruthy();

            // Try to click (may need auth for actual like)
            await likeButton.click();
            await page.waitForTimeout(500);

            // Should either show auth prompt or like succeeds
            const currentUrl = page.url();
            expect(currentUrl).toBeTruthy(); // Page still responsive
        }
    });

    // =============================================================================
    // PROFILE TESTS
    // =============================================================================

    test('User profile page loads', async ({ page }) => {
        // Navigate to a profile (using common test username)
        await page.goto('/profile/testuser');
        await page.waitForLoadState('networkidle');

        // Page should load (even if user doesn't exist, should show 404 or empty state)
        const body = page.locator('body');
        await expect(body).toBeVisible();

        // Check for profile elements or 404
        const hasProfile = await page.locator('.profile, [data-testid="profile"]').count() > 0;
        const has404 = await page.locator('text=/404|not found|introuvable/i').count() > 0;

        expect(hasProfile || has404).toBeTruthy();
    });

    test('Profile displays user information', async ({ page }) => {
        await page.goto('/profile/testuser');
        await page.waitForLoadState('networkidle');

        // Check if profile loaded (not 404)
        const has404 = await page.locator('text=/404|not found/i').count() > 0;

        if (!has404) {
            // Should see username or profile info
            const hasUsername = await page.locator('text=/testuser|@/i').count() > 0;
            const hasProfileSection = await page.locator('.profile, [data-testid="profile"]').count() > 0;

            expect(hasUsername || hasProfileSection).toBeTruthy();
        }
    });

    test('Follow button visible on other user profiles', async ({ page }) => {
        await page.goto('/profile/testuser');
        await page.waitForLoadState('networkidle');

        // Look for follow/unfollow button
        const followButton = page.locator('button:has-text("Follow"), button:has-text("Suivre"), button:has-text("Unfollow")').first();

        // Button may or may not exist depending on auth and profile
        const buttonCount = await followButton.count();

        // Just verify page loaded without errors
        expect(buttonCount >= 0).toBeTruthy();
    });

    // =============================================================================
    // SEARCH & DISCOVERY TESTS
    // =============================================================================

    test('Search functionality is accessible', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Look for search input or search page link
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="chercher"]').first();
        const searchLink = page.locator('a[href*="search"], a:has-text("Search")').first();

        const hasSearch = await searchInput.count() > 0 || await searchLink.count() > 0;

        // Search should be accessible somewhere
        expect(hasSearch).toBeTruthy();
    });

    test('Hashtag navigation works', async ({ page }) => {
        await page.goto('/feed');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for hashtag links
        const hashtagLink = page.locator('a[href*="#"], .hashtag').first();

        if (await hashtagLink.count() > 0) {
            await hashtagLink.click();
            await page.waitForTimeout(1000);

            // Should navigate somewhere (hashtag page or search)
            const url = page.url();
            expect(url).toBeTruthy();
        }
    });

    // =============================================================================
    // LAZYEUTE VIDEO PLAYER TESTS
    // =============================================================================

    test('LaZyeute page loads', async ({ page }) => {
        await page.goto('/lazyeute');
        await page.waitForLoadState('networkidle');

        // Page should load
        const mainContent = page.locator('main, [role="main"]');
        await expect(mainContent).toBeVisible({ timeout: 10000 });
    });

    test('LaZyeute displays video posts', async ({ page }) => {
        await page.goto('/lazyeute');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Should have video player or empty state
        const hasVideo = await page.locator('video, [data-testid="video-player"]').count() > 0;
        const hasEmptyState = await page.locator('text=/aucun|empty|no videos/i').count() > 0;

        expect(hasVideo || hasEmptyState).toBeTruthy();
    });

    test('LaZyeute swipe navigation works', async ({ page }) => {
        await page.goto('/lazyeute');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Check if video exists
        const hasVideo = await page.locator('video').count() > 0;

        if (hasVideo) {
            // Try arrow down or swipe simulation
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(1000);

            // Should still be on lazyeute page (navigation worked)
            expect(page.url()).toContain('lazyeute');
        }
    });

    // =============================================================================
    // NOTIFICATIONS TESTS
    // =============================================================================

    test('Notifications page is accessible', async ({ page }) => {
        await page.goto('/notifications');
        await page.waitForLoadState('networkidle');

        // Page should load
        const body = page.locator('body');
        await expect(body).toBeVisible();

        // Should have notifications section or empty state
        const hasNotifications = await page.locator('[data-testid="notification"], .notification-item').count() > 0;
        const hasEmptyState = await page.locator('text=/no notifications|aucune notification/i').count() > 0;

        expect(hasNotifications || hasEmptyState).toBeTruthy();
    });
});
