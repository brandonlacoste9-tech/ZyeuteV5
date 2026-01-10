/**
 * Sunday Staging Drill
 * Tests all three components of the Piasse Economy
 * Pass = 3/3 tests successful
 */

const fetch = require('node-fetch');

const API_BASE = process.env.API_BASE || "http://localhost:8080";
const TEST_USER_ID = process.env.TEST_USER_ID || "00000000-0000-0000-0000-000000000001";

let testResults = {
  wallet: { passed: false, error: null },
  jackpot: { passed: false, error: null },
  trading: { passed: false, error: null },
};

async function testWallet() {
  console.log("\n🔐 TEST 1: Piasse Wallet System");
  try {
    // Test wallet creation
    const createRes = await fetch(`${API_BASE}/api/economy/wallet/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`,
      },
      body: JSON.stringify({ userId: TEST_USER_ID }),
    });

    if (!createRes.ok && createRes.status !== 400) {
      throw new Error(`Wallet creation failed: ${createRes.status} ${createRes.statusText}`);
    }

    // Test wallet retrieval
    const getRes = await fetch(`${API_BASE}/api/economy/wallet`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`,
      },
    });

    if (!getRes.ok) {
      throw new Error(`Wallet retrieval failed: ${getRes.status}`);
    }

    const wallet = await getRes.json();
    console.log(`   ✅ Wallet Address: ${wallet.wallet?.publicAddress || 'N/A'}`);
    console.log(`   ✅ Balance: ${wallet.wallet?.balance || 0} Piasses`);
    
    testResults.wallet.passed = true;
    console.log("   ✅ TEST 1 PASSED\n");
  } catch (error) {
    testResults.wallet.error = error.message;
    console.log(`   ❌ TEST 1 FAILED: ${error.message}\n`);
  }
}

async function testJackpot() {
  console.log("🎰 TEST 2: Jackpot System");
  try {
    // Test jackpot status
    const statusRes = await fetch(`${API_BASE}/api/economy/jackpot/status`);
    
    if (!statusRes.ok) {
      throw new Error(`Jackpot status failed: ${statusRes.status}`);
    }

    const status = await statusRes.json();
    console.log(`   ✅ Current Pool: ${status.jackpot?.name || 'None'}`);
    console.log(`   ✅ Current Amount: ${status.jackpot?.currentAmount || 0} Piasses`);
    console.log(`   ✅ Target Amount: ${status.jackpot?.targetAmount || 0} Piasses`);
    console.log(`   ✅ Progress: ${status.jackpot?.progress?.toFixed(2) || 0}%`);
    
    testResults.jackpot.passed = true;
    console.log("   ✅ TEST 2 PASSED\n");
  } catch (error) {
    testResults.jackpot.error = error.message;
    console.log(`   ❌ TEST 2 FAILED: ${error.message}\n`);
  }
}

async function testTrading() {
  console.log("🐝 TEST 3: Bee Trading System");
  try {
    // Test active listings
    const listingsRes = await fetch(`${API_BASE}/api/economy/bees/listings`);
    
    if (!listingsRes.ok) {
      throw new Error(`Listings retrieval failed: ${listingsRes.status}`);
    }

    const listings = await listingsRes.json();
    console.log(`   ✅ Active Listings: ${listings.listings?.length || 0}`);
    
    if (listings.listings && listings.listings.length > 0) {
      const firstListing = listings.listings[0];
      console.log(`   ✅ Sample Listing: ${firstListing.marketplace?.beeName || 'N/A'} - ${firstListing.listingPrice || 0} Piasses`);
    }
    
    testResults.trading.passed = true;
    console.log("   ✅ TEST 3 PASSED\n");
  } catch (error) {
    testResults.trading.error = error.message;
    console.log(`   ❌ TEST 3 FAILED: ${error.message}\n`);
  }
}

async function runSundayDrill() {
  console.log("💰 SUNDAY STAGING DRILL");
  console.log("=" .repeat(50));
  console.log(`API Base: ${API_BASE}`);
  console.log(`Test User: ${TEST_USER_ID}`);
  console.log("=" .repeat(50));

  await testWallet();
  await testJackpot();
  await testTrading();

  // Final Summary
  console.log("=" .repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log("=" .repeat(50));
  
  const passed = Object.values(testResults).filter(r => r.passed).length;
  const total = Object.keys(testResults).length;

  Object.entries(testResults).forEach(([test, result]) => {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${test.toUpperCase()}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  console.log("=" .repeat(50));
  console.log(`RESULT: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED - READY FOR TUESDAY!");
    process.exit(0);
  } else {
    console.log("⚠️  SOME TESTS FAILED - REVIEW ERRORS ABOVE");
    process.exit(1);
  }
}

// Run the drill
runSundayDrill().catch(error => {
  console.error("❌ Drill failed with error:", error);
  process.exit(1);
});