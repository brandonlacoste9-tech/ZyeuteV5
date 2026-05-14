import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../.env") });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanup() {
  console.log("Cleaning up broken Apify imports...");
  // We'll delete all publications where media_url contains tiktok.com since those are html pages,
  // or where media_metadata->>source is 'apify-scrape'
  const { data, error } = await supabase
    .from("publications")
    .delete()
    .eq("video_source", "tiktok")
    .like("media_url", "%tiktok.com%");

  if (error) {
    console.error("Cleanup failed:", error);
  } else {
    console.log("Cleanup complete!");
  }
}

cleanup();
