import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

if (!PEXELS_API_KEY) {
  console.error("❌ PEXELS_API_KEY missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Search terms for Zyeute video content - portrait orientation for mobile feed
const VIDEO_QUERIES = [
  "montreal city",
  "nature portrait", 
  "urban night",
  "dance",
  "city life",
  "travel",
  "fashion",
  "cyberpunk",
];

interface PexelsVideoFile {
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsVideoFile[];
  video_pictures: { id: number; picture: string; nr: number }[];
}

function getBestPortraitVideo(videoFiles: PexelsVideoFile[]): string | null {
  // Filter for portrait videos (height > width)
  const portraitVideos = videoFiles.filter(
    (f) => f.height > f.width && f.file_type === "video/mp4"
  );

  if (portraitVideos.length === 0) {
    // Fallback: return any HD video
    const hdVideo = videoFiles.find(
      (f) => f.quality === "hd" && f.file_type === "video/mp4"
    );
    return hdVideo?.link || null;
  }

  // Sort by height (descending) and pick the best quality portrait
  portraitVideos.sort((a, b) => b.height - a.height);
  return portraitVideos[0].link;
}

async function seedPexelsVideos() {
  console.log("🎬 Fetching Pexels Videos for Zyeuté feed...");
  let insertedCount = 0;

  try {
    for (const query of VIDEO_QUERIES) {
      console.log(`🔎 Searching Pexels Videos: "${query}"`);

      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(
          query
        )}&per_page=2&orientation=portrait`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.error(`❌ Pexels API Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data: any = await response.json();

      if (!data.videos || data.videos.length === 0) {
        console.log(`⚠️ No videos found for: ${query}`);
        continue;
      }

      for (const video of data.videos as PexelsVideo[]) {
        const videoUrl = getBestPortraitVideo(video.video_files);

        if (!videoUrl) {
          console.log(`⚠️ No suitable MP4 found for video ${video.id}`);
          continue;
        }

        // ✅ Minimal post with only essential columns
        const newPost = {
          caption: `${query} 🎬 #Video #${query.replace(/\s+/g, "")}`,
          media_url: videoUrl,
          type: "video",
          hive_id: "quebec",
          user_id: "27e6a0ec-4b73-45d7-b391-9e831a210524",
          content: `${query} 🎬 #Video #${query.replace(/\s+/g, "")}`,
        };

        const { data: inserted, error } = await supabase
          .from("publications")
          .insert([newPost])
          .select();

        if (error) {
          console.error(`❌ DB Error: ${error.message}`);
        } else {
          console.log(`✅ Inserted video ${inserted[0].id} → ${videoUrl.substring(0, 60)}...`);
          insertedCount++;
        }
      }
    }

    console.log(`\n✨ Done! Inserted ${insertedCount} videos into the feed.`);
    console.log("🔄 Refresh your app to see the videos playing!");
  } catch (err) {
    console.error("❌ Script failed:", err);
    process.exit(1);
  }
}

seedPexelsVideos();
