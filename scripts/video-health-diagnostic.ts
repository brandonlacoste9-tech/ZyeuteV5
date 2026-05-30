import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideoHealth() {
  console.log("🏥 Video Doctor Diagnostic...");

  const { data: videos, error } = await supabase
    .from("publications")
    .select("id, media_url, caption, type")
    .eq("type", "video")
    .limit(20);

  if (error) {
    console.error("❌ Error fetching videos:", error.message);
    return;
  }

  console.log(`🔍 Checking ${videos.length} videos for CORS/403 issues...\n`);

  for (const video of videos) {
    if (!video.media_url) {
      console.log(`❌ Video ${video.id}: Missing media_url`);
      continue;
    }

    try {
      const response = await axios.head(video.media_url, { timeout: 5000 });
      console.log(
        `✅ Video ${video.id}: OK (${response.status}) - ${video.caption?.substring(0, 30)}`,
      );
    } catch (err: any) {
      const status = err.response?.status;
      console.log(
        `🚨 Video ${video.id}: FAILED (${status || err.code}) - ${video.media_url}`,
      );

      if (status === 403) {
        console.log(`   💡 Detected 403! VideoDoctor should apply proxy fix.`);
        // In a real scenario, we'd call the fixVideo function from the service
      }
    }
  }
}

checkVideoHealth();
