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

async function purgeTemporaryVideos() {
  console.log("Fetching posts with pexels, apify, or fal.media URLs...");
  
  // Find pexels videos
  const { data: pexelsPosts } = await supabase
    .from("publications")
    .select("id, media_url")
    .ilike("media_url", "%pexels.com%");
    
  // Find old apify videos (non supabase)
  const { data: apifyPosts } = await supabase
    .from("publications")
    .select("id, media_url")
    .ilike("media_url", "%api.apify.com%");
    
  console.log(`Found ${pexelsPosts?.length || 0} Pexels posts.`);
  console.log(`Found ${apifyPosts?.length || 0} old Apify posts.`);
  
  const toDelete = [...(pexelsPosts || []), ...(apifyPosts || [])];
  
  if (toDelete.length > 0) {
    const ids = toDelete.map(p => p.id);
    console.log(`Deleting ${ids.length} broken/temporary posts...`);
    
    // Delete in chunks of 50
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const { error } = await supabase.from("publications").delete().in("id", chunk);
      if (error) console.error("Error deleting:", error.message);
    }
    console.log("Deleted broken posts.");
  } else {
    console.log("No broken posts found to delete.");
  }
}

purgeTemporaryVideos();
