/**
 * TikWM public API — fetch hashtag challenge posts without TikAPI quota.
 * https://www.tikwm.com/api/challenge/posts?challenge_id=&count=&cursor=
 */
import axios from "axios";
import type { TikTokVideo } from "./tiktok-scraper-service.js";
import {
  REGIONAL_HASHTAG_SEEDS,
  VIRAL_HASHTAG_SEEDS,
  type FeedSeedCandidate,
  type HashtagSeed,
} from "./tikapi-hashtag.js";

const TIKWM_BASE = "https://www.tikwm.com/api";

export type TikwmChallengePostsResponse = {
  code?: number;
  data?: {
    videos?: Record<string, unknown>[];
    cursor?: number;
    hasMore?: boolean;
  };
};

export function mapTikwmItemToVideo(
  item: Record<string, unknown>,
): TikTokVideo | null {
  const videoId = String(item.video_id ?? item.aweme_id ?? "").trim();
  const play = String(
    item.play ?? item.wmplay ?? item.hdplay ?? item.video ?? "",
  ).trim();
  if (!videoId || !play.startsWith("http")) return null;

  const author = (item.author ?? {}) as Record<string, unknown>;
  const handle = String(
    author.unique_id ?? author.uniqueId ?? author.nickname ?? "unknown",
  );
  const nickname = String(author.nickname ?? handle);

  return {
    video_id: videoId,
    caption: String(item.title ?? item.desc ?? "").slice(0, 500),
    author: {
      handle,
      nickname,
      avatar: String(author.avatar ?? ""),
    },
    media: {
      video_url: play,
      hd_video_url: String(item.hdplay ?? play),
    },
    thumbnails: {
      cover_url: String(
        item.cover ?? item.origin_cover ?? item.dynamic_cover ?? "",
      ),
    },
    stats: {
      likes: Number(item.digg_count ?? item.like_count ?? 0),
      views: Number(item.play_count ?? item.view_count ?? 0),
      shares: Number(item.share_count ?? 0),
      comments: Number(item.comment_count ?? 0),
    },
    original_url: `https://www.tiktok.com/@${handle}/video/${videoId}`,
    provider: "tikwm",
  };
}

export async function fetchTikwmChallengePosts(
  challengeId: string,
  count = 12,
  cursor = 0,
): Promise<Record<string, unknown>[]> {
  const res = await axios.get<TikwmChallengePostsResponse>(
    `${TIKWM_BASE}/challenge/posts`,
    {
      params: { challenge_id: challengeId, count, cursor },
      timeout: 45000,
      headers: { "User-Agent": "ZyeuteFeedSeed/1.0" },
    },
  );
  if (res.data?.code !== 0) return [];
  return res.data?.data?.videos ?? [];
}

async function collectFromTags(
  tags: HashtagSeed[],
  perTag: number,
  sourcePrefix: string,
): Promise<FeedSeedCandidate[]> {
  const out: FeedSeedCandidate[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    if (!tag.id) continue;
    try {
      const items = await fetchTikwmChallengePosts(tag.id, perTag);
      for (const item of items) {
        const mapped = mapTikwmItemToVideo(item);
        if (!mapped?.video_id || seen.has(mapped.video_id)) continue;
        seen.add(mapped.video_id);
        out.push({
          video: mapped,
          region: tag.region,
          source: `${sourcePrefix}:${tag.name}`,
        });
      }
    } catch (e: unknown) {
      console.warn(
        `[TikWM] #${tag.name} failed:`,
        e instanceof Error ? e.message : String(e),
      );
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  return out;
}

/** Collect Québec/Montreal + a few viral tags via TikWM (no API key). */
export async function collectTikwmFeedSeedCandidates(opts?: {
  regionalPerTag?: number;
  viralPerTag?: number;
}): Promise<FeedSeedCandidate[]> {
  const regionalPerTag = opts?.regionalPerTag ?? 10;
  const viralPerTag = opts?.viralPerTag ?? 6;
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
    await collectFromTags(
      REGIONAL_HASHTAG_SEEDS.filter((t) => t.id),
      regionalPerTag,
      "tikwm:regional",
    ),
  );
  append(
    await collectFromTags(
      VIRAL_HASHTAG_SEEDS.filter((t) => t.id).slice(0, 4),
      viralPerTag,
      "tikwm:viral",
    ),
  );

  return merged;
}
