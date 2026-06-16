import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

// Simulated Mulberry32 PRNG
function seededRandom(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  const rand = seededRandom(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function buildQuery(offset: number, fetchLimit: number) {
  return supabase
    .from("publications")
    .select("id, caption, media_url")
    .eq("visibility", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .eq("hive_id", "quebec")
    .or(
      "processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null"
    )
    .not("media_url", "is", null)
    .not("caption", "ilike", "%DIAGNOSTIC%")
    .not("content", "ilike", "%DIAGNOSTIC%")
    .not("caption", "ilike", "%TEST VIDEO%")
    .not("content", "ilike", "%TEST VIDEO%")
    .order("viral_score", { ascending: false })
    .order("reactions_count", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + fetchLimit - 1);
}

async function simulateInfiniteFeed() {
  console.log("🏁 Simulating /api/feed/infinite pagination...");

  const limit = 30;
  
  // PAGE 0 (First Page)
  console.log("\n📄 Simulating Page 0 (cursor = null)...");
  const isFirstPage = true;
  const poolMultiplier = 3;
  const fetchLimit = limit * poolMultiplier; // 90
  
  let { data: postsPage0, error: err0 } = await buildQuery(0, fetchLimit);
  if (err0) {
    console.error("Page 0 error:", err0.message);
    return;
  }
  
  console.log(`- DB returned ${postsPage0?.length || 0} posts for pool.`);
  
  // Shuffle & slice
  const seed = 12345; // Simulated seed
  let finalPostsPage0 = postsPage0 || [];
  if (finalPostsPage0.length > limit) {
    finalPostsPage0 = shuffleWithSeed(finalPostsPage0, seed).slice(0, limit);
  }
  console.log(`- Shuffled and sliced to ${finalPostsPage0.length} posts.`);
  
  const page0Ids = new Set(finalPostsPage0.map(p => p.id));

  // PAGE 1 (Second Page)
  console.log("\n📄 Simulating Page 1 (cursor = 30)...");
  const page1Offset = 30;
  const fetchLimitPage1 = limit; // 30
  
  let { data: postsPage1, error: err1 } = await buildQuery(page1Offset, fetchLimitPage1);
  if (err1) {
    console.error("Page 1 error:", err1.message);
    return;
  }
  
  console.log(`- DB returned ${postsPage1?.length || 0} posts.`);
  
  // Count duplicates from Page 0
  let page1DupesCount = 0;
  postsPage1?.forEach(p => {
    if (page0Ids.has(p.id)) {
      page1DupesCount++;
    }
  });
  console.log(`- Duplicates found from Page 0: ${page1DupesCount} out of ${postsPage1?.length || 0} posts.`);

  // PAGE 2 (Third Page)
  console.log("\n📄 Simulating Page 2 (cursor = 60)...");
  const page2Offset = 60;
  const fetchLimitPage2 = limit; // 30
  
  let { data: postsPage2, error: err2 } = await buildQuery(page2Offset, fetchLimitPage2);
  if (err2) {
    console.error("Page 2 error:", err2.message);
    return;
  }
  
  console.log(`- DB returned ${postsPage2?.length || 0} posts.`);
  
  // Count duplicates from Page 0
  let page2DupesCount = 0;
  postsPage2?.forEach(p => {
    if (page0Ids.has(p.id)) {
      page2DupesCount++;
    }
  });
  console.log(`- Duplicates found from Page 0: ${page2DupesCount} out of ${postsPage2?.length || 0} posts.`);
}

simulateInfiniteFeed();
