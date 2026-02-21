import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { validatePostType } from "../shared/utils/validatePostType";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS_API_KEY =
  process.env.PEXELS_API_KEY ||
  "2iANaoqJBF6j0AKJU6Kr67F7xujOMNvFVBeZNK4CaoXQiEezLaxdOpNV";

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing");
  console.error(
    "   Add it to .env: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Quebec-themed video search queries
const SEARCH_QUERIES = [
  "montreal city",
  "nature forest",
  "urban night",
  "dance portrait",
  "city life",
];

// Guest user ID for seeded content
const GUEST_USER_ID = "27e6a0ec-4b73-45d7-b391-9e831a210524";

async function seedPexelsVideos() {
  console.log("🎬 Fetching Pexels Videos for Zyeuté feed...");
  let inserted = 0;

  for (const query of SEARCH_QUERIES) {
    console.log(`🔎 Searching Pexels Videos: "${query}"`);

    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3&orientation=portrait`,
      { headers: { Authorization: PEXELS_API_KEY } },
    );

    if (!response.ok) {
      console.error(`❌ Pexels API error for "${query}": ${response.statusText}`);
      continue;
    }

    const data: any = await response.json();

    if (!data.videos || data.videos.length === 0) {
      console.warn(`⚠️  No videos found for: ${query}`);
      continue;
    }

    for (const video of data.videos) {
      // Pick the HD file, or fall back to the highest quality available
      const files: any[] = video.video_files || [];
      const hd =
        files.find((f: any) => f.quality === "hd" && f.width <= 1080) ||
        files.find((f: any) => f.quality === "hd") ||
        files[0];

      if (!hd?.link) {
        console.warn(`  ⚠️  No usable file for video ${video.id}`);
        continue;
      }

      const mediaUrl: string = hd.link;
      const thumbnail: string =
        video.image || video.video_pictures?.[0]?.picture || "";

      const validatedType = validatePostType(mediaUrl, "video");

      const post = {
        caption: `${video.user?.name || query} 🎬 #Zyeute #${query.replace(/\s+/g, "")}`,
        content: `${video.user?.name || query} 🎬 #Zyeute #${query.replace(/\s+/g, "")}`,
        media_url: mediaUrl,
        thumbnail_url: thumbnail || null,
        type: validatedType,
        hive_id: "quebec",
        user_id: GUEST_USER_ID,
        processing_status: "completed",
      };

      const { data: inserted_row, error } = await supabase
        .from("publications")
        .insert([post])
        .select();

      if (error) {
        console.error(`  ❌ DB error: ${error.message}`);
      } else {
        console.log(
          `  ✅ Inserted video ${inserted_row[0].id} — ${mediaUrl.substring(0, 60)}...`,
        );
        inserted++;
      }
    }
  }

  console.log(`\n✨ Done! Inserted ${inserted} videos into the feed.`);
}

seedPexelsVideos().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
