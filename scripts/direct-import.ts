import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAuthorUserId() {
  const { data: bot } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "ti_guy_bot")
    .single();
  if (bot) return bot.id;

  const { data: fallback } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(1)
    .single();
  
  return fallback?.id || null;
}

async function run() {
  console.log("🎬 Direct Import: @ivedeals2 Video");
  console.log("===============================");

  const userId = await getAuthorUserId();
  if (!userId) {
    console.error("❌ No user profile found.");
    return;
  }

  const videoData = {
    video_id: "7596185989073177887",
    handle: "ivedeals2",
    caption: `I don't have time to hate someone while I'm building myself up. #inspiration #motivation`,
    media_url: "https://v16-webapp.tiktok.com/6511fc7642e896b67a3f2b831b2e8f07/69b65e00/video/tos/no1a/tos-no1a-v-0037-no/b7dced00c50e46728b40d9d91c326fbc/?a=1988&bti=ODszNWYuMDE6&ch=0&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C&cv=1&br=23492&bt=11746&cs=0&ds=4&ft=-ElcommjPD12N6OENd-UxGw5VY6e3wv25rcAp&mime_type=video_mp4&qs=13&rc=M2xzZHA5cmk0OTMzbzczNUBpM2xzZHA5cmk0OTMzbzczNUBfcnNmMmRjYmRhLS1kMTFzYSNfcnNmMmRjYmRhLS1kMTFzcw%3D%3D&l=202603131521183B19494EBA5AC966ED39&btag=e00078000"
  };

  console.log(`📥 Injecting: ${videoData.handle} - ${videoData.caption.substring(0, 40)}...`);

  const { data, error: insertError } = await supabase
    .from("publications")
    .insert({
      user_id: userId,
      media_url: videoData.media_url,
      thumbnail_url: "",
      caption: videoData.caption,
      content: videoData.caption,
      visibility: "public",
      hive_id: "quebec",
      processing_status: "completed",
      media_metadata: {
        tiktok_id: videoData.video_id,
        author: videoData.handle,
        source: "direct-scrape"
      }
    })
    .select();

  if (insertError) {
    console.error(`❌ Error inserting:`, insertError.message);
  } else {
    console.log(`✅ Success! Video ID: ${data[0].id}`);
    console.log(`🔗 App View Link: http://localhost:5173/feed`);
  }
}

run().catch(console.error);
