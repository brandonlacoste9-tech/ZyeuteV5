/**
 * TikAPI hashtag discovery — regional (Québec/Montreal) + viral/trending fill.
 */
import TikAPI from "tikapi";
import { TikApiService } from "./tikapi-service.js";
import {
  mapTikApiRawItemToVideo,
  mapTikApiServiceVideoToScraper,
  type TikTokVideo,
} from "./tiktok-scraper-service.js";

function getTikApiClient(): ReturnType<typeof TikAPI> | null {
  const key = process.env.TIKAPI_KEY?.trim();
  return key ? TikAPI(key) : null;
}

export type HashtagSeed = {
  name: string;
  id?: string | null;
  region: string;
};

/** Keep existing Québec/Montreal content — smaller pulls per tag. */
export const REGIONAL_HASHTAG_SEEDS: HashtagSeed[] = [
  { name: "montreal", id: "36966", region: "montreal" },
  { name: "quebec", id: "13725", region: "quebec_city" },
  { name: "quebecois", id: "4764129", region: "quebec_city" },
  { name: "mtl", id: "84124", region: "montreal" },
  { name: "poutine", region: "montreal" },
  { name: "vieuxquebec", region: "quebec_city" },
];

/** High-volume tags — fill the feed when regional pool is thin. */
export const VIRAL_HASHTAG_SEEDS: HashtagSeed[] = [
  { name: "fyp", region: "montreal" },
  { name: "viral", region: "montreal" },
  { name: "trending", region: "montreal" },
  { name: "foryou", region: "montreal" },
  { name: "foryoupage", region: "montreal" },
  { name: "comedy", region: "montreal" },
  { name: "dance", region: "montreal" },
  { name: "funny", region: "montreal" },
  { name: "canada", id: "2703", region: "montreal" },
  { name: "foodtiktok", region: "montreal" },
];

export type FeedSeedCandidate = {
  video: TikTokVideo;
  region: string;
  source: string;
};

export function isTikApiConfigured(): boolean {
  return Boolean(process.env.TIKAPI_KEY?.trim());
}

export async function resolveHashtagId(name: string): Promise<string | null> {
  const api = getTikApiClient();
  if (!api) return null;
  try {
    const res = await (
      api as {
        public: {
          hashtag: (p: {
            name: string;
          }) => Promise<{
            json?: { challengeInfo?: { challenge?: { id?: string } } };
          }>;
        };
      }
    ).public.hashtag({ name });
    return res?.json?.challengeInfo?.challenge?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchHashtagVideos(
  id: string,
  count = 20,
): Promise<Record<string, unknown>[]> {
  const api = getTikApiClient();
  if (!api) return [];
  try {
    const res = await (
      api as {
        public: {
          hashtag: (p: {
            id: string;
            count: number;
          }) => Promise<{
            json?: { itemList?: unknown[]; item_list?: unknown[] };
          }>;
        };
      }
    ).public.hashtag({ id, count });
    const list = res?.json?.itemList ?? res?.json?.item_list ?? [];
    return list.filter(
      (x): x is Record<string, unknown> => !!x && typeof x === "object",
    );
  } catch {
    return [];
  }
}

function pushVideo(
  out: FeedSeedCandidate[],
  seen: Set<string>,
  video: TikTokVideo,
  tag: HashtagSeed,
  source: string,
  minPlays: number,
): void {
  if (!video.video_id || seen.has(video.video_id)) return;
  if ((video.stats?.views ?? 0) < minPlays) return;
  seen.add(video.video_id);
  out.push({ video, region: tag.region, source });
}

async function collectFromHashtagList(
  tags: HashtagSeed[],
  perTag: number,
  minPlays: number,
  sourcePrefix: string,
): Promise<FeedSeedCandidate[]> {
  const out: FeedSeedCandidate[] = [];
  const localSeen = new Set<string>();

  for (const tag of tags) {
    if (process.env.TIKAPI_KEY) {
      try {
        const raw = await TikApiService.searchByHashtag(tag.name, perTag);
        const list = Array.isArray(raw) ? raw : [];
        for (const item of list) {
          const mapped = mapTikApiRawItemToVideo(
            item as Record<string, unknown>,
          );
          if (!mapped) continue;
          pushVideo(
            out,
            localSeen,
            mapped,
            tag,
            `${sourcePrefix}:search:${tag.name}`,
            minPlays,
          );
        }
      } catch {
        // try hashtag API below
      }
    }

    if (getTikApiClient()) {
      const id = tag.id ?? (await resolveHashtagId(tag.name));
      if (id) {
        const items = await fetchHashtagVideos(id, perTag);
        for (const item of items) {
          const mapped = mapTikApiRawItemToVideo(item);
          if (!mapped) continue;
          pushVideo(
            out,
            localSeen,
            mapped,
            tag,
            `${sourcePrefix}:hashtag:${tag.name}`,
            minPlays,
          );
        }
      }
    }

    await new Promise((r) => setTimeout(r, 450));
  }

  return out;
}

/** Trending / FYP-style discovery via TikAPI search. */
export async function collectTrendingCandidates(
  count = 25,
): Promise<FeedSeedCandidate[]> {
  if (!process.env.TIKAPI_KEY) return [];
  const items = await TikApiService.getTrendingVideos("CA", count);
  const seen = new Set<string>();
  const out: FeedSeedCandidate[] = [];

  for (const item of items) {
    const mapped = mapTikApiServiceVideoToScraper(item);
    if (!mapped.video_id || seen.has(mapped.video_id)) continue;
    seen.add(mapped.video_id);
    out.push({
      video: mapped,
      region: "montreal",
      source: "tikapi:trending",
    });
  }

  return out;
}

export type CollectFeedSeedOptions = {
  regionalPerTag?: number;
  viralPerTag?: number;
  trendingCount?: number;
  minPlays?: number;
};

/**
 * Regional first (keep Québec/Montreal), then viral hashtags + trending to top up the pool.
 */
export async function collectFeedSeedCandidates(
  opts: CollectFeedSeedOptions = {},
): Promise<FeedSeedCandidate[]> {
  const regionalPerTag = opts.regionalPerTag ?? 8;
  const viralPerTag = opts.viralPerTag ?? 12;
  const trendingCount = opts.trendingCount ?? 20;
  const minPlays = opts.minPlays ?? 0;

  const seen = new Set<string>();
  const merged: FeedSeedCandidate[] = [];

  const append = (batch: FeedSeedCandidate[]) => {
    for (const c of batch) {
      if (seen.has(c.video.video_id)) continue;
      seen.add(c.video.video_id);
      merged.push(c);
    }
  };

  append(
    await collectFromHashtagList(
      REGIONAL_HASHTAG_SEEDS,
      regionalPerTag,
      minPlays,
      "tikapi:regional",
    ),
  );
  append(
    await collectFromHashtagList(
      VIRAL_HASHTAG_SEEDS,
      viralPerTag,
      minPlays,
      "tikapi:viral",
    ),
  );
  append(await collectTrendingCandidates(trendingCount));

  return merged;
}

/** @deprecated Use collectFeedSeedCandidates */
export async function collectQuebecHashtagVideos(
  perTag = 15,
  minPlays = 0,
): Promise<{ item: Record<string, unknown>; tag: HashtagSeed }[]> {
  const out: { item: Record<string, unknown>; tag: HashtagSeed }[] = [];
  const seen = new Set<string>();

  for (const tag of REGIONAL_HASHTAG_SEEDS) {
    const id = tag.id ?? (await resolveHashtagId(tag.name));
    if (!id) continue;
    const items = await fetchHashtagVideos(id, perTag);
    for (const item of items) {
      const tiktokId = String(item.id ?? "");
      if (!tiktokId || seen.has(tiktokId)) continue;
      const stats = (item.stats ?? item.statistics) as
        | Record<string, number>
        | undefined;
      const plays = stats?.playCount ?? stats?.play_count ?? 0;
      if (plays < minPlays) continue;
      seen.add(tiktokId);
      out.push({ item, tag });
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  return out;
}
