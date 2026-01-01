
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Backend Verification...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const urls = [
      'https://zyeute-api.railway.app/api/health',
      'https://zyeute-api.railway.app/api/feed'
    ];

    for (const url of urls) {
      console.log(`📍 Fetching ${url}`);
      await page.goto(url, { waitUntil: 'networkidle' });
      const content = await page.innerText('body');
      console.log(`Response Snippet: ${content.substring(0, 500)}`);
      console.log('---');
    }

  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await browser.close();
    console.log('🏁 Verification complete.');
  }
})();
