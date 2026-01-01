
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Production Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📍 Navigating to https://www.zyeute.com/feed');
    await page.goto('https://www.zyeute.com/feed', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    if (page.url().includes('/login')) {
      console.log('⚠️ Redirected to login. Attempting "Continuer en tant qu\'invité"...');
      await page.click('text=Continuer en tant qu\'invité');
      await page.waitForTimeout(5000);
    }

    // Wait for content
    console.log('⏳ Waiting for content to load...');
    await page.waitForTimeout(5000); // Give it some time to render

    const content = await page.content();
    
    const hasQuebecPost = content.includes('Bienvenue sur Zyeuté') || content.includes('Poutine');
    const hasEmptyState = content.includes('Aucun contenu') || content.includes('Empty');
    
    console.log('\n--- RESULTS ---');
    console.log(`URL: ${page.url()}`);
    console.log(`Has Quebec Posts: ${hasQuebecPost}`);
    console.log(`Has Empty State: ${hasEmptyState}`);
    
    if (hasQuebecPost) {
      console.log('✅ SUCCESS: Quebec posts found in the feed!');
    } else if (hasEmptyState) {
      console.log('❌ FAIL: Feed is empty.');
    } else {
      console.log('⚠️ UNKNOWN: Could not determine feed state. Content length:', content.length);
      // Log some snippet of the body
      const bodyText = await page.innerText('body');
      console.log('Body Text Snippet:', bodyText.substring(0, 500));
    }

    // Take a screenshot for the logs
    await page.screenshot({ path: 'prod_feed_verify.png' });
    console.log('📸 Screenshot saved as prod_feed_verify.png');

  } catch (err) {
    console.error('❌ ERROR during verification:', err.message);
  } finally {
    await browser.close();
    console.log('🏁 Verification complete.');
  }
})();
