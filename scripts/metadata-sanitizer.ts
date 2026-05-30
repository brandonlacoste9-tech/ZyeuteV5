import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sanitizeMetadata() {
  console.log("🧼 Starting Video Metadata Sanitization...");

  const { data: videos, error } = await supabase
    .from("publications")
    .select("id, media_url, aspect_ratio, duration")
    .eq("type", "video");

  if (error) {
    console.error("❌ Error fetching videos:", error);
    return;
  }

  console.log(`📊 Found ${videos.length} videos to verify.`);

  let updatedCount = 0;

  for (const video of videos as {
    id: string;
    aspect_ratio?: string;
    duration?: number;
  }[]) {
    let needsUpdate = false;
    const updates: Record<string, string | number> = {};

    // 1. Aspect Ratio Heuristic
    if (!video.aspect_ratio) {
      // Default to portrait for Social Feed if unknown
      updates.aspect_ratio = "9:16";
      needsUpdate = true;
    }

    // 2. Duration Heuristic
    if (!video.duration || video.duration <= 0) {
      // Default to 15s for landing/social clips if missing
      updates.duration = 15;
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from("publications")
        .update(updates)
        .eq("id", video.id);

      if (updateError) {
        console.error(`❌ Failed to update ${video.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`✅ Sanitization complete. ${updatedCount} videos updated.`);
}

sanitizeMetadata();
