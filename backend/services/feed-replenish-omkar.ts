/**
 * Replenish Pour toi via Omkar search/trending → importTikTokVideoToFeed (Mux).
 * API budget: defaults to ~1 Omkar call per run (100 free queries/month).
 */
import { logger } from "../utils/logger.js";
import { withCronLock } from "../utils/cron-lock.js";
import { filterUnseenTikTokVideos } from "../utils/tiktok-seed-dedup.js";
import { getQuebecTikTokQueries } from "./feed-seed-providers.js";
import {
  countPlayableFeedPosts,
  countPublicFeedPosts,
} from "./feed-replenish-tikapi.js";
import { importTikTokVideoToFeed } from "./tiktok-feed-import.js";
import { scoreQuebecRelevance } from "../utils/quebec-relevance.js";
import {
  isOmkarConfigured,
  TikTokScraperService,
  type TikTokVideo,
} from "./tiktok-scraper-service.js";

const log = logger.withContext("FeedReplenishOmkar");
const OMKAR_SEED_LOCK = "omkar-seed";

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
  const queryByVideo = new Map<string, string>();
  let omkarCalls = 0;

  const queries = getQuebecTikTokQueries();
  const slot = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  const includeTrending =
    options.force === true ||
    process.env.FEED_OMKAR_INCLUDE_TRENDING === "true";

  const push = (videos: TikTokVideo[], query?: string) => {
    for (const v of videos) {
      if (!v.video_id || seen.has(v.video_id)) continue;
      if (!v.media?.video_url?.startsWith("http")) continue;
      seen.add(v.video_id);
      if (query) queryByVideo.set(v.video_id, query);
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
      push(videos, q);
    } catch (e: unknown) {
      errors.push(
        `search(${q}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const rank = (v: TikTokVideo) => {
    const qScore = scoreQuebecRelevance(
      v.caption || "",
      queryByVideo.get(v.video_id),
    );
    return qScore * 1e9 + (v.stats?.views ?? 0);
  };

  return {
    videos: out.sort((a, b) => rank(b) - rank(a)),
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
  const result = await withCronLock(OMKAR_SEED_LOCK, () =>
    replenishFeedOmkarIfLowInner(options),
  );

  if (result === null) {
    log.info("Another Omkar seed run in progress — skipping");
    return {
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
      errors: ["skipped: overlapping cron lock"],
    };
  }

  return result;
}

async function replenishFeedOmkarIfLowInner(options?: {
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

  const { unseen, skippedDuplicate } = await filterUnseenTikTokVideos(videos);
  if (skippedDuplicate > 0) {
    log.info(`${skippedDuplicate} Omkar candidates already in DB (pre-filter)`);
  }

  let imported = 0;
  let duplicate = skippedDuplicate;
  let skipped = 0;
  let failed = 0;
  let moderation = 0;

  for (const video of unseen) {
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
      case "dedup_unavailable":
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
    candidates: unseen.length,
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
