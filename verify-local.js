
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Local Verification...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🔗 Navigating to http://localhost:5000/feed');
    await page.goto('http://localhost:5000/feed', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Handle redirect to login if it happens locally
    await page.waitForTimeout(3000);
    if (page.url().includes('/login')) {
      console.log('⚠️ At login page. Clicking Guest Mode...');
      const guestButton = page.locator('text=Continuer en tant qu\'invité').or(page.locator('button:has-text("invité")'));
      await guestButton.click();
      await page.waitForURL('**/feed', { timeout: 10000 });
    }

    console.log('⏳ Waiting 5s for posts to render...');
    await page.waitForTimeout(5000);

    const bodyText = await page.innerText('body');
    const hasPosts = bodyText.includes('Bienvenue') || bodyText.includes('Montreal') || bodyText.includes('Poutine');
    
    console.log('\n--- RESULTS ---');
    console.log(`Final URL: ${page.url()}`);
    console.log(`Local Posts Detected: ${hasPosts}`);
    
    if (hasPosts) {
      console.log('✅ SUCCESS: Local feed is working!');
    } else {
      console.log('❌ FAIL: Local feed is empty. This is expected if the DB is still failing.');
      console.log('Body Text Snippet:', bodyText.substring(0, 1000));
    }

    await page.screenshot({ path: 'local_verify.png' });
    console.log('📸 Screenshot saved as local_verify.png');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await browser.close();
    console.log('🏁 Verification complete.');
  }
})();
