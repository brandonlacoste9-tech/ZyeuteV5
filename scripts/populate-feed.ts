#!/usr/bin/env tsx
/**
 * Populate Feed Script
 * Check feed status and provide instructions to populate it
 */

import { config } from "dotenv";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, "../.env") });

const API_URL =
  process.env.RAILWAY_URL ||
  process.env.VITE_API_URL ||
  "http://localhost:5000";

async function checkFeed() {
  console.log("🚀 Checking Zyeuté Feed Status...");
  console.log(`📍 API URL: ${API_URL}`);
  console.log("");

  try {
    // Check current feed count
    const feedResponse = await fetch(`${API_URL}/api/feed/infinite?limit=20`);

    if (!feedResponse.ok) {
      console.error(`❌ Feed API returned ${feedResponse.status}`);
      console.error("   Check if your backend is running");
      return;
    }

    const feedData = await feedResponse.json();
    const posts = feedData.posts || [];
    const currentCount = posts.length;

    console.log(`📊 Current feed count: ${currentCount} posts`);
    console.log("");

    if (posts.length > 0) {
      console.log("✅ Feed has content! Recent posts:");
      posts.slice(0, 5).forEach((post: any, i: number) => {
        console.log(
          `   ${i + 1}. ${post.type} - ${post.caption?.substring(0, 50) || "No caption"}...`,
        );
        console.log(
          `      User: ${post.user?.username || "Unknown"} | Visibility: ${post.visibility || "unknown"}`,
        );
      });
    } else {
      console.log("⚠️  Feed is empty!");
      console.log("");
      console.log("💡 To populate the feed:");
      console.log("");
      console.log("Option 1: Enable Auto-Generation (Recommended)");
      console.log("  1. Go to Railway Dashboard → Your Service → Variables");
      console.log("  2. Add: ENABLE_AUTO_GENERATION=true");
      console.log("  3. Redeploy (or restart)");
      console.log(
        "  4. Auto-generator will create Quebec-themed videos every 6 hours",
      );
      console.log("");
      console.log("Option 2: Use Seed Data");
      console.log("  Run: npm run db:seed");
      console.log("  This will add 15 Quebec-themed posts");
      console.log("");
      console.log("Option 3: Upload More Content");
      console.log("  Go to /studio/ai and create videos manually");
      console.log("  Or use the upload page to add videos");
    }

    console.log("");
    console.log(`📱 Check feed at: ${API_URL}/api/feed/infinite`);
  } catch (error: any) {
    console.error("❌ Error checking feed:", error.message);
    console.error("");
    console.error("💡 Make sure:");
    console.error("  1. Backend is running (check Railway logs)");
    console.error("  2. DATABASE_URL is set in Railway");
    console.error("  3. API URL is correct");
    process.exit(1);
  }
}

checkFeed();
