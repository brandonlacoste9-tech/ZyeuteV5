import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import dotenv from "dotenv";

// Load env in same order as app startup
dotenv.config();
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env.render", override: false });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APIFY_API_KEY = process.env.APIFY_API_KEY;
const APIFY_TIKTOK_ACTOR =
  process.env.APIFY_TIKTOK_ACTOR_ID || "clockworks/free-tiktok-scraper";
const APIFY_BASE_URL = "https://api.apify.com/v2";
const TIKWM_DETAILS_API = "https://www.tikwm.com/api/";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing Supabase credentials (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
  );
  process.exit(1);
}

if (!APIFY_API_KEY) {
  console.error("❌ Missing APIFY_API_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type ApifyItem = {
  id: string;
  text?: string;
  webVideoUrl?: string;
  diggCount?: number;
  playCount?: number;
  shareCount?: number;
  commentCount?: number;
  authorMeta?: {
    name?: string;
    nickName?: string;
    avatar?: string;
  };
  videoMeta?: {
    coverUrl?: string;
    originalCoverUrl?: string;
    duration?: number;
  };
};

type TikWmPayload = {
  code: number;
  msg?: string;
  data?: {
    id: string;
    title?: string;
    play?: string;
    hdplay?: string;
    cover?: string;
    origin_cover?: string;
    digg_count?: number;
    play_count?: number;
    share_count?: number;
    comment_count?: number;
    author?: {
      unique_id?: string;
      nickname?: string;
      avatar?: string;
    };
  };
};

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find((x) => x.startsWith(`--${name}=`));
  const value = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAuthorUserId() {
  const preferred = ["ti_guy_bot", "zyeute_scout", "zyeute_seed"];
  for (const username of preferred) {
    const { data } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }

  const { data: fallback } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  return fallback?.id || null;
}

async function fetchTopCandidates(limit: number): Promise<ApifyItem[]> {
  const actorPath = APIFY_TIKTOK_ACTOR.replace("/", "~");
  const hashtags = ["fyp", "viral", "trending", "foryoupage"];

  console.log(
    `📡 Fetching top TikTok candidates from Apify (${hashtags.join(", ")})...`,
  );
  const response = await axios.post(
    `${APIFY_BASE_URL}/acts/${actorPath}/run-sync-get-dataset-items`,
    {
      hashtags,
      resultsPerPage: Math.max(3, Math.min(limit, 8)),
    },
    {
      params: {
        token: APIFY_API_KEY,
        memory: 4096,
      },
      headers: { "Content-Type": "application/json" },
      timeout: 120000,
    },
  );

  const list = Array.isArray(response.data)
    ? (response.data as ApifyItem[])
    : [];
  const deduped = new Map<string, ApifyItem>();
  for (const item of list) {
    if (!item?.id || !item?.webVideoUrl) continue;
    if (!deduped.has(item.id)) deduped.set(item.id, item);
  }

  return [...deduped.values()]
    .sort((a, b) => (b.diggCount || 0) - (a.diggCount || 0))
    .slice(0, limit * 2);
}

async function fetchTikWmDetails(
  videoUrl: string,
): Promise<TikWmPayload["data"] | null> {
  const body = new URLSearchParams({ url: videoUrl, hd: "1" });
  const response = await axios.post<TikWmPayload>(TIKWM_DETAILS_API, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    timeout: 30000,
  });

  if (response.data?.code !== 0 || !response.data?.data?.id) {
    console.warn("⚠️ TikWM detail fetch returned non-success for", videoUrl);
    return null;
  }

  return response.data.data;
}

async function alreadyImported(tiktokId: string) {
  const { data } = await supabase
    .from("publications")
    .select("id")
    .contains("media_metadata", { tiktok_id: tiktokId })
    .limit(1);

  return !!data?.length;
}

async function insertVideo(
  userId: string,
  candidate: ApifyItem,
  details: NonNullable<TikWmPayload["data"]>,
) {
  const caption = details.title || candidate.text || "TikTok Import";
  const mediaUrl = details.play || details.hdplay;
  const hdUrl = details.hdplay || undefined;
  const thumbnail =
    details.cover ||
    details.origin_cover ||
    candidate.videoMeta?.coverUrl ||
    candidate.videoMeta?.originalCoverUrl ||
    "";

  if (!mediaUrl) {
    console.warn(`⚠️ No playable media URL for ${details.id}`);
    return false;
  }

  const { error } = await supabase.from("publications").insert({
    user_id: userId,
    type: "video",
    media_url: mediaUrl,
    hls_url: hdUrl,
    thumbnail_url: thumbnail,
    caption,
    content: caption,
    visibility: "public",
    hive_id: "quebec",
    processing_status: "completed",
    reactions_count: details.digg_count || candidate.diggCount || 0,
    comments_count: details.comment_count || candidate.commentCount || 0,
    shares_count: details.share_count || candidate.shareCount || 0,
    media_metadata: {
      tiktok_id: details.id,
      author:
        details.author?.unique_id ||
        candidate.authorMeta?.name ||
        details.author?.nickname ||
        candidate.authorMeta?.nickName ||
        null,
      source: "apify+tikwm-top-import",
      provider: {
        discovery: "apify",
        details: "tikwm",
      },
      stats: {
        likes: details.digg_count || candidate.diggCount || 0,
        views: details.play_count || candidate.playCount || 0,
        shares: details.share_count || candidate.shareCount || 0,
        comments: details.comment_count || candidate.commentCount || 0,
      },
      original_url: candidate.webVideoUrl,
    },
  });

  if (error) {
    console.error(`❌ Insert failed for ${details.id}:`, error.message);
    return false;
  }

  return true;
}

async function main() {
  const limit = parseArg("limit", 10);
  const pauseMs = parseArg("pauseMs", 1200);

  console.log("🔥 Importing top TikToks into Zyeuté feed");
  console.log(`   limit=${limit}, pauseMs=${pauseMs}`);

  const userId = await getAuthorUserId();
  if (!userId) {
    console.error("❌ No user profile found to attribute posts to.");
    process.exit(1);
  }

  console.log(`👤 Author user ID: ${userId}`);

  const candidates = await fetchTopCandidates(limit);
  console.log(`📦 Received ${candidates.length} ranked candidates`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of candidates) {
    if (imported >= limit) break;
    if (!candidate.id || !candidate.webVideoUrl) {
      skipped++;
      continue;
    }

    if (await alreadyImported(candidate.id)) {
      console.log(`⏭️  Already imported: ${candidate.id}`);
      skipped++;
      continue;
    }

    console.log(
      `🎯 [${imported + 1}/${limit}] ${candidate.id} — ${(candidate.text || "").slice(0, 60)}`,
    );

    try {
      const details = await fetchTikWmDetails(candidate.webVideoUrl);
      if (!details) {
        failed++;
      } else {
        const ok = await insertVideo(userId, candidate, details);
        if (ok) {
          imported++;
          console.log(`✅ Imported ${details.id}`);
        } else {
          failed++;
        }
      }
    } catch (error: any) {
      failed++;
      console.error(
        `❌ Failed ${candidate.id}:`,
        error?.message || String(error),
      );
    }

    await sleep(pauseMs);
  }

  console.log("\n🎉 Import complete");
  console.log(`   imported=${imported}`);
  console.log(`   skipped=${skipped}`);
  console.log(`   failed=${failed}`);
}

main().catch((error) => {
  console.error("❌ Fatal import error:", error?.message || String(error));
  process.exit(1);
});
