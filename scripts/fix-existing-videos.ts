import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateExistingVideos() {
  console.log("Updating existing Pexels videos with missing columns...");
  
  // Get all videos with pending status
  const { data: videos, error } = await supabase
    .from("publications")
    .select("*")
    .eq("type", "video")
    .eq("processing_status", "pending");
    
  if (error) {
    console.error("Error fetching videos:", error);
    return;
  }
  
  console.log(`Found ${videos?.length || 0} pending videos`);
  
  // Update each video with estimated values
  for (const video of videos || []) {
    // Extract video ID from Pexels URL to get thumbnail
    const mediaUrl = video.media_url || "";
    const match = mediaUrl.match(/video-files\/(\d+)/);
    const videoId = match ? match[1] : null;
    
    const thumbnailUrl = videoId 
      ? `https://images.pexels.com/videos/${videoId}/pexels-photo-${videoId}.jpeg?auto=compress&cs=tinysrgb&w=640`
      : null;
    
    const updates = {
      processing_status: "completed",
      thumbnail_url: thumbnailUrl,
      duration: 15, // Estimated duration
      aspect_ratio: "9:16"
    };
    
    const { error: updateError } = await supabase
      .from("publications")
      .update(updates)
      .eq("id", video.id);
      
    if (updateError) {
      console.error(`Error updating ${video.id}:`, updateError.message);
    } else {
      console.log(`Updated ${video.id}: thumbnail=${!!thumbnailUrl}, status=completed`);
    }
  }
  
  console.log("Done!");
}

updateExistingVideos().catch(console.error);

