
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Local API Verification...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const url = 'http://localhost:5000/api/feed';
    console.log(`📍 Fetching ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const content = await page.innerText('body');
    console.log(`Response Snippet: ${content.substring(0, 1000)}`);
    
    try {
      const json = JSON.parse(content);
      console.log(`✅ SUCCESS: Valid JSON. Posts count: ${json.posts?.length || 0}`);
    } catch (e) {
      console.log('❌ FAIL: Response is not valid JSON.');
    }

  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await browser.close();
    console.log('🏁 Verification complete.');
  }
})();
