import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { validatePostType } from "../shared/utils/validatePostType";
import { PexelsService } from "../backend/services/pexels-service";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Search queries for diverse content
const SEARCH_QUERIES = [
  "montreal city",
  "urban life",
  "nature",
  "dance",
  "street art",
  "food",
  "sunset",
  "people",
];

interface VideoData {
  caption: string;
  media_url: string;
  type: string;
  reactions_count: number;
  hive_id: string;
  user_id: string;
  content: string;
  processing_status: string;
  thumbnail_url?: string;
  duration?: number;
  aspect_ratio?: string;
}

/**
 * Extract the best HD portrait video file from Pexels video
 */
function getBestPortraitVideo(videoFiles: any[]): any | null {
  // Filter for portrait videos (height > width)
  const portraitVideos = videoFiles.filter(
    (file) => file.height > file.width && file.file_type === "video/mp4",
  );

  if (portraitVideos.length === 0) {
    return null;
  }

  // Prefer HD quality (720p or 1080p)
  const hdVideo =
    portraitVideos.find((v) => v.quality === "hd" && v.height >= 720) ||
    portraitVideos.find((v) => v.height >= 720) ||
    portraitVideos[0];

  return hdVideo;
}

/**
 * Calculate aspect ratio from width and height
 */
function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

async function seedStock() {
  console.log("🚀 Fetching professional stock videos from Pexels...");

  const videosToInsert: VideoData[] = [];
  const targetCount = 20;

  try {
    // Fetch videos from multiple search queries
    for (const query of SEARCH_QUERIES) {
      if (videosToInsert.length >= targetCount) {
        break;
      }

      console.log(`🔍 Searching for: "${query}"...`);

      try {
        const response = await PexelsService.searchVideos(query, 5, 1);

        for (const video of response.videos) {
          if (videosToInsert.length >= targetCount) {
            break;
          }

          // Get the best portrait video file
          const portraitFile = getBestPortraitVideo(video.video_files);

          if (!portraitFile) {
            console.log(
              `⏭️  Skipping video ${video.id} - no portrait version available`,
            );
            continue;
          }

          // Calculate aspect ratio
          const aspectRatio = calculateAspectRatio(
            portraitFile.width,
            portraitFile.height,
          );

          // Create video data
          const videoData: VideoData = {
            caption: `${query} #Zyeute #Quebec`,
            media_url: portraitFile.link,
            type: "video",
            reactions_count: Math.floor(Math.random() * 500) + 100,
            hive_id: "quebec",
            user_id: "27e6a0ec-4b73-45d7-b391-9e831a210524",
            content: `${query} #Zyeute #Quebec`,
            processing_status: "completed", // Mark as completed so it plays immediately
            thumbnail_url: video.image,
            duration: Math.round(video.duration),
            aspect_ratio: aspectRatio,
          };

          videosToInsert.push(videoData);
          console.log(
            `✅ Added: ${query} (${portraitFile.width}x${portraitFile.height}, ${aspectRatio})`,
          );
        }
      } catch (error) {
        console.error(`❌ Error searching for "${query}":`, error);
      }
    }

    console.log(
      `\n📦 Inserting ${videosToInsert.length} videos into database...`,
    );

    // Insert all videos
    for (const video of videosToInsert) {
      // Validate type before insert
      const validatedType = validatePostType(
        video.media_url,
        video.type as "video" | "photo",
      );

      if (validatedType !== video.type) {
        console.warn(
          `🛡️ Type corrected: "${video.type}" → "${validatedType}" for ${video.caption.substring(0, 30)}...`,
        );
      }

      const { data, error } = await supabase
        .from("publications")
        .insert([{ ...video, type: validatedType }])
        .select();

      if (error) {
        console.error(`❌ Error inserting video: ${error.message}`);
      } else {
        console.log(
          `✅ Inserted: ${data[0].id} - ${video.caption.substring(0, 40)}...`,
        );
      }
    }

    console.log("\n✨ Stock video injection complete!");
    console.log(`📊 Total videos inserted: ${videosToInsert.length}`);
  } catch (error) {
    console.error("❌ Fatal error during video injection:", error);
    process.exit(1);
  }
}

seedStock();
