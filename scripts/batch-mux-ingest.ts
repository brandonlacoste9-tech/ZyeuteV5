import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

if (!supabaseUrl || !supabaseKey || !muxTokenId || !muxTokenSecret) {
  console.error("❌ Missing required environment variables (Supabase or Mux)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const mux = new Mux({
  tokenId: muxTokenId,
  tokenSecret: muxTokenSecret,
});

async function batchMuxIngest() {
  console.log("🎬 Starting Phase 5: Batch Mux Ingestion...");

  // 1. Find videos that don't have a Mux Playback ID
  const { data: videos, error } = await supabase
    .from("publications")
    .select("id, media_url, caption")
    .eq("type", "video")
    .is("mux_playback_id", null)
    .limit(10); // Start with a small batch

  if (error) {
    console.error("❌ Error fetching videos:", error);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log(
      "✅ All videos already have Mux playback IDs or no videos found.",
    );
    return;
  }

  console.log(`📊 Found ${videos.length} videos to ingest into Mux.`);

  for (const video of videos) {
    console.log(
      `⏳ Ingesting video ${video.id} (${video.caption?.substring(0, 30)}...)`,
    );

    try {
      // 2. Create Mux Asset from URL
      const asset = await mux.video.assets.create({
        input: video.media_url,
        playback_policy: ["public"],
        // mp4_support: "standard", // Deprecated for basic assets
        passthrough: video.id, // Store our internal ID in Mux for tracking
      });

      console.log(`✅ Asset created! Asset ID: ${asset.id}`);

      // 3. Update database with asset ID and set status to processing
      const { error: updateError } = await supabase
        .from("publications")
        .update({
          mux_asset_id: asset.id,
          processing_status: "processing",
        })
        .eq("id", video.id);

      if (updateError) {
        console.error(
          `❌ Error updating DB for video ${video.id}:`,
          updateError,
        );
      }
    } catch (err: any) {
      console.error(`❌ Failed to ingest ${video.id}:`, err.message);
    }
  }

  console.log(
    "\n🚀 Batch ingestion triggered. Mux will process these and call our webhooks.",
  );
  console.log(
    "💡 Check your Mux dashboard or wait for 'video.asset.ready' webhooks.",
  );
}

batchMuxIngest();
