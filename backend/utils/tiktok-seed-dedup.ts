import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPool } from "../storage.js";

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Walk Error.cause chain for clearer prod diagnostics (Drizzle wraps pg errors). */
export function formatDbError(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  while (current instanceof Error) {
    parts.push(current.message);
    current = current.cause;
  }
  if (parts.length === 0) return String(err);
  return parts.join(" | cause: ");
}

export type TikTokDedupCheckResult =
  | { status: "new" }
  | { status: "duplicate"; postId?: string }
  | { status: "unavailable"; detail: string };

async function rpcExistingTikTokIdsSupabase(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Set<string> | null> {
  const { data, error } = await supabase.rpc("existing_tiktok_ids", { ids });

  if (!error && Array.isArray(data)) {
    return new Set(data.filter((x): x is string => typeof x === "string"));
  }

  if (error) {
    console.warn(
      "[tiktok-dedup] existing_tiktok_ids RPC unavailable:",
      error.message,
    );
  }
  return null;
}

async function rpcExistingTikTokIdsPg(
  ids: string[],
): Promise<Set<string> | null> {
  const client = await getPool().connect();
  try {
    const res = await client.query<{ ids: string[] | null }>(
      `SELECT existing_tiktok_ids($1::text[]) AS ids`,
      [ids],
    );
    const arr = res.rows[0]?.ids;
    if (Array.isArray(arr)) {
      return new Set(arr.filter((x): x is string => typeof x === "string"));
    }
    return null;
  } catch (err) {
    console.warn(
      "[tiktok-dedup] pg existing_tiktok_ids RPC failed:",
      formatDbError(err),
    );
    return null;
  } finally {
    client.release();
  }
}

async function isDuplicateSupabase(
  supabase: SupabaseClient,
  tiktokId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("publications")
    .select("id")
    .contains("media_metadata", { tiktok_id: tiktokId })
    .is("deleted_at", null)
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.[0]?.id as string | undefined) ?? null;
}

async function isDuplicatePg(tiktokId: string): Promise<string | null> {
  const client = await getPool().connect();
  try {
    const res = await client.query(
      `SELECT id FROM publications
       WHERE media_metadata->>'tiktok_id' = $1
         AND deleted_at IS NULL
       LIMIT 1`,
      [tiktokId],
    );
    return (res.rows[0]?.id as string | undefined) ?? null;
  } finally {
    client.release();
  }
}

/**
 * Per-video duplicate check. Prefers `existing_tiktok_ids` RPC (security definer);
 * never throws — returns `unavailable` when every path fails.
 */
export async function checkTikTokDuplicate(
  tiktokId: string,
): Promise<TikTokDedupCheckResult> {
  if (!tiktokId) return { status: "new" };

  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const existing = await rpcExistingTikTokIdsSupabase(supabase, [tiktokId]);
      if (existing !== null) {
        if (existing.has(tiktokId)) {
          try {
            const postId = await isDuplicateSupabase(supabase, tiktokId);
            return { status: "duplicate", postId: postId ?? undefined };
          } catch (err) {
            console.warn(
              "[tiktok-dedup] Supabase post-id lookup failed:",
              formatDbError(err),
            );
            return { status: "duplicate" };
          }
        }
        return { status: "new" };
      }
    } catch (err) {
      console.warn(
        "[tiktok-dedup] Supabase RPC duplicate check failed:",
        formatDbError(err),
      );
    }
  }

  try {
    const existing = await rpcExistingTikTokIdsPg([tiktokId]);
    if (existing !== null) {
      if (existing.has(tiktokId)) {
        try {
          const postId = await isDuplicatePg(tiktokId);
          return { status: "duplicate", postId: postId ?? undefined };
        } catch (err) {
          console.warn(
            "[tiktok-dedup] pg post-id lookup failed:",
            formatDbError(err),
          );
          return { status: "duplicate" };
        }
      }
      return { status: "new" };
    }
  } catch (err) {
    console.warn(
      "[tiktok-dedup] pg RPC duplicate check failed:",
      formatDbError(err),
    );
  }

  if (supabase) {
    try {
      const postId = await isDuplicateSupabase(supabase, tiktokId);
      if (postId) return { status: "duplicate", postId };
      return { status: "new" };
    } catch (err) {
      console.warn(
        "[tiktok-dedup] Supabase contains duplicate check failed:",
        formatDbError(err),
      );
    }
  }

  try {
    const postId = await isDuplicatePg(tiktokId);
    if (postId) return { status: "duplicate", postId };
    return { status: "new" };
  } catch (err) {
    console.warn(
      "[tiktok-dedup] pg duplicate check failed:",
      formatDbError(err),
    );
    return { status: "unavailable", detail: formatDbError(err) };
  }
}

/**
 * Returns publication id when tiktok_id already exists (active row).
 * Prefers Supabase `existing_tiktok_ids` RPC; never throws.
 */
export async function findExistingTikTokPostId(
  tiktokId: string,
): Promise<string | null> {
  const result = await checkTikTokDuplicate(tiktokId);
  if (result.status === "duplicate") return result.postId ?? null;
  return null;
}

/** Which candidate TikTok video_ids already exist in publications. */
export async function getExistingTikTokIds(
  supabase: SupabaseClient,
  candidateIds: string[],
): Promise<Set<string>> {
  const ids = [...new Set(candidateIds.filter(Boolean))];
  if (ids.length === 0) return new Set();

  const fromRpc = await rpcExistingTikTokIdsSupabase(supabase, ids);
  if (fromRpc !== null) return fromRpc;

  const existing = new Set<string>();
  for (const id of ids) {
    try {
      const postId = await isDuplicateSupabase(supabase, id);
      if (postId) existing.add(id);
    } catch (err) {
      console.warn(
        `[tiktok-dedup] Supabase fallback check failed for ${id}:`,
        formatDbError(err),
      );
    }
  }
  return existing;
}

async function getExistingTikTokIdsPg(
  candidateIds: string[],
): Promise<Set<string>> {
  const ids = [...new Set(candidateIds.filter(Boolean))];
  if (ids.length === 0) return new Set();

  const fromRpc = await rpcExistingTikTokIdsPg(ids);
  if (fromRpc !== null) return fromRpc;

  const existing = new Set<string>();
  for (const id of ids) {
    try {
      const postId = await isDuplicatePg(id);
      if (postId) existing.add(id);
    } catch (err) {
      console.warn(
        `[tiktok-dedup] pg fallback check failed for ${id}:`,
        formatDbError(err),
      );
    }
  }
  return existing;
}

export async function filterUnseenTikTokVideos<T extends { video_id: string }>(
  videos: T[],
): Promise<{ unseen: T[]; skippedDuplicate: number }> {
  const candidateIds = videos.map((v) => v.video_id).filter(Boolean);
  if (candidateIds.length === 0) {
    return { unseen: videos, skippedDuplicate: 0 };
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const existing = await getExistingTikTokIds(supabase, candidateIds);
      const unseen = videos.filter((v) => !existing.has(v.video_id));
      return {
        unseen,
        skippedDuplicate: videos.length - unseen.length,
      };
    } catch (err) {
      console.warn(
        "[tiktok-dedup] Supabase batch dedup failed:",
        formatDbError(err),
      );
    }
  }

  try {
    const existing = await getExistingTikTokIdsPg(candidateIds);
    const unseen = videos.filter((v) => !existing.has(v.video_id));
    return {
      unseen,
      skippedDuplicate: videos.length - unseen.length,
    };
  } catch (err) {
    console.warn(
      "[tiktok-dedup] batch dedup failed, skipping pre-filter:",
      formatDbError(err),
    );
    return { unseen: videos, skippedDuplicate: 0 };
  }
}
