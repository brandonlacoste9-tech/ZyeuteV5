/**
 * Authentication helper utilities for Playwright tests
 * Provides reusable functions for login, signup, and auth state management
 */

import { Page } from '@playwright/test';

/**
 * Quick guest mode entry - navigates to login and clicks guest button
 */
export async function loginAsGuest(page: Page): Promise<void> {
    await page.goto('/login');
    const guestButton = page.locator('text=Continuer en tant qu\'invité');
    await guestButton.waitFor({ state: 'visible', timeout: 10000 });
    await guestButton.click();

    // Wait for redirect away from login
    await page.waitForURL(/\/(feed)?$/, { timeout: 15000 });

    // Verify guest mode is set
    const guestMode = await page.evaluate(() => localStorage.getItem('zyeute_guest_mode'));
    if (guestMode !== 'true') {
        throw new Error('Guest mode not properly set in localStorage');
    }
}

/**
 * User login with email and password
 */
export async function loginAsUser(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/login');

    // Fill in credentials
    await page.locator('input[placeholder*="@"]').fill(email);
    await page.locator('input[type="password"]').fill(password);

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for successful login (redirect to feed)
    await page.waitForURL(/\/(feed|home)?$/, { timeout: 15000 });
}

/**
 * Create a new test user account
 */
export async function createTestUser(
    page: Page,
    email: string,
    password: string,
    username: string
): Promise<void> {
    await page.goto('/signup');

    // Fill signup form
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').first().fill(password);

    // Submit
    await page.locator('button[type="submit"]').click();

    // Wait for account creation success
    await page.waitForURL(/\/(feed|onboarding)?$/, { timeout: 15000 });
}

/**
 * Admin login - uses admin test credentials
 */
export async function loginAsAdmin(page: Page): Promise<void> {
    // Use admin test account from environment or default
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@zyeute.test';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'TestAdmin123!';

    await loginAsUser(page, adminEmail, adminPassword);
}

/**
 * Clear all authentication state
 */
export async function clearAuth(page: Page): Promise<void> {
    // Clear localStorage
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    // Clear cookies
    await page.context().clearCookies();

    // Navigate to login to ensure clean state
    await page.goto('/login');
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
    const guestMode = await page.evaluate(() => localStorage.getItem('zyeute_guest_mode'));
    const hasSession = await page.evaluate(() => {
        // Check for Supabase session
        const supabaseKey = Object.keys(localStorage).find(key =>
            key.includes('supabase.auth.token')
        );
        return !!supabaseKey;
    });

    return guestMode === 'true' || hasSession;
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page, timeout = 10000): Promise<void> {
    await page.waitForFunction(
        () => {
            const guestMode = localStorage.getItem('zyeute_guest_mode');
            const hasSupabaseToken = Object.keys(localStorage).some(key =>
                key.includes('supabase.auth.token')
            );
            return guestMode === 'true' || hasSupabaseToken;
        },
        { timeout }
    );
}
