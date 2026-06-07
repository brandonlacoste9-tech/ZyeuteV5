/**
 * Periodic Québec TikTok feed imports via Apify (TIKTOK_FEED_JOB_ENABLED=true).
 */
import { logger } from "../utils/logger.js";
import { replenishQuebecFeedPool } from "./feed-seed-providers.js";

const log = logger.withContext("TikTokFeedJob");

function envInt(name: string, fallback: number): number {
  const v = parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export type TikTokFeedJobRunStats = {
  imported: number;
  apify: number;
  pexels: number;
  feedCountBefore: number;
  feedCountAfter: number;
  errors: string[];
};

export async function runTikTokFeedPopulatorOnce(): Promise<TikTokFeedJobRunStats> {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const maxPerRun = envInt("TIKTOK_FEED_JOB_MAX_PER_RUN", 45);

  const force = process.env.TIKTOK_FEED_JOB_FORCE === "true";

  const result = await replenishQuebecFeedPool({
    supabaseUrl,
    supabaseServiceKey,
    maxApify: maxPerRun,
    maxPexels: 10,
    force,
  });

  return {
    imported: result.apify + result.pexels + result.pixabay,
    apify: result.apify,
    pexels: result.pexels,
    feedCountBefore: result.feedCountBefore,
    feedCountAfter: result.feedCountAfter,
    errors: result.errors,
  };
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startTikTokFeedPopulatorJob(): () => void {
  if (process.env.TIKTOK_FEED_JOB_ENABLED !== "true") {
    log.info("Disabled (set TIKTOK_FEED_JOB_ENABLED=true to enable).");
    return () => {};
  }

  if (!process.env.APIFY_API_KEY?.trim()) {
    log.warn("APIFY_API_KEY missing — TikTok feed job not started.");
    return () => {};
  }

  const intervalMs = envInt("TIKTOK_FEED_JOB_INTERVAL_MS", 4 * 60 * 60 * 1000);

  const tick = () => {
    runTikTokFeedPopulatorOnce()
      .then((s) => {
        log.info(
          `Run: apify=${s.apify} pexels=${s.pexels} pool ${s.feedCountBefore}→${s.feedCountAfter}`,
        );
      })
      .catch((e: unknown) => {
        log.error(e instanceof Error ? e.message : String(e));
      });
  };

  log.info(
    `Starting Apify replenish every ${intervalMs}ms, up to ${envInt("TIKTOK_FEED_JOB_MAX_PER_RUN", 45)}/run`,
  );
  tick();
  intervalHandle = setInterval(tick, intervalMs);

  return () => {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  };
}
