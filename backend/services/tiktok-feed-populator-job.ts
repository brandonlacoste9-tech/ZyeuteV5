/**
 * Periodic TikTok → feed imports (opt-in via TIKTOK_FEED_JOB_ENABLED).
 * Fetches trending (CA) and/or rotates Québec-themed hashtag searches, imports up to N new videos per run.
 */
import { logger } from "../utils/logger.js";
import {
  missingTikTokProviderErrorMessage,
} from "./tiktok-scraper-service.js";
import { replenishFeedTikApiIfLow } from "./feed-replenish-tikapi.js";

const log = logger.withContext("TikTokFeedJob");

function envInt(name: string, fallback: number): number {
  const v = parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

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
  const maxPerRun = envInt("TIKTOK_FEED_JOB_MAX_PER_RUN", 20);

  const result = await replenishFeedTikApiIfLow({
    maxImport: maxPerRun,
  });

  return {
    imported: result.imported,
    attempted: result.candidates,
    duplicate: result.duplicate,
    moderation: 0,
    other: result.failed + result.skipped,
    source: "trending",
  };
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

  const hasDb =
    !!process.env.DATABASE_URL ||
    (!!process.env.VITE_SUPABASE_URL &&
      !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!hasDb) {
    log.warn(
      "DATABASE_URL or Supabase service key missing — TikTok feed job not started.",
    );
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
    `Starting (every ${intervalMs}ms, max ${envInt("TIKTOK_FEED_JOB_MAX_PER_RUN", 20)} imports/run).`,
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
