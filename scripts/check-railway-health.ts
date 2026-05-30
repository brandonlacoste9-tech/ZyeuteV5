#!/usr/bin/env tsx
/**
 * Check Railway Health Endpoint
 *
 * Tests the Railway backend health endpoint to diagnose issues
 */

const RAILWAY_URL =
  process.env.RAILWAY_URL || "https://zyeutev5-production.up.railway.app";

async function checkHealth() {
  console.log("🔍 Checking Railway Backend Health...\n");
  console.log(`URL: ${RAILWAY_URL}\n`);

  const endpoints = ["/api/health", "/ready", "/api/health/feed"];

  for (const endpoint of endpoints) {
    const url = `${RAILWAY_URL}${endpoint}`;
    console.log(`Testing: ${endpoint}`);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Railway-Health-Check",
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      const data = await response
        .json()
        .catch(() => ({ error: "Invalid JSON" }));

      if (response.ok) {
        console.log(`   ✅ ${endpoint}: OK`);
        console.log(`      Status: ${data.status || "unknown"}`);
        if (data.message) {
          console.log(`      Message: ${data.message}`);
        }
      } else {
        console.log(`   ❌ ${endpoint}: ${response.status}`);
        console.log(`      Response:`, JSON.stringify(data, null, 2));
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log(`   ⏱️  ${endpoint}: Timeout (10s)`);
      } else if (
        error.code === "ECONNREFUSED" ||
        error.message.includes("fetch failed")
      ) {
        console.log(
          `   🔴 ${endpoint}: Connection refused (backend not running)`,
        );
      } else {
        console.log(`   ❌ ${endpoint}: ${error.message}`);
      }
    }
    console.log("");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💡 If all endpoints fail:");
  console.log("   1. Check Railway logs: railway logs");
  console.log("   2. Verify DATABASE_URL is set in Railway");
  console.log("   3. Check backend startup errors in logs");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

checkHealth();
