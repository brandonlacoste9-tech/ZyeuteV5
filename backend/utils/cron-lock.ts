import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_TTL_MINUTES = 30;

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Remove locks older than TTL (crashed runs). */
async function clearStaleLock(
  supabase: SupabaseClient,
  name: string,
  ttlMinutes: number,
): Promise<void> {
  const cutoff = new Date(Date.now() - ttlMinutes * 60_000).toISOString();
  await supabase
    .from("cron_locks")
    .delete()
    .eq("name", name)
    .lt("acquired_at", cutoff);
}

/**
 * Try to acquire a named cron lock. Returns false if another run holds it.
 * Requires SUPABASE_SERVICE_ROLE_KEY and migrations/0016_cron_locks_tiktok_unique.sql.
 */
export async function acquireCronLock(
  name: string,
  ttlMinutes = DEFAULT_TTL_MINUTES,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn(
      "[cron-lock] SUPABASE_SERVICE_ROLE_KEY missing — proceeding without lock",
    );
    return true;
  }

  await clearStaleLock(supabase, name, ttlMinutes);

  const { error } = await supabase.from("cron_locks").insert({ name });

  if (error) {
    if (error.code === "23505") {
      return false;
    }
    if (
      error.message?.includes("cron_locks") &&
      error.message?.includes("does not exist")
    ) {
      console.warn(
        "[cron-lock] cron_locks table missing — run migrations/0016_cron_locks_tiktok_unique.sql",
      );
      return true;
    }
    throw new Error(
      error.message || `cron lock insert failed (${error.code ?? "unknown"})`,
    );
  }

  return true;
}

export async function releaseCronLock(name: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("cron_locks").delete().eq("name", name);
}

/** Run fn under lock; skip (return null) if another run is active. */
export async function withCronLock<T>(
  name: string,
  fn: () => Promise<T>,
  options?: { ttlMinutes?: number },
): Promise<T | null> {
  const acquired = await acquireCronLock(name, options?.ttlMinutes);
  if (!acquired) {
    return null;
  }
  try {
    return await fn();
  } finally {
    await releaseCronLock(name);
  }
}
