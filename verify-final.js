
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Production Verification (Bot Style)...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🔗 Navigating to https://www.zyeute.com/feed');
    await page.goto('https://www.zyeute.com/feed', { waitUntil: 'domcontentloaded' });
    
    // Handle redirect to login
    await page.waitForTimeout(3000);
    if (page.url().includes('/login')) {
      console.log('⚠️ At login page. Clicking Guest Mode...');
      // Try multiple ways to find the guest button
      const guestButton = page.locator('text=Continuer en tant qu\'invité').or(page.locator('button:has-text("invité")'));
      await guestButton.click();
      console.log('⏳ Waiting for navigation back to feed...');
      await page.waitForURL('**/feed', { timeout: 10000 });
    }

    console.log('⏳ Waiting 5s for posts to render...');
    await page.waitForTimeout(5000);

    const bodyText = await page.innerText('body');
    const hasPosts = bodyText.includes('Bienvenue') || bodyText.includes('Montreal') || bodyText.includes('Poutine');
    
    console.log('\n--- RESULTS ---');
    console.log(`Final URL: ${page.url()}`);
    console.log(`Quebec Posts Detected: ${hasPosts}`);
    
    if (hasPosts) {
      console.log('✅ SUCCESS: Live feed is now populated!');
    } else {
      console.log('❌ FAIL: Live feed still appears empty for guests.');
      console.log('Body Text Snippet:', bodyText.substring(0, 1000));
    }

    await page.screenshot({ path: 'prod_verify_final.png' });
    console.log('📸 Screenshot saved as prod_verify_final.png');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await browser.close();
    console.log('🏁 Verification complete.');
  }
})();
