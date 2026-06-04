/**
 * Pixabay Video API — free stock clips (portrait-friendly).
 * https://pixabay.com/api/docs/#api_search_videos
 */
import axios from "axios";

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY?.trim();
const BASE = "https://pixabay.com/api/videos/";

export type PixabayVideoHit = {
  id: number;
  tags: string;
  videos: {
    large?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    tiny?: { url: string; width: number; height: number };
  };
  user: string;
  userImageURL?: string;
};

export function pickPixabayPlayUrl(hit: PixabayVideoHit): string | null {
  const candidates = [
    hit.videos.medium,
    hit.videos.large,
    hit.videos.small,
    hit.videos.tiny,
  ].filter(Boolean) as { url: string; width: number; height: number }[];

  const portrait = candidates.find((v) => v.height >= v.width);
  const pick = portrait ?? candidates[0];
  return pick?.url?.startsWith("http") ? pick.url : null;
}

export async function searchPixabayVideos(
  query: string,
  perPage = 15,
  page = 1,
): Promise<PixabayVideoHit[]> {
  if (!PIXABAY_API_KEY) {
    throw new Error("PIXABAY_API_KEY missing");
  }
  const res = await axios.get<{
    hits?: PixabayVideoHit[];
    totalHits?: number;
  }>(BASE, {
    params: {
      key: PIXABAY_API_KEY,
      q: query,
      per_page: Math.min(200, perPage),
      page,
      video_type: "all",
      safesearch: true,
    },
    timeout: 30000,
  });
  return res.data?.hits ?? [];
}

export function isPixabayConfigured(): boolean {
  return !!PIXABAY_API_KEY;
}
