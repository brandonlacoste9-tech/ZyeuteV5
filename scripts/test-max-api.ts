#!/usr/bin/env tsx
/**
 * Test Max API Endpoints
 *
 * Simulates Max (WhatsApp) calling Zyeuté backend API
 *
 * Usage:
 *   tsx scripts/test-max-api.ts [--endpoint=STATUS] [--token=YOUR_TOKEN]
 *
 * Endpoints:
 *   - status (default)
 *   - verify-gcs
 *   - security-audit
 *   - verify-service-account
 *   - command (POST with command body)
 */

import "dotenv/config";

const MAX_API_URL =
  process.env.MAX_API_URL ||
  process.env.VITE_COLONY_API_URL ||
  `http://localhost:${process.env.PORT || 3000}`;
const MAX_API_TOKEN =
  process.argv.find((arg) => arg.startsWith("--token="))?.split("=")[1] ||
  process.env.MAX_API_TOKEN ||
  "test-token-change-in-production";

const ENDPOINT_ARG = process.argv.find((arg) => arg.startsWith("--endpoint="));
const ENDPOINT = ENDPOINT_ARG?.split("=")[1] || "status";

async function testMaxAPI() {
  console.log("📱 Testing Max API Connection...\n");
  console.log(`URL: ${MAX_API_URL}`);
  console.log(`Endpoint: /api/max/${ENDPOINT}`);
  console.log(`Token: ${MAX_API_TOKEN.substring(0, 10)}...\n`);

  const url = `${MAX_API_URL}/api/max/${ENDPOINT}`;
  const headers: Record<string, string> = {
    Authorization: MAX_API_TOKEN,
    "Content-Type": "application/json",
  };

  try {
    let response: Response;

    if (ENDPOINT === "command") {
      // POST request for command endpoint
      console.log("📤 Sending POST request with command...\n");
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          command: "verify:gcs",
        }),
      });
    } else {
      // GET request for other endpoints
      console.log("📤 Sending GET request...\n");
      response = await fetch(url, {
        method: "GET",
        headers,
      });
    }

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Max API Response:\n");
      console.log(JSON.stringify(data, null, 2));
      console.log("\n✅ Max is awake and responding!");
    } else {
      console.log("❌ Max API Error:");
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));

      if (response.status === 401) {
        console.log("\n💡 Authentication failed:");
        console.log("   Set MAX_API_TOKEN in .env or pass --token=YOUR_TOKEN");
      } else if (response.status === 503) {
        console.log("\n💡 Max API not configured:");
        console.log("   Set MAX_API_TOKEN in backend environment variables");
      }
    }
  } catch (error: any) {
    console.error("❌ Connection failed:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Is backend running? (npm run dev)");
    console.log("   2. Check MAX_API_URL is correct");
    console.log("   3. Verify MAX_API_TOKEN matches backend config");
  }
}

// Test all endpoints
async function testAllEndpoints() {
  const endpoints = [
    "status",
    "verify-gcs",
    "security-audit",
    "verify-service-account",
  ];

  console.log("📱 Testing All Max API Endpoints...\n");

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: /api/max/${endpoint}`);
    const url = `${MAX_API_URL}/api/max/${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: MAX_API_TOKEN,
    };

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (response.ok) {
        console.log(`   ✅ ${endpoint}: OK`);
        if (data.status) {
          console.log(`      Status: ${data.status}`);
        }
      } else {
        console.log(`   ❌ ${endpoint}: ${response.status}`);
        if (data.error) {
          console.log(`      Error: ${data.error}`);
        }
      }
    } catch (error: any) {
      console.log(`   ❌ ${endpoint}: Connection failed`);
    }
  }
}

if (ENDPOINT === "all") {
  testAllEndpoints();
} else {
  testMaxAPI();
}
