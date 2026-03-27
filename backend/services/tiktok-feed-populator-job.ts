/**
 * Periodic TikTok → feed imports (opt-in via TIKTOK_FEED_JOB_ENABLED).
 * Fetches trending (CA) and/or rotates Québec-themed hashtag searches, imports up to N new videos per run.
 */
import { logger } from "../utils/logger.js";
import {
  TikTokScraperService,
  missingTikTokProviderErrorMessage,
} from "./tiktok-scraper-service.js";
import { importTikTokVideoToFeed } from "./tiktok-feed-import.js";

const log = logger.withContext("TikTokFeedJob");

const DEFAULT_QUERIES = [
  "quebec",
  "montreal",
  "quebecois",
  "mtl",
  "poutine",
  "vieuxquebec",
];

function envInt(name: string, fallback: number): number {
  const v = parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function parseQueries(): string[] {
  const raw = process.env.TIKTOK_FEED_JOB_QUERIES?.trim();
  if (!raw) return DEFAULT_QUERIES;
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length > 0 ? list : DEFAULT_QUERIES;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let runIndex = 0;

export type TikTokFeedJobRunStats = {
  imported: number;
  attempted: number;
  duplicate: number;
  moderation: number;
  other: number;
  source: "trending" | "search";
  query?: string;
};

/**
 * Single job pass: trending first; if no videos, hashtag search with rotating query.
 */
export async function runTikTokFeedPopulatorOnce(): Promise<TikTokFeedJobRunStats> {
  const stats: TikTokFeedJobRunStats = {
    imported: 0,
    attempted: 0,
    duplicate: 0,
    moderation: 0,
    other: 0,
    source: "trending",
  };

  const maxPerRun = envInt("TIKTOK_FEED_JOB_MAX_PER_RUN", 5);
  const fetchBatch = Math.min(30, Math.max(maxPerRun * 4, 15));

  let videos = await TikTokScraperService.getTrending(fetchBatch);
  if (!videos.length) {
    const queries = parseQueries();
    const q = queries[runIndex % queries.length];
    runIndex++;
    stats.source = "search";
    stats.query = q;
    videos = await TikTokScraperService.search(q, fetchBatch);
  } else {
    runIndex++;
  }

  shuffleInPlace(videos);

  for (const video of videos) {
    if (stats.imported >= maxPerRun) break;

    stats.attempted++;
    const result = await importTikTokVideoToFeed(video, {
      metadataSource: "tiktok-feed-job",
    });

    if (result.ok) {
      stats.imported++;
      log.info(`Imported TikTok ${video.video_id} → post ${result.postId}`);
      continue;
    }

    switch (result.reason) {
      case "duplicate":
        stats.duplicate++;
        break;
      case "moderation":
        stats.moderation++;
        break;
      default:
        stats.other++;
    }
  }

  return stats;
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Start interval worker. No-op when TIKTOK_FEED_JOB_ENABLED is not exactly "true".
 */
export function startTikTokFeedPopulatorJob(): () => void {
  if (process.env.TIKTOK_FEED_JOB_ENABLED !== "true") {
    log.info("Disabled (set TIKTOK_FEED_JOB_ENABLED=true to enable).");
    return () => {};
  }

  if (!process.env.DATABASE_URL) {
    log.warn("DATABASE_URL missing — TikTok feed job not started.");
    return () => {};
  }

  const intervalMs = envInt("TIKTOK_FEED_JOB_INTERVAL_MS", 6 * 60 * 60 * 1000);

  const tick = () => {
    runTikTokFeedPopulatorOnce()
      .then((s) => {
        log.info(
          `Run complete: imported=${s.imported} attempted=${s.attempted} dup=${s.duplicate} mod=${s.moderation} other=${s.other} (${s.source}${s.query ? ` q=${s.query}` : ""})`,
        );
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === missingTikTokProviderErrorMessage()) {
          log.warn(`Skipped: ${msg}`);
        } else {
          log.error(`Run failed: ${msg}`);
        }
      });
  };

  log.info(
    `Starting (every ${intervalMs}ms, max ${envInt("TIKTOK_FEED_JOB_MAX_PER_RUN", 5)} imports/run).`,
  );
  tick();
  intervalHandle = setInterval(tick, intervalMs);

  return () => {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
    log.info("Stopped.");
  };
}
