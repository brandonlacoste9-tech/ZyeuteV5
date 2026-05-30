#!/usr/bin/env tsx
/**
 * Wake Up Max 🐝
 *
 * Quick script to wake Max (WhatsApp Production Manager) and test connection
 *
 * Usage:
 *   tsx scripts/wake-max.ts
 */

import "dotenv/config";

const MAX_API_URL =
  process.env.MAX_API_URL ||
  process.env.VITE_COLONY_API_URL ||
  `http://localhost:${process.env.PORT || 3000}`;
const MAX_API_TOKEN =
  process.env.MAX_API_TOKEN || "test-token-change-in-production";

async function wakeMax() {
  console.log("🐝 Waking up Max...\n");
  console.log(`📡 API URL: ${MAX_API_URL}`);
  console.log(`🔑 Token: ${MAX_API_TOKEN.substring(0, 10)}...\n`);

  try {
    const response = await fetch(`${MAX_API_URL}/api/max/status`, {
      method: "GET",
      headers: {
        Authorization: MAX_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Max is AWAKE and responding!\n");
      console.log("📊 System Status:");
      console.log(`   System: ${data.system || "Unknown"}`);
      console.log(`   Status: ${data.status || "Unknown"}`);
      console.log(`   Timestamp: ${data.timestamp || "Unknown"}\n`);

      if (data.components) {
        console.log("🔧 Components:");
        Object.entries(data.components).forEach(([key, value]) => {
          const status =
            value === "online" ? "🟢" : value === "offline" ? "🔴" : "🟡";
          console.log(`   ${status} ${key}: ${value}`);
        });
      }

      console.log("\n💬 Max is ready for commands!");
      console.log("   Send WhatsApp message to: +15143481161");
      console.log("   Try: 'status', 'verify:gcs', 'scan the hive'\n");
    } else {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));

      if (response.status === 401) {
        console.log("❌ Max is sleeping (Unauthorized)");
        console.log("\n💡 Set MAX_API_TOKEN in .env:");
        console.log("   MAX_API_TOKEN=your-secret-token-here\n");
      } else if (response.status === 503) {
        console.log("❌ Max API not configured");
        console.log(
          "\n💡 Set MAX_API_TOKEN in backend environment variables\n",
        );
      } else {
        console.log(`❌ Max responded with error: ${response.status}`);
        console.log(`   ${error.error || error.message || "Unknown error"}\n`);
      }
    }
  } catch (error: any) {
    console.error("❌ Cannot reach Max:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Is backend running? (npm run dev)");
    console.log("   2. Check MAX_API_URL is correct");
    console.log("   3. Verify backend is listening on the correct port\n");
  }
}

wakeMax();
