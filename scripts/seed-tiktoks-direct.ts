import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { join } from "path";
import fs from "fs";

dotenv.config({ path: join(process.cwd(), ".env.local") });

async function seedDirectly() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase configuration");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Read the JSON
  const data = JSON.parse(fs.readFileSync("real-tiktoks.json", "utf-8"));
  const videos = data.videos;

  console.log(`Read ${videos.length} videos. Preparing to insert...`);

  // We'll use the user ID we found earlier
  const userId = "9175f19b-5d49-4aa5-afba-c5dfa53e086d"; // known user from test

  let insertedCount = 0;
  for (const video of videos) {
    const { id, user_id, ...videoData } = video; // remove the randomly generated id, let db handle it (or use it if valid uuid, but safer to omit)
    
    // We'll use the id we generated, it is a valid UUID.
    
    const { error } = await supabase.from("publications").insert({
      id: id,
      user_id: userId, // override with valid user ID
      caption: video.caption,
      content: video.content,
      media_url: video.media_url,
      original_url: video.original_url,
      thumbnail_url: video.thumbnail_url,
      type: video.type,
      hive_id: video.hive_id,
      visibility: video.visibility,
      est_masque: video.est_masque,
      processing_status: video.processing_status,
      reactions_count: video.reactions_count,
      view_count: video.view_count,
      shares_count: video.shares_count,
      comments_count: video.comments_count,
      moderation_approved: video.moderation_approved,
      video_source: video.video_source
    });

    if (error) {
      console.error(`Failed to insert video: ${error.message}`);
    } else {
      insertedCount++;
    }
  }

  console.log(`Successfully inserted ${insertedCount} real TikTok videos!`);
}

seedDirectly();
