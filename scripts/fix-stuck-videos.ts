/**
 * 🏥 ZYEUTÉ VIDEO DOCTOR - Stuck Generation Recovery
 *
 * Objective: Identify and repair the 6 specific videos reported as broken or stuck
 * in the generation process for several weeks.
 *
 * This script uses direct SQL access via the DB pool to bypass ORM limitations
 * and force-update metadata, sync Mux states, or reset stuck processing statuses.
 *
 * Usage: npx tsx scripts/fix-stuck-videos.ts
 */

import 'dotenv/config';
import pg from 'pg';
import Mux from '@mux/mux-node';

const { Pool } = pg;

// 1. Configuration
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;
const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_NON_POOLING;

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL missing. Cannot connect to database.");
  process.exit(1);
}

// 2. Initialize Clients
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const mux = (MUX_TOKEN_ID && MUX_TOKEN_SECRET)
  ? new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET })
  : null;

async function repairStuckVideos() {
  console.log("====================================================");
  console.log("🏥 STARTING SURGICAL VIDEO REPAIR");
  console.log("====================================================");

  const client = await pool.connect();

  try {
    // Phase 1: Identify the "Stuck 6"
    // Looking for videos that are 'pending' or 'processing' but created more than 2 days ago
    console.log("🔍 Scanning for chronically stuck video generations...");
    const { rows: stuckVideos } = await client.query(`
      SELECT id, type, mux_asset_id, mux_playback_id, processing_status, media_url, created_at
      FROM publications
      WHERE type = 'video'
        AND (processing_status = 'pending' OR processing_status = 'processing' OR media_url IS NULL OR media_url = '')
        AND created_at < NOW() - INTERVAL '2 days'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`📊 Found ${stuckVideos.length} candidates for repair.\n`);

    if (stuckVideos.length === 0) {
      console.log("✅ No chronically stuck videos found with those criteria.");
      return;
    }

    for (const video of stuckVideos) {
      console.log(`🛠️ Processing Video [${video.id}] (Created: ${new Date(video.created_at).toLocaleDateString()})`);

      let fixed = false;

      // Scenario A: Mux Asset exists but DB is not updated
      if (video.mux_asset_id && mux) {
        console.log(`   📡 Syncing with Mux API for Asset ID: ${video.mux_asset_id}...`);
        try {
          const asset = await mux.video.assets.retrieve(video.mux_asset_id);

          if (asset.status === 'ready' && asset.playback_ids?.[0]?.id) {
            const playbackId = asset.playback_ids[0].id;
            const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
            const thumbUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

            await client.query(`
              UPDATE publications
              SET mux_playback_id = $1,
                  media_url = $2,
                  hls_url = $2,
                  thumbnail_url = $3,
                  processing_status = 'completed',
                  updated_at = NOW()
              WHERE id = $4
            `, [playbackId, hlsUrl, thumbUrl, video.id]);

            console.log(`   ✅ SUCCESS: Restored from Mux! Playback ID: ${playbackId}`);
            fixed = true;
          } else if (asset.status === 'errored') {
            console.log(`   ❌ Mux reports asset error: ${asset.errors?.messages?.join(', ')}`);
            await client.query("UPDATE publications SET processing_status = 'failed' WHERE id = $1", [video.id]);
          } else {
            console.log(`   ⏳ Mux status is still: ${asset.status}.`);
          }
        } catch (e: any) {
          console.error(`   ❌ Mux API check failed: ${e.message}`);
        }
      }

      // Scenario B: Video has a media_url but is stuck in 'processing' status
      if (!fixed && video.media_url && video.processing_status !== 'completed') {
        console.log(`   🤔 Video has URL but status is '${video.processing_status}'. Verifying URL...`);
        try {
          const res = await fetch(video.media_url, { method: 'HEAD' });
          if (res.ok) {
            console.log(`   ✅ URL is reachable. Force-completing status.`);
            await client.query(`
              UPDATE publications
              SET processing_status = 'completed',
                  updated_at = NOW()
              WHERE id = $1
            `, [video.id]);
            fixed = true;
          } else {
            console.log(`   ❌ URL returned status ${res.status}. Broken link.`);
          }
        } catch (e) {
          console.log("   ❌ Link unreachable.");
        }
      }

      // Scenario C: Completely dead generation
      if (!fixed) {
        console.log(`   💀 No recovery path found. Marking as failed to allow retry or cleanup.`);
        await client.query(`
          UPDATE publications
          SET processing_status = 'failed',
              updated_at = NOW()
          WHERE id = $1
        `, [video.id]);
      }

      console.log(""); // Spacer
    }

    // Phase 2: Fix any existing posts that have a Playback ID but are showing black screen
    // Often happens if media_url points to a dead MP4 instead of the HLS stream
    console.log("🔍 Checking for HLS/Media URL mismatches...");
    const { rowCount: updatedMismatches } = await client.query(`
      UPDATE publications
      SET media_url = hls_url,
          updated_at = NOW()
      WHERE type = 'video'
        AND hls_url IS NOT NULL
        AND media_url != hls_url
        AND media_url NOT LIKE '%stream.mux.com%'
    `);

    if (updatedMismatches > 0) {
      console.log(`✅ Corrected ${updatedMismatches} media_url mismatches to use HLS.`);
    }

  } catch (err) {
    console.error("❌ FATAL: Script failed:", err);
  } finally {
    client.release();
    await pool.end();
    console.log("====================================================");
    console.log("🏁 REPAIR SESSION COMPLETE");
    console.log("====================================================");
  }
}

repairStuckVideos().catch(console.error);
