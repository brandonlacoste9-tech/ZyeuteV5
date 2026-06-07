/**
 * Feed seeding via Pixabay, Pexels, and Apify (no TikAPI).
 * Apify downloads MP4 → Supabase Storage for reliable playback.
 */
import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PexelsService } from "./pexels-service.js";
import {
  isPixabayConfigured,
  pickPixabayPlayUrl,
  searchPixabayVideos,
} from "./pixabay-video-service.js";

export type ProviderSeedStats = {
  pexels: number;
  pixabay: number;
  apify: number;
  skipped: number;
  errors: string[];
};

export type SeedProviderOptions = {
  pexels?: boolean;
  pixabay?: boolean;
  apify?: boolean;
  limitPerProvider?: number;
  hiveId?: string;
  regionId?: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
};

const PEXELS_QUERIES = [
  "montreal city",
  "quebec winter",
  "canada nature",
  "street food canada",
  "hockey canada",
  "quebec festival",
  "old port montreal",
];

/** TikTok search terms — from TIKTOK_FEED_JOB_QUERIES or Québec defaults. */
export function getQuebecTikTokQueries(): string[] {
  const raw = process.env.TIKTOK_FEED_JOB_QUERIES?.trim();
  const fromEnv = raw
    ? raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const defaults = [
    "quebec",
    "montreal",
    "quebecois",
    "mtl",
    "hiver",
    "poutine",
    "vieuxquebec",
    "laval",
    "gatineau",
    "#quebec",
    "#montreal",
    "#mtl",
    "quebec viral",
    "montreal nightlife",
  ];
  return [...new Set([...fromEnv, ...defaults])];
}

function bestPexelsFile(
  files: { link: string; width: number; height: number; quality?: string }[],
): string | null {
  const mp4 = files.filter((f) => f.link?.includes(".mp4"));
  const portrait = mp4.find((f) => f.height >= f.width);
  const hd = mp4.find((f) => f.quality === "hd" || f.quality === "uhd");
  return (portrait ?? hd ?? mp4[0])?.link ?? null;
}

async function resolveAuthorId(supabase: SupabaseClient): Promise<string> {
  for (const username of [
    "ti_guy_bot",
    "zyeute_scout",
    "zyeute_ai",
    "zyeute_seed",
  ]) {
    const { data } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }
  const { data } = await supabase.from("user_profiles").select("id").limit(1);
  if (!data?.[0]?.id) throw new Error("no_system_user");
  return data[0].id as string;
}

async function insertPublication(
  supabase: SupabaseClient,
  row: Record<string, unknown>,
): Promise<"ok" | "dup" | "fail"> {
  const { error } = await supabase.from("publications").insert(row);
  if (!error) return "ok";
  if (error.code === "23505") return "dup";
  return "fail";
}

export async function seedFromPexels(
  supabase: SupabaseClient,
  userId: string,
  opts: { limit: number; hiveId: string; regionId: string },
): Promise<number> {
  if (!process.env.PEXELS_API_KEY?.trim()) {
    throw new Error("PEXELS_API_KEY missing");
  }
  let imported = 0;
  const seen = new Set<string>();

  for (const query of PEXELS_QUERIES) {
    if (imported >= opts.limit) break;
    const data = await PexelsService.searchVideos(
      query,
      Math.min(8, opts.limit - imported),
      1,
    );
    for (const v of data.videos ?? []) {
      if (imported >= opts.limit) break;
      const mediaUrl = bestPexelsFile(v.video_files ?? []);
      if (!mediaUrl || seen.has(mediaUrl)) continue;
      seen.add(mediaUrl);
      const caption = `${query} — Québec ⚜️ #Quebec #Zyeuté`.slice(0, 500);
      const status = await insertPublication(supabase, {
        id: randomUUID(),
        user_id: userId,
        type: "video",
        media_url: mediaUrl,
        thumbnail_url: v.image,
        caption,
        content: caption,
        hive_id: opts.hiveId,
        region_id: opts.regionId,
        visibility: "public",
        processing_status: "completed",
        moderation_approved: true,
        est_masque: false,
        video_source: "pexels",
        media_metadata: { source: "pexels", pexels_id: v.id, query },
      });
      if (status === "ok") imported++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return imported;
}

export async function seedFromPixabay(
  supabase: SupabaseClient,
  userId: string,
  opts: { limit: number; hiveId: string; regionId: string },
): Promise<number> {
  if (!isPixabayConfigured()) throw new Error("PIXABAY_API_KEY missing");
  let imported = 0;
  const seen = new Set<string>();

  for (const query of PEXELS_QUERIES) {
    if (imported >= opts.limit) break;
    const hits = await searchPixabayVideos(
      query,
      Math.min(8, opts.limit - imported),
    );
    for (const hit of hits) {
      if (imported >= opts.limit) break;
      const mediaUrl = pickPixabayPlayUrl(hit);
      if (!mediaUrl || seen.has(mediaUrl)) continue;
      seen.add(mediaUrl);
      const caption =
        `${hit.tags.split(",")[0]?.trim() || query} — Québec 🍁 #Quebec`.slice(
          0,
          500,
        );
      const status = await insertPublication(supabase, {
        id: randomUUID(),
        user_id: userId,
        type: "video",
        media_url: mediaUrl,
        caption,
        content: caption,
        hive_id: opts.hiveId,
        region_id: opts.regionId,
        visibility: "public",
        processing_status: "completed",
        moderation_approved: true,
        est_masque: false,
        video_source: "pixabay",
        media_metadata: { source: "pixabay", pixabay_id: hit.id, query },
      });
      if (status === "ok") imported++;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return imported;
}

async function runApifySearch(
  apiKey: string,
  searchQueries: string[],
  resultsPerPage: number,
): Promise<Record<string, unknown>[]> {
  const actorId =
    process.env.APIFY_TIKTOK_ACTOR_ID || "clockworks/free-tiktok-scraper";
  const actorPath = actorId.replace("/", "~");
  const url = `https://api.apify.com/v2/acts/${actorPath}/run-sync-get-dataset-items?token=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchQueries,
      resultsPerPage,
      maxProfilesPerQuery: 2,
      shouldDownloadVideos: true,
      shouldDownloadCovers: false,
      commentsPerPost: 0,
      scrapeRelatedVideos: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Apify ${response.status}: ${(await response.text()).slice(0, 200)}`,
    );
  }

  return (await response.json()) as Record<string, unknown>[];
}

export async function seedFromApify(
  supabase: SupabaseClient,
  userId: string,
  opts: { limit: number; hiveId: string; regionId: string },
): Promise<number> {
  const apiKey = process.env.APIFY_API_KEY?.trim();
  if (!apiKey) throw new Error("APIFY_API_KEY missing");

  const queries = getQuebecTikTokQueries();
  const perQuery = Math.min(
    20,
    Math.max(8, Math.ceil(opts.limit / Math.min(queries.length, 8))),
  );
  const seen = new Set<string>();
  let imported = 0;

  // Batch queries (4 per Apify run) until we hit limit or exhaust list
  for (let i = 0; i < queries.length && imported < opts.limit; i += 4) {
    const batch = queries.slice(i, i + 4);
    let items: Record<string, unknown>[];
    try {
      items = await runApifySearch(apiKey, batch, perQuery);
    } catch (e: unknown) {
      console.warn(
        `[Apify] batch ${batch.join(",")} failed:`,
        e instanceof Error ? e.message : String(e),
      );
      continue;
    }

    for (const item of items) {
      if (imported >= opts.limit) break;
      const videoId = String(item.id ?? "");
      if (!videoId || seen.has(videoId)) continue;
      const desc = String(item.text ?? "").slice(0, 500);
      const authorMeta = (item.authorMeta ?? {}) as Record<string, unknown>;
      const videoMeta = (item.videoMeta ?? {}) as Record<string, unknown>;
      const handle = String(
        authorMeta.name ?? authorMeta.nickName ?? "unknown",
      );
      const metaW = Number(videoMeta.width ?? 0);
      const metaH = Number(videoMeta.height ?? 0);
      if (metaH > 0 && metaW > 0 && metaW >= metaH) continue;

      const rawMp4 =
        String(videoMeta.downloadAddr ?? "") ||
        String((item.mediaUrls as string[] | undefined)?.[0] ?? "");
      if (!rawMp4.startsWith("http")) continue;

      let mediaUrl = rawMp4;
      try {
        const vidResp = await fetch(`${rawMp4}?token=${apiKey}`);
        if (vidResp.ok) {
          const buffer = Buffer.from(await vidResp.arrayBuffer());
          const fileName = `apify/${videoId}-${randomUUID()}.mp4`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("zyeute-videos")
              .upload(fileName, buffer, {
                contentType: "video/mp4",
                upsert: true,
              });
          if (!uploadError && uploadData) {
            const { data: pub } = supabase.storage
              .from("zyeute-videos")
              .getPublicUrl(fileName);
            mediaUrl = pub.publicUrl;
          }
        }
      } catch {
        // keep Apify URL if upload fails
      }

      const webVideoUrl = String(
        item.webVideoUrl ??
          `https://www.tiktok.com/@${handle}/video/${videoId}`,
      );
      const status = await insertPublication(supabase, {
        id: randomUUID(),
        user_id: userId,
        media_url: mediaUrl,
        original_url: webVideoUrl,
        tiktok_url: webVideoUrl,
        thumbnail_url: String(videoMeta.coverUrl ?? ""),
        caption: desc || `#${handle}`,
        content: desc || `#${handle}`,
        type: "video",
        hive_id: opts.hiveId,
        region_id: opts.regionId,
        visibility: "public",
        processing_status: "completed",
        moderation_approved: true,
        video_source: "tiktok",
        reactions_count: Number(item.diggCount ?? 0),
        view_count: Number(item.playCount ?? 0),
        aspect_ratio:
          metaH > metaW ? "9:16" : metaW > metaH ? "16:9" : undefined,
        media_metadata: {
          source: "apify-scrape",
          tiktok_id: videoId,
          author: handle,
          width: metaW || undefined,
          height: metaH || undefined,
        },
      });
      if (status === "ok") {
        seen.add(videoId);
        imported++;
      }
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return imported;
}

/** Top up pool toward target using Apify (primary) + optional Pexels filler. */
export async function replenishQuebecFeedPool(options?: {
  force?: boolean;
  targetCount?: number;
  minCount?: number;
  maxApify?: number;
  maxPexels?: number;
  supabaseUrl: string;
  supabaseServiceKey: string;
  hiveId?: string;
}): Promise<
  ProviderSeedStats & { feedCountBefore: number; feedCountAfter: number }
> {
  const { countPublicFeedPostsSupabase } =
    await import("./tikapi-feed-insert.js");
  const supabase = createClient(
    options!.supabaseUrl,
    options!.supabaseServiceKey,
  );
  const hiveId = options?.hiveId ?? "quebec";
  const minCount =
    options?.minCount ??
    parseInt(process.env.FEED_MIN_PLAYABLE_POSTS || "150", 10);
  const targetCount =
    options?.targetCount ??
    parseInt(process.env.FEED_REPLENISH_TARGET || "350", 10);

  const feedCountBefore = await countPublicFeedPostsSupabase(supabase, hiveId);
  const need = Math.max(0, targetCount - feedCountBefore);
  const force = options?.force === true;

  if (!force && feedCountBefore >= minCount) {
    return {
      pexels: 0,
      pixabay: 0,
      apify: 0,
      skipped: 0,
      errors: [],
      feedCountBefore,
      feedCountAfter: feedCountBefore,
    };
  }

  const maxApify =
    options?.maxApify ?? parseInt(process.env.FEED_REPLENISH_BATCH || "50", 10);
  const maxPexels = options?.maxPexels ?? Math.min(20, Math.max(0, need));

  const apifyLimit = Math.min(
    maxApify,
    force ? maxApify : Math.max(maxApify, need),
  );

  const stats = await seedFeedProviders({
    supabaseUrl: options!.supabaseUrl,
    supabaseServiceKey: options!.supabaseServiceKey,
    hiveId,
    pexels: false,
    pixabay: false,
    apify: !!process.env.APIFY_API_KEY?.trim(),
    limitPerProvider: apifyLimit,
  });

  if (maxPexels > 0 && stats.apify < need / 2) {
    const extra = await seedFeedProviders({
      supabaseUrl: options!.supabaseUrl,
      supabaseServiceKey: options!.supabaseServiceKey,
      hiveId,
      pexels: true,
      pixabay: false,
      apify: false,
      limitPerProvider: maxPexels,
    });
    stats.pexels += extra.pexels;
    stats.errors.push(...extra.errors);
  }

  const feedCountAfter = await countPublicFeedPostsSupabase(supabase, hiveId);
  return { ...stats, feedCountBefore, feedCountAfter };
}

export async function seedFeedProviders(
  options: SeedProviderOptions,
): Promise<ProviderSeedStats> {
  const stats: ProviderSeedStats = {
    pexels: 0,
    pixabay: 0,
    apify: 0,
    skipped: 0,
    errors: [],
  };
  const limit = options.limitPerProvider ?? 15;
  const hiveId = options.hiveId ?? "quebec";
  const regionId = options.regionId ?? "montreal";

  const supabase = createClient(
    options.supabaseUrl,
    options.supabaseServiceKey,
  );
  const userId = await resolveAuthorId(supabase);

  const runPexels = options.pexels !== false;
  const runPixabay = options.pixabay !== false;
  const runApify = options.apify !== false;

  if (runPexels) {
    try {
      stats.pexels = await seedFromPexels(supabase, userId, {
        limit,
        hiveId,
        regionId,
      });
    } catch (e: unknown) {
      stats.errors.push(
        `pexels: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  if (runPixabay) {
    try {
      stats.pixabay = await seedFromPixabay(supabase, userId, {
        limit,
        hiveId,
        regionId,
      });
    } catch (e: unknown) {
      stats.errors.push(
        `pixabay: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  if (runApify) {
    try {
      stats.apify = await seedFromApify(supabase, userId, {
        limit,
        hiveId,
        regionId,
      });
    } catch (e: unknown) {
      stats.errors.push(`apify: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return stats;
}
