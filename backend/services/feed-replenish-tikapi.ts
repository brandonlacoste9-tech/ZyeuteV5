/**
 * When the public feed pool is low, pull more TikToks (regional + viral + trending).
 */
import { logger } from "../utils/logger.js";
import {
  collectFeedSeedCandidates,
  isTikApiConfigured,
} from "./tikapi-hashtag.js";
import {
  countPublicFeedPostsPg,
  countPublicFeedPostsSupabase,
  countPlayableFeedPostsSupabase,
  importFeedSeedCandidates,
  type TikApiInsertStats,
} from "./tikapi-feed-insert.js";
import { createClient } from "@supabase/supabase-js";

const log = logger.withContext("FeedReplenish");

function envInt(name: string, fallback: number): number {
  const v = parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export type ReplenishResult = TikApiInsertStats & {
  feedCountBefore: number;
  playableCountBefore: number;
  candidates: number;
  triggered: boolean;
};

function dbConfig() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { databaseUrl, supabaseUrl, supabaseServiceKey };
}

export async function countPublicFeedPosts(hiveId = "quebec"): Promise<number> {
  const { databaseUrl, supabaseUrl, supabaseServiceKey } = dbConfig();

  if (databaseUrl) {
    try {
      return await countPublicFeedPostsPg(databaseUrl, hiveId);
    } catch (err) {
      log.warn(
        "DATABASE_URL count failed — falling back to Supabase HTTP",
        err instanceof Error ? err.message : String(err),
      );
    }
  }
  if (supabaseUrl && supabaseServiceKey) {
    return countPublicFeedPostsSupabase(
      createClient(supabaseUrl, supabaseServiceKey),
      hiveId,
    );
  }
  return 0;
}

export async function countPlayableFeedPosts(
  hiveId = "quebec",
): Promise<number> {
  const { databaseUrl, supabaseUrl, supabaseServiceKey } = dbConfig();
  if (supabaseUrl && supabaseServiceKey) {
    return countPlayableFeedPostsSupabase(
      createClient(supabaseUrl, supabaseServiceKey),
      hiveId,
    );
  }
  if (databaseUrl) {
    const total = await countPublicFeedPostsPg(databaseUrl, hiveId);
    return total;
  }
  return 0;
}

/**
 * Import TikToks when playable feed count is below minimum (or when force=true).
 */
export async function replenishFeedTikApiIfLow(options?: {
  force?: boolean;
  maxImport?: number;
  hiveId?: string;
}): Promise<ReplenishResult> {
  const hiveId = options?.hiveId ?? "quebec";
  const minPosts = envInt("FEED_MIN_PLAYABLE_POSTS", 150);
  const targetPosts = envInt("FEED_REPLENISH_TARGET", 350);
  const defaultBatch = envInt("FEED_REPLENISH_BATCH", 50);
  const force = options?.force === true;

  const empty: ReplenishResult = {
    imported: 0,
    skipped: 0,
    duplicate: 0,
    failed: 0,
    mirrored: 0,
    muxIngested: 0,
    feedCountBefore: 0,
    playableCountBefore: 0,
    candidates: 0,
    triggered: false,
  };

  if (!isTikApiConfigured()) {
    log.warn("TIKAPI_KEY missing — skip replenish");
    return empty;
  }

  const { databaseUrl, supabaseUrl, supabaseServiceKey } = dbConfig();
  if (!databaseUrl && !(supabaseUrl && supabaseServiceKey)) {
    log.warn("No DATABASE_URL or Supabase service key — skip replenish");
    return empty;
  }

  const feedCountBefore = await countPublicFeedPosts(hiveId);
  const playableCountBefore = await countPlayableFeedPosts(hiveId);
  const need = Math.max(0, targetPosts - playableCountBefore);
  const maxImport =
    options?.maxImport ??
    (force
      ? defaultBatch
      : Math.min(
          defaultBatch,
          Math.max(
            need,
            minPosts > playableCountBefore ? minPosts - playableCountBefore : 0,
          ),
        ));

  if (!force && playableCountBefore >= minPosts) {
    log.info(
      `Playable feed OK (${playableCountBefore} >= ${minPosts}), no replenish`,
    );
    return {
      ...empty,
      feedCountBefore,
      playableCountBefore,
      triggered: false,
    };
  }

  if (!force && maxImport <= 0) {
    return { ...empty, feedCountBefore, playableCountBefore, triggered: false };
  }

  log.info(
    `Replenishing feed (${playableCountBefore} playable / ${feedCountBefore} total, importing up to ${maxImport})`,
  );

  const candidates = await collectFeedSeedCandidates({
    regionalPerTag: 6,
    viralPerTag: 10,
    trendingCount: 25,
    minPlays: 0,
  });

  if (candidates.length < 5) {
    log.warn(
      `TikAPI returned ${candidates.length} candidates — trying TikWM fallback`,
    );
    const { collectTikwmFeedSeedCandidates } = await import("./tikwm-feed.js");
    const tikwm = await collectTikwmFeedSeedCandidates({
      regionalPerTag: 10,
      viralPerTag: 6,
    });
    if (tikwm.length > 0) {
      const seen = new Set(candidates.map((c) => c.video.video_id));
      for (const c of tikwm) {
        if (seen.has(c.video.video_id)) continue;
        seen.add(c.video.video_id);
        candidates.push(c);
      }
      log.info(
        `TikWM added ${tikwm.length} candidates (merged ${candidates.length})`,
      );
    }
  }

  const stats = await importFeedSeedCandidates({
    candidates,
    maxImport: force ? maxImport : Math.max(maxImport, 10),
    databaseUrl,
    supabaseUrl,
    supabaseServiceKey,
  });

  const result: ReplenishResult = {
    ...stats,
    feedCountBefore,
    playableCountBefore,
    candidates: candidates.length,
    triggered: true,
  };

  log.info(
    `Replenish done: +${result.imported} mux=${result.muxIngested} mirrored=${result.mirrored} dup=${result.duplicate} skip=${result.skipped} fail=${result.failed} (playable was ${playableCountBefore})`,
  );

  return result;
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;

/** Periodic low-feed check (opt-in: FEED_REPLENISH_ENABLED=true). */
export function startFeedReplenishJob(): () => void {
  if (process.env.FEED_REPLENISH_ENABLED !== "true") {
    log.info("Disabled (FEED_REPLENISH_ENABLED=true to enable).");
    return () => {};
  }

  const intervalMs = envInt("FEED_REPLENISH_INTERVAL_MS", 4 * 60 * 60 * 1000);

  const tick = () => {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (
      process.env.APIFY_API_KEY?.trim() &&
      supabaseUrl &&
      supabaseServiceKey
    ) {
      import("./feed-seed-providers.js")
        .then(({ replenishQuebecFeedPool }) =>
          replenishQuebecFeedPool({ supabaseUrl, supabaseServiceKey }),
        )
        .then((r) =>
          log.info(
            `Pool ${r.feedCountBefore}→${r.feedCountAfter} (+${r.apify} apify, +${r.pexels} pexels)`,
          ),
        )
        .catch((e: unknown) =>
          log.error(e instanceof Error ? e.message : String(e)),
        );
    } else {
      replenishFeedTikApiIfLow().catch((e: unknown) => {
        log.error(e instanceof Error ? e.message : String(e));
      });
    }
  };

  log.info(
    `Starting (every ${intervalMs}ms, min posts ${envInt("FEED_MIN_PLAYABLE_POSTS", 150)})`,
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
