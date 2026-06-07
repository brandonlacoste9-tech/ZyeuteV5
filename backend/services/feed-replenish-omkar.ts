/**
 * Replenish Pour toi via Omkar search/trending → importTikTokVideoToFeed (Mux).
 * API budget: defaults to ~1 Omkar call per run (100 free queries/month).
 */
import { logger } from "../utils/logger.js";
import { getQuebecTikTokQueries } from "./feed-seed-providers.js";
import {
  countPlayableFeedPosts,
  countPublicFeedPosts,
} from "./feed-replenish-tikapi.js";
import { importTikTokVideoToFeed } from "./tiktok-feed-import.js";
import {
  isOmkarConfigured,
  TikTokScraperService,
  type TikTokVideo,
} from "./tiktok-scraper-service.js";

const log = logger.withContext("FeedReplenishOmkar");

function envInt(name: string, fallback: number): number {
  const v = parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export type OmkarReplenishResult = {
  imported: number;
  duplicate: number;
  skipped: number;
  failed: number;
  moderation: number;
  candidates: number;
  omkarCalls: number;
  feedCountBefore: number;
  playableCountBefore: number;
  triggered: boolean;
  errors: string[];
};

async function collectOmkarCandidates(options: {
  maxApiCalls: number;
  resultsPerQuery: number;
  trendingCount: number;
  force?: boolean;
}): Promise<{ videos: TikTokVideo[]; omkarCalls: number; errors: string[] }> {
  const errors: string[] = [];
  const seen = new Set<string>();
  const out: TikTokVideo[] = [];
  let omkarCalls = 0;

  const queries = getQuebecTikTokQueries();
  const slot = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  const includeTrending =
    options.force === true ||
    process.env.FEED_OMKAR_INCLUDE_TRENDING === "true" ||
    (process.env.FEED_OMKAR_INCLUDE_TRENDING !== "false" &&
      slot % envInt("FEED_OMKAR_TRENDING_EVERY_N_SLOTS", 4) === 0);

  const push = (videos: TikTokVideo[]) => {
    for (const v of videos) {
      if (!v.video_id || seen.has(v.video_id)) continue;
      if (!v.media?.video_url?.startsWith("http")) continue;
      seen.add(v.video_id);
      out.push(v);
    }
  };

  if (includeTrending && omkarCalls < options.maxApiCalls) {
    try {
      const trending = await TikTokScraperService.getTrending(
        options.trendingCount,
      );
      omkarCalls += 1;
      push(trending);
    } catch (e: unknown) {
      errors.push(`trending: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const queryBudget = Math.max(0, options.maxApiCalls - omkarCalls);
  for (let i = 0; i < queryBudget && queries.length > 0; i++) {
    const q = queries[(slot + i) % queries.length];
    try {
      const videos = await TikTokScraperService.search(
        q,
        options.resultsPerQuery,
      );
      omkarCalls += 1;
      push(videos);
    } catch (e: unknown) {
      errors.push(
        `search(${q}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return {
    videos: out.sort((a, b) => (b.stats?.views ?? 0) - (a.stats?.views ?? 0)),
    omkarCalls,
    errors,
  };
}

/**
 * Import TikToks from Omkar when playable feed is low (or force=true).
 */
export async function replenishFeedOmkarIfLow(options?: {
  force?: boolean;
  maxImport?: number;
  hiveId?: string;
}): Promise<OmkarReplenishResult> {
  const hiveId = options?.hiveId ?? "quebec";
  const force = options?.force === true;
  const minPosts = envInt("FEED_MIN_PLAYABLE_POSTS", 150);
  const defaultBatch = envInt("FEED_REPLENISH_BATCH", 15);
  const maxApiCalls = envInt("FEED_OMKAR_CALLS_PER_RUN", 2);
  const resultsPerQuery = envInt("FEED_OMKAR_RESULTS_PER_QUERY", 8);
  const trendingCount = envInt("FEED_OMKAR_TRENDING_COUNT", 10);

  const empty: OmkarReplenishResult = {
    imported: 0,
    duplicate: 0,
    skipped: 0,
    failed: 0,
    moderation: 0,
    candidates: 0,
    omkarCalls: 0,
    feedCountBefore: 0,
    playableCountBefore: 0,
    triggered: false,
    errors: [],
  };

  if (!isOmkarConfigured()) {
    log.warn("TIKTOK_SCRAPER_API_KEY missing — skip Omkar replenish");
    return empty;
  }

  const feedCountBefore = await countPublicFeedPosts(hiveId);
  const playableCountBefore = await countPlayableFeedPosts(hiveId);
  const maxImport = options?.maxImport ?? defaultBatch;

  if (!force && playableCountBefore >= minPosts) {
    log.info(
      `Playable feed OK (${playableCountBefore} >= ${minPosts}), no Omkar replenish`,
    );
    return {
      ...empty,
      feedCountBefore,
      playableCountBefore,
      triggered: false,
    };
  }

  log.info(
    `Omkar replenish (${playableCountBefore} playable, up to ${maxImport} imports, ${maxApiCalls} API calls)`,
  );

  const { videos, omkarCalls, errors } = await collectOmkarCandidates({
    maxApiCalls: force
      ? envInt("FEED_OMKAR_CALLS_PER_RUN_FORCE", 4)
      : maxApiCalls,
    resultsPerQuery,
    trendingCount: force
      ? envInt("FEED_OMKAR_TRENDING_COUNT_FORCE", 20)
      : trendingCount,
    force,
  });

  let imported = 0;
  let duplicate = 0;
  let skipped = 0;
  let failed = 0;
  let moderation = 0;

  for (const video of videos) {
    if (imported >= maxImport) break;

    const result = await importTikTokVideoToFeed(video, {
      videoUrlHint: video.original_url,
      metadataSource: "omkar",
    });

    if (result.ok) {
      imported += 1;
      continue;
    }

    switch (result.reason) {
      case "duplicate":
        duplicate += 1;
        break;
      case "moderation":
        moderation += 1;
        break;
      case "no_media":
      case "invalid_payload":
        skipped += 1;
        break;
      default:
        failed += 1;
        if (result.detail) errors.push(result.detail);
    }
  }

  const result: OmkarReplenishResult = {
    imported,
    duplicate,
    skipped,
    failed,
    moderation,
    candidates: videos.length,
    omkarCalls,
    feedCountBefore,
    playableCountBefore,
    triggered: true,
    errors,
  };

  log.info(
    `Omkar done: +${imported} dup=${duplicate} mod=${moderation} skip=${skipped} fail=${failed} (${omkarCalls} API calls, ${videos.length} candidates)`,
  );

  return result;
}
