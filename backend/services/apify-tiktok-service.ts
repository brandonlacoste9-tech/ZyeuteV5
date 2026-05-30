/**
 * Apify TikTok Scraper Service
 * Uses actor GdWCkxBtKWOsKjdch (clockworks/tiktok-scraper)
 * Requires APIFY_API_KEY env var + Apify Starter plan ($49/mo)
 *
 * Gets real TikTok videos with permanent webVideoUrl links,
 * thumbnails, play counts, and full metadata.
 */

import { ApifyClient } from "apify-client";

const APIFY_API_KEY = process.env.APIFY_API_KEY;
const ACTOR_ID = "GdWCkxBtKWOsKjdch"; // clockworks/tiktok-scraper

// Quebec-focused hashtags for feed population
const QUEBEC_HASHTAGS = [
  "montreal",
  "quebec",
  "quebecois",
  "mtl",
  "hiver",
  "poutine",
  "laval",
  "gatineau",
  "joual",
  "vieuxquebec",
  "montreal♬",
  "quebeclife",
];

// Trending global hashtags to mix in
const TRENDING_HASHTAGS = [
  "fyp",
  "viral",
  "trending",
  "dance",
  "food",
  "travel",
];

export interface ApifyTikTokVideo {
  id: string;
  text: string;
  webVideoUrl: string;
  playCount: number;
  diggCount: number;
  shareCount: number;
  commentCount: number;
  createTimeISO: string;
  videoMeta: {
    height: number;
    width: number;
    duration: number;
    coverUrl: string;
  };
  authorMeta: {
    name: string;
    nickName: string;
    id: string;
  };
  musicMeta: {
    musicName: string;
    musicAuthor: string;
  };
  hashtags: Array<{ name: string }>;
  searchHashtag?: string;
}

/**
 * Fetch Quebec TikTok videos via Apify
 * Returns videos with permanent webVideoUrl + full metadata
 */
export async function fetchQuebecTikTokVideos(options?: {
  hashtags?: string[];
  resultsPerPage?: number;
  minDiggs?: number;
}): Promise<ApifyTikTokVideo[]> {
  if (!APIFY_API_KEY) {
    console.warn("[Apify] APIFY_API_KEY not set — skipping TikTok scrape");
    return [];
  }

  const client = new ApifyClient({ token: APIFY_API_KEY });

  const hashtags = options?.hashtags || QUEBEC_HASHTAGS;
  const resultsPerPage = options?.resultsPerPage || 100;
  const minDiggs = options?.minDiggs || 500;

  console.log(
    `[Apify] Starting TikTok scrape: ${hashtags.length} hashtags, ${resultsPerPage} results/page`,
  );

  try {
    const run = await client.actor(ACTOR_ID).call({
      hashtags,
      resultsPerPage,
      maxProfilesPerQuery: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSlideshowImages: false,
      shouldDownloadAvatars: false,
      shouldDownloadMusicCovers: false,
      downloadSubtitlesOptions: "NEVER_DOWNLOAD_SUBTITLES",
      commentsPerPost: 0,
      scrapeRelatedVideos: false,
      leastDiggs: minDiggs,
      proxyCountryCode: "None",
    });

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems({ limit: 1000 });

    console.log(`[Apify] Scraped ${items.length} TikTok videos`);
    return items as ApifyTikTokVideo[];
  } catch (err: any) {
    console.error("[Apify] Scrape failed:", err.message);
    return [];
  }
}

/**
 * Convert Apify TikTok video to a Supabase publication insert object
 */
export function apifyVideoToPublication(
  video: ApifyTikTokVideo,
  userId: string,
): Record<string, unknown> {
  const isPortrait =
    (video.videoMeta?.height || 0) > (video.videoMeta?.width || 0);

  // Build Quebec-flavored caption
  const caption = video.text?.slice(0, 500) || `#${video.searchHashtag || "québec"} 🍁`;

  return {
    user_id: userId,
    caption,
    content: caption,
    type: "video",
    // webVideoUrl is permanent (TikTok embed page) — doesn't expire like CDN URLs
    media_url: video.webVideoUrl,
    tiktok_url: video.webVideoUrl,
    thumbnail_url: video.videoMeta?.coverUrl || null,
    hls_url: null,
    duration: video.videoMeta?.duration || null,
    processing_status: "completed",
    is_moderated: true,
    moderation_approved: true,
    est_masque: false,
    hive_id: "quebec",
    region: detectRegion(video),
    visibility: "public",
    visibilite: "public",
    reactions_count: video.diggCount || 0,
    view_count: video.playCount || 0,
    comments_count: video.commentCount || 0,
    shares_count: video.shareCount || 0,
    viral_score: Math.min(100, Math.floor((video.playCount || 0) / 50000)),
    video_source: "tiktok_apify",
  };
}

function detectRegion(video: ApifyTikTokVideo): string {
  const tag = video.searchHashtag?.toLowerCase() || "";
  const text = (video.text || "").toLowerCase();
  if (
    tag === "montreal" ||
    tag === "mtl" ||
    text.includes("montréal") ||
    text.includes("montreal")
  )
    return "montreal";
  if (
    tag === "laval" ||
    text.includes("laval")
  )
    return "laval";
  if (
    tag === "gatineau" ||
    text.includes("gatineau")
  )
    return "gatineau";
  if (
    tag === "quebec" ||
    tag === "quebecois" ||
    tag === "vieuxquebec" ||
    text.includes("québec")
  )
    return "quebec";
  return "other";
}
