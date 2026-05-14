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

async function fixDb() {
  console.log("Fetching all publications with proxy in media_url...");
  
  const { data, error } = await supabase
    .from("publications")
    .select("id, media_url")
    .like("media_url", "%/api/media-proxy%api.apify.com%");

  if (error) {
    console.error("Fetch failed:", error);
    return;
  }

  console.log(`Found ${data.length} videos to fix.`);

  for (const post of data) {
    const mediaUrl = post.media_url;
    // Extract the encoded URL
    const match = mediaUrl.match(/url=(.*)/);
    if (match && match[1]) {
      const rawUrl = decodeURIComponent(match[1]);
      console.log(`Fixing ${post.id}: -> ${rawUrl.substring(0, 50)}...`);
      await supabase
        .from("publications")
        .update({ media_url: rawUrl })
        .eq("id", post.id);
    }
  }

  console.log("Fix complete!");
}

fixDb();
