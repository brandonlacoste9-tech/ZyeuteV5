import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Which candidate TikTok video_ids already exist in publications. */
export async function getExistingTikTokIds(
  supabase: SupabaseClient,
  candidateIds: string[],
): Promise<Set<string>> {
  const ids = [...new Set(candidateIds.filter(Boolean))];
  if (ids.length === 0) return new Set();

  const { data, error } = await supabase.rpc("existing_tiktok_ids", { ids });

  if (!error && Array.isArray(data)) {
    return new Set(data.filter((x): x is string => typeof x === "string"));
  }

  // Fallback when RPC/migration not applied yet
  const existing = new Set<string>();
  for (const id of ids) {
    const { data: rows } = await supabase
      .from("publications")
      .select("id")
      .contains("media_metadata", { tiktok_id: id })
      .is("deleted_at", null)
      .limit(1);
    if (rows?.length) existing.add(id);
  }
  return existing;
}

export async function filterUnseenTikTokVideos<T extends { video_id: string }>(
  videos: T[],
): Promise<{ unseen: T[]; skippedDuplicate: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { unseen: videos, skippedDuplicate: 0 };
  }

  const candidateIds = videos.map((v) => v.video_id).filter(Boolean);
  const existing = await getExistingTikTokIds(supabase, candidateIds);
  const unseen = videos.filter((v) => !existing.has(v.video_id));
  return {
    unseen,
    skippedDuplicate: videos.length - unseen.length,
  };
}
