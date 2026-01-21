console.log("Script starting...");
import "dotenv/config";
import pg from "pg";

console.log("Imports done.");

const { Pool } = pg;
const pool = new Pool({
  connectionString:
    "postgresql://postgres:kHDQJHWAPzxpUXQlXIsKwXPamtQPnwiU@trolley.proxy.rlwy.net:44815/railway",
  ssl: { rejectUnauthorized: false },
});

async function testQuery() {
  console.log("Connecting to pool...");
  const client = await pool.connect();
  try {
    console.log("Running the crashing query...");
    const query = `
      select 
        "publications"."id", "publications"."user_id", "publications"."media_url", "publications"."original_url", 
        "publications"."enhanced_url", "publications"."processing_status", "publications"."media_metadata", 
        "publications"."mux_asset_id", "publications"."mux_upload_id", "publications"."promo_url", 
        "publications"."mux_playback_id", "publications"."thumbnail_url", "publications"."duration", 
        "publications"."aspect_ratio", "publications"."visual_filter", "publications"."enhance_started_at", 
        "publications"."enhance_finished_at", "publications"."content", "publications"."caption", 
        "publications"."visibility", "publications"."reactions_count", "publications"."comments_count", 
        "publications"."est_masque", "publications"."location", "publications"."city", "publications"."region", 
        "publications"."region_id", "publications"."embedding", "publications"."last_embedded_at", 
        "publications"."transcription", "publications"."transcribed_at", "publications"."ai_description", 
        "publications"."ai_labels", "publications"."content_fr", "publications"."content_en", 
        "publications"."hashtags", "publications"."detected_themes", "publications"."detected_items", 
        "publications"."ai_generated", "publications"."viral_score", "publications"."safety_flags", 
        "publications"."is_moderated", "publications"."moderation_approved", "publications"."moderation_score", 
        "publications"."moderated_at", "publications"."hive_id", "publications"."is_ephemeral", 
        "publications"."view_count", "publications"."max_views", "publications"."expires_at", 
        "publications"."burned_at", "publications"."deleted_at", "publications"."is_vaulted", 
        "publications"."created_at", 
        "user_profiles"."id", "user_profiles"."username", "user_profiles"."email", "user_profiles"."display_name", 
        "user_profiles"."bio", "user_profiles"."avatar_url", "user_profiles"."region", "user_profiles"."role", 
        "user_profiles"."custom_permissions", "user_profiles"."is_admin", "user_profiles"."is_premium", 
        "user_profiles"."plan", "user_profiles"."credits", "user_profiles"."piasse_balance", 
        "user_profiles"."total_karma", "user_profiles"."subscription_tier", "user_profiles"."location", 
        "user_profiles"."city", "user_profiles"."region_id", "user_profiles"."created_at", "user_profiles"."updated_at", 
        "user_profiles"."ti_guy_comments_enabled", "user_profiles"."hive_id", "user_profiles"."karma_credits", 
        "user_profiles"."cash_credits", "user_profiles"."total_gifts_sent", "user_profiles"."total_gifts_received", 
        "user_profiles"."legendary_badges", "user_profiles"."tax_id", "user_profiles"."bee_alias", 
        "user_profiles"."nectar_points", "user_profiles"."current_streak", "user_profiles"."max_streak", 
        "user_profiles"."last_daily_bonus", "user_profiles"."unlocked_hives", "user_profiles"."parent_id" 
      from "publications" 
      left join "user_profiles" on "publications"."user_id" = "user_profiles"."id" 
      where (("publications"."est_masque" = $1 or "publications"."est_masque" is null) and "publications"."visibility" = $2 and "publications"."hive_id" = $3) 
      order by "publications"."reactions_count" desc, "publications"."created_at" desc 
      limit $4
    `;
    const res = await client.query(query, [false, "public", "quebec", 10]);
    console.log(`✅ Query successful! Returned ${res.rows.length} rows.`);
  } catch (err) {
    console.error("❌ Query failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testQuery();
