/**
 * Zyeuté V5 - Video Playback Recovery & Diagnostic Script
 *
 * Objective: Verify that every video post in the database has a working Mux Playback ID.
 * If a post is missing its playback ID but has an asset ID, it attempts to recover it.
 * If a playback ID is broken (404/403), it attempts to refresh it from Mux.
 *
 * Usage: tsx scripts/fix-playback-ids.ts
 */

import 'dotenv/config';
import Mux from '@mux/mux-node';
import pg from 'pg';

const { Pool } = pg;

// 1. Configuration & Validation
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;
const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_NON_POOLING;

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error("❌ ERROR: MUX_TOKEN_ID or MUX_TOKEN_SECRET missing in environment.");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL missing in environment.");
  process.exit(1);
}

// 2. Initialize Clients
const mux = new Mux({
  tokenId: MUX_TOKEN_ID,
  tokenSecret: MUX_TOKEN_SECRET,
});

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runDiagnostic() {
  console.log("====================================================");
  console.log("🏥 ZYEUTÉ VIDEO DOCTOR - Playback Recovery");
  console.log("====================================================");

  const client = await pool.connect();
  let fixedCount = 0;
  let errorCount = 0;
  let healthyCount = 0;
  let totalProcessed = 0;

  try {
    // Fetch all video publications or posts with Mux associations
    console.log("📡 Querying publications table...");
    const { rows: posts } = await client.query(`
      SELECT id, type, mux_asset_id, mux_playback_id, hls_url, processing_status, media_url
      FROM publications
      WHERE type = 'video'
         OR mux_asset_id IS NOT NULL
         OR mux_playback_id IS NOT NULL
    `);

    console.log(`📊 Found ${posts.length} posts to verify.\n`);

    for (const post of posts) {
      totalProcessed++;
      const { id, mux_asset_id, mux_playback_id } = post;
      let needsFix = false;
      let reason = "";

      // Logic Check 1: Missing Playback ID but has Asset ID
      if (mux_asset_id && !mux_playback_id) {
        needsFix = true;
        reason = "Missing Playback ID (Asset ID exists)";
      }
      // Logic Check 2: Verify existing Playback ID via Mux Stream HEAD check
      else if (mux_playback_id) {
        const streamUrl = `https://stream.mux.com/${mux_playback_id}.m3u8`;
        try {
          const res = await fetch(streamUrl, { method: 'HEAD' });
          if (!res.ok) {
            needsFix = true;
            reason = `Broken Stream (HTTP ${res.status})`;
          }
        } catch (e) {
          needsFix = true;
          reason = "Stream Unreachable";
        }
      }
      // Logic Check 3: Video type but no Mux data at all
      else if (post.type === 'video' && !mux_asset_id && !post.media_url?.includes('pexels')) {
        console.warn(`   ⚠️ Post ${id}: Native video without Mux metadata. Skipping auto-fix.`);
        errorCount++;
        continue;
      }

      if (needsFix) {
        console.log(`🛠️  Fixing Post ${id}: ${reason}`);

        if (mux_asset_id) {
          try {
            // Retrieve latest state from Mux
            const asset = await mux.video.assets.retrieve(mux_asset_id);
            const activePlaybackId = asset.playback_ids?.[0]?.id;

            if (activePlaybackId) {
              const newHlsUrl = `https://stream.mux.com/${activePlaybackId}.m3u8`;
              const newThumbnailUrl = `https://image.mux.com/${activePlaybackId}/thumbnail.jpg`;

              // Update Database with verified IDs
              await client.query(`
                UPDATE publications
                SET mux_playback_id = $1,
                    hls_url = $2,
                    thumbnail_url = $3,
                    media_url = $2,
                    processing_status = 'completed',
                    updated_at = NOW()
                WHERE id = $4
              `, [activePlaybackId, newHlsUrl, newThumbnailUrl, id]);

              console.log(`   ✅ SUCCESS: Sync'd Playback ID ${activePlaybackId}`);
              fixedCount++;
            } else {
              console.warn(`   ⚠️ WARNING: Asset ${mux_asset_id} exists but has NO active playback IDs. Status: ${asset.status}`);
              errorCount++;
            }
          } catch (muxErr: any) {
            console.error(`   ❌ ERROR: Mux API failed for asset ${mux_asset_id}: ${muxErr.message}`);
            errorCount++;
          }
        } else {
          console.warn(`   ❌ CRITICAL: Post ${id} has broken playback but NO Asset ID to recover from.`);
          errorCount++;
        }
      } else {
        healthyCount++;
      }
    }

  } catch (err) {
    console.error("❌ FATAL: Script encountered an unexpected error:", err);
  } finally {
    client.release();
    await pool.end();
  }

  console.log("\n====================================================");
  console.log("🏁 DIAGNOSTIC COMPLETE");
  console.log(`Total Scanned:     ${totalProcessed}`);
  console.log(`Healthy/Verified:  ${healthyCount}`);
  console.log(`Successfully Fixed: ${fixedCount}`);
  console.log(`Unfixable/Errors:  ${errorCount}`);
  console.log("====================================================");
}

runDiagnostic().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
