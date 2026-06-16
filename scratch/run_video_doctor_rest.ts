import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), ".env.local"), override: true });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const googleCdnVideos = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
];

async function checkSourceUrl(url: string) {
  try {
    if (url.startsWith("http")) {
      const response = await axios.head(url, { timeout: 5000 });
      return { ok: response.status >= 200 && response.status < 400 };
    }
    return { ok: true };
  } catch (error: any) {
    return { ok: false, status: error.response?.status };
  }
}

async function runVideoDoctorRest() {
  console.log("🏥 Running Video Doctor (REST mode)...");

  // Fetch all videos
  const { data: videos, error } = await supabase
    .from("publications")
    .select("id, type, media_url, thumbnail_url, processing_status, mux_playback_id")
    .eq("type", "video")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching videos:", error.message);
    return;
  }

  console.log(`🔍 Diagnosing ${videos.length} videos...\n`);

  let fixed = 0;
  let failed = 0;

  for (const video of videos) {
    if (!video.media_url && !video.mux_playback_id) {
      console.log(`❌ Video ${video.id}: No source url`);
      continue;
    }

    if (video.media_url) {
      if (video.media_url.includes("mixkit.co")) {
        console.log(`🚨 Video ${video.id}: Mixkit dead source detected.`);
        // Fix Mixkit dead source
        const newUrl = googleCdnVideos[Math.floor(Math.random() * googleCdnVideos.length)];
        const { error: updateError } = await supabase
          .from("publications")
          .update({ media_url: newUrl, original_url: newUrl })
          .eq("id", video.id);

        if (!updateError) {
          console.log(`   🔧 Fixed Mixkit source -> ${newUrl}`);
          fixed++;
        } else {
          console.log(`   ❌ Failed to fix Mixkit source`);
          failed++;
        }
        continue;
      }

      const check = await checkSourceUrl(video.media_url);
      if (!check.ok) {
        console.log(`🚨 Video ${video.id}: Bad source (${check.status || 'unknown'}) - ${video.media_url}`);
        
        if (check.status === 403 && !video.media_url.includes("/api/media-proxy")) {
          // Fix 403 with proxy
          const proxiedUrl = `/api/media-proxy?url=${encodeURIComponent(video.media_url)}`;
          const { error: updateError } = await supabase
            .from("publications")
            .update({ media_url: proxiedUrl })
            .eq("id", video.id);

          if (!updateError) {
            console.log(`   🔧 Fixed 403 with Proxy -> ${proxiedUrl}`);
            fixed++;
          } else {
            console.log(`   ❌ Failed to apply proxy fix`);
            failed++;
          }
        } else {
          failed++;
        }
      } else {
        // Healthy
      }
    }
  }

  console.log(`\n🎉 VideoDoctor Run Complete! Fixed: ${fixed}, Failed to fix: ${failed}`);
}

runVideoDoctorRest();
