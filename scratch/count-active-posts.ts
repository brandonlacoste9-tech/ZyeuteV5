import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing env credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("🕵️ Fetching publications using exact API feed filters...");

  const { data: posts, error } = await supabase
    .from("publications")
    .select("id, processing_status, mux_playback_id, caption, content, media_url, hls_url")
    .eq("visibility", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .neq("processing_status", "no_audio")
    .eq("hive_id", "quebec")
    .or("processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null")
    .not("media_url", "is", null)
    .not("caption", "ilike", "%DIAGNOSTIC%")
    .not("content", "ilike", "%DIAGNOSTIC%")
    .not("caption", "ilike", "%TEST VIDEO%")
    .not("content", "ilike", "%TEST VIDEO%")
    .order("viral_score", { ascending: false })
    .order("reactions_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching publications:", error.message);
    return;
  }

  console.log(`Total active Quebec feed publications matching exact API filters: ${posts?.length || 0}`);
  
  // Apply postHasPlayableMedia logic
  function postHasPlayableMedia(p: any): boolean {
    const mux = String(p.mux_playback_id ?? "").trim();
    if (mux.length >= 8) return true;
    const hls = String(p.hls_url ?? "").trim();
    if (hls.length >= 12 && /^https?:\/\//i.test(hls)) {
      if (/fal\.media|\.fal\.run/i.test(hls) && mux.length < 8) return false;
      return true;
    }
    const media = String(p.media_url ?? "").trim();
    if (media.length < 12 || !/^https?:\/\//i.test(media)) return false;
    if (/fal\.media|\.fal\.run/i.test(media)) return false;
    return true;
  }

  const playable = posts?.filter(postHasPlayableMedia) || [];
  console.log(`Total posts that pass postHasPlayableMedia: ${playable.length}`);

  if (posts && posts.length > 0) {
    console.log("Sample post:", posts[0]);
  }
}

run();
