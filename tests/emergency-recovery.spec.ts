import { test, expect } from '@playwright/test';

test.describe('Emergency Recovery', () => {
    test('App loads without infinite spinner', async ({ page }) => {
        // Navigate to root
        await page.goto('/');

        // Wait MAX 10 seconds for loading screen to disappear
        // The loading screen has "Chargement de Zyeuté..."
        // We expect to eventually see either "Bienvenue" (Home) or "Connexion" (Login) or just the main layout
        // Ti-Guy component presence is a good indicator of main layout load

        console.log('Navigated to /, waiting for app shell...');

        // Wait for the loader to DISAPPEAR
        await expect(page.locator('text=Chargement de Zyeuté...')).toHaveCount(0, { timeout: 10000 });

        console.log('Loader disappeared! Verifying interactive state...');

        // Check if we are on login or home
        const isLogin = await page.locator('text=Découvre le Québec').count() > 0; // Login slogan
        const isHome = await page.locator('text=Accueil').count() > 0; // Home nav

        console.log(`State: Login=${isLogin}, Home=${isHome}`);

        if (!isLogin && !isHome) {
            // Fallback check for anything interactive
            await expect(page.locator('body')).not.toBeEmpty();
        }
    });

    test('Guest login flow works', async ({ page }) => {
        await page.goto('/login');
        // Use explicit button selector for "Continuer en tant qu'invité"
        const guestButton = page.locator('button', { hasText: "invité" });
        await expect(guestButton).toBeVisible();
        await guestButton.click();

        // Wait for navigation away from login
        // Success = URL is NOT login
        await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });

        // Ideally check for feed
        // await expect(page).toHaveURL(/\/feed/); 
    });
});
