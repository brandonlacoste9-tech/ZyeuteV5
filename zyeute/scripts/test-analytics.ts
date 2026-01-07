#!/usr/bin/env tsx
/**
 * Zyeuté Analytics Test Script
 * Verifies that Supabase connection works and analytics views are available.
 *
 * Run from the `zyeute` directory with:
 *   npx tsx scripts/test-analytics.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnalytics() {
  console.log("📊 Checking Zyeuté Analytics Views...\n");

  // 1. Basic connection & schema check
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, media_metadata")
    .limit(1);

  if (postsError) {
    console.error("❌ Database connection or schema check failed:");
    console.error(`   ${postsError.message}`);
    return;
  }

  console.log(
    "✅ Connected to Supabase. 'posts' table and 'media_metadata' column are accessible.",
  );

  // 2. Vibe distribution
  const { data: vibes, error: vibeError } = await supabase
    .from("view_vibe_distribution")
    .select("*");

  if (vibeError) {
    console.error("❌ Error reading 'view_vibe_distribution':");
    console.error(`   ${vibeError.message}`);
    console.error(
      "   (Did you run the SQL to create the analytics views in Supabase?)",
    );
  } else {
    console.log("\n--- Colony Vibe Distribution ---");
    if (vibes && vibes.length > 0) {
      console.table(vibes);
    } else {
      console.log(
        "   (No data yet – upload some videos to populate this view!)",
      );
    }
  }

  // 3. Trending tags (last 7 days)
  const { data: tags, error: tagError } = await supabase
    .from("view_tag_popularity_7d")
    .select("*")
    .limit(5);

  if (tagError) {
    console.error("\n❌ Error reading 'view_tag_popularity_7d':");
    console.error(`   ${tagError.message}`);
  } else {
    console.log("\n--- Trending Tags (Last 7 Days) ---");
    if (tags && tags.length > 0) {
      console.table(tags);
    } else {
      console.log(
        "   (No tags found yet – AI metadata will fill this as users upload.)",
      );
    }
  }
}

checkAnalytics().catch((err) => {
  console.error("❌ Unexpected error in test-analytics script:", err);
  process.exit(1);
});
