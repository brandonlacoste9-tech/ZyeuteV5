#!/usr/bin/env tsx
/**
 * Check feed data in database
 */

import { config } from "dotenv";
import { join } from "path";

config({ path: join(__dirname, "../.env") });

async function main() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log("Checking feed data...\n");

  // Count total posts
  const { count: totalCount } = await supabase
    .from("publications")
    .select("*", { count: "exact", head: true });

  console.log(`Total posts: ${totalCount}`);

  // Count posts that should appear in feed
  const { count: visibleCount } = await supabase
    .from("publications")
    .select("*", { count: "exact", head: true })
    .eq("visibility", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .eq("hive_id", "quebec");

  console.log(`Visible posts: ${visibleCount}`);

  // Get sample posts
  const { data: posts, error } = await supabase
    .from("publications")
    .select(
      "id, caption, media_url, visibility, est_masque, deleted_at, hive_id, user_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("\nRecent posts:");
  posts?.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.caption?.substring(0, 40)}...`);
    console.log(`   Visibility: ${p.visibility}`);
    console.log(`   Hidden: ${p.est_masque}`);
    console.log(`   Deleted: ${p.deleted_at}`);
    console.log(`   Hive: ${p.hive_id}`);
    console.log(`   User: ${p.user_id}`);
    console.log(`   Media: ${p.media_url?.substring(0, 50)}...`);
  });
}

main().catch(console.error);
