import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

/**
 * Feed health – checks that the feed pipeline can return data.
 *
 * Prefer Supabase HTTP (same path as GET /api/feed) so free-tier pooler
 * saturation on DATABASE_URL does not false-alarm while the FYP still works.
 * Falls back to Drizzle pool only when Supabase env is missing.
 *
 * Returns 503 only when both paths fail.
 */
router.get("/feed", async (req: Request, res: Response) => {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  // Primary: Supabase REST (matches production feed)
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase
        .from("publications")
        .select("id")
        .filter("visibility::text", "eq", "public")
        .eq("est_masque", false)
        .is("deleted_at", null)
        .limit(1);

      if (error) throw new Error(error.message);

      const count = Array.isArray(data) ? data.length : 0;
      return res.status(200).json({
        status: count > 0 ? "ok" : "empty",
        feed: count > 0 ? "ready" : "no_content",
        count,
        source: "supabase",
      });
    } catch (error: any) {
      console.error(
        "[Health] Supabase feed check failed, trying pool:",
        error?.message || error,
      );
      // fall through to pool
    }
  }

  // Fallback: direct Postgres pool (Drizzle) with a hard timeout so health
  // checks never hang 15s+ when the pooler is saturated.
  try {
    const { storage } = await import("../storage.js");
    const posts = await Promise.race([
      storage.getExplorePosts(0, 1, "quebec"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("pool_health_timeout_3s")), 3000),
      ),
    ]);
    const hasPosts = Array.isArray(posts) && posts.length > 0;
    return res.status(200).json({
      status: hasPosts ? "ok" : "empty",
      feed: hasPosts ? "ready" : "no_content",
      count: posts?.length ?? 0,
      source: "pool",
    });
  } catch (error: any) {
    console.error("[Health] Feed check failed:", error?.message || error);
    return res.status(503).json({
      status: "unhealthy",
      feed: "error",
      code: "FEED_HEALTH_FAIL",
      message: error?.message || "Feed check failed",
      hint: "Prefer Supabase REST for feed; set DATABASE_URL to session pooler :5432",
    });
  }
});

/**
 * Upload readiness — no secrets, only booleans + short diagnostics.
 * Use for smoke checks: Mux keys present, Supabase storage reachable.
 */
router.get("/upload", async (_req: Request, res: Response) => {
  const muxConfigured = Boolean(
    process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET,
  );
  const muxWebhook = Boolean(process.env.MUX_WEBHOOK_SECRET);
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const databaseUrl = process.env.DATABASE_URL || "";
  const frontendUrl =
    process.env.FRONTEND_URL || process.env.VITE_APP_URL || "";

  const checks: Record<string, unknown> = {
    muxConfigured,
    muxWebhookConfigured: muxWebhook,
    supabaseUrlConfigured: Boolean(supabaseUrl),
    serviceRoleConfigured: Boolean(serviceKey),
    serviceRoleLooksJwt: serviceKey.split(".").length === 3,
    serviceRoleLength: serviceKey.length,
    anonKeyConfigured: Boolean(anonKey),
    databaseUrlConfigured: Boolean(databaseUrl),
    databaseUrlSessionPooler:
      Boolean(databaseUrl) &&
      /:5432\b/.test(databaseUrl) &&
      !/:6543\b/.test(databaseUrl),
    databaseUrlTransactionPooler:
      Boolean(databaseUrl) && /:6543\b/.test(databaseUrl),
    frontendUrlConfigured: Boolean(frontendUrl),
    frontendUrl: frontendUrl || null,
    redisConfigured: Boolean(process.env.REDIS_URL),
  };

  let storageOk = false;
  let storageError: string | null = null;
  const storageBucket = "zyeute-videos";

  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase.storage
        .from(storageBucket)
        .list("", { limit: 1 });
      if (error) {
        storageError = error.message;
        // Bucket missing vs auth — both block surgical upload
      } else {
        storageOk = true;
        checks.storageListSample = Array.isArray(data) ? data.length : 0;
      }
    } catch (e: any) {
      storageError = e?.message || String(e);
    }
  } else {
    storageError = "missing_supabase_url_or_service_role";
  }

  // Light Mux API touch: list is not available without paid plan sometimes;
  // we only report credential presence. create-upload still requires auth.
  const ready =
    muxConfigured && Boolean(supabaseUrl) && Boolean(serviceKey) && storageOk;

  const statusCode = ready ? 200 : 503;
  return res.status(statusCode).json({
    status: ready ? "ok" : "degraded",
    upload: ready ? "ready" : "not_ready",
    checks,
    storage: {
      bucket: storageBucket,
      ok: storageOk,
      error: storageError,
    },
    paths: {
      muxCreateUpload: "POST /api/mux/create-upload (auth required)",
      surgicalUpload: "POST /api/upload/simple (auth required)",
      muxWebhook: "POST /api/mux/webhooks",
    },
  });
});

/**
 * Env config matrix (no secret values). Safe for dashboards.
 */
router.get("/env", (_req: Request, res: Response) => {
  const flag = (v: string | undefined) => Boolean(v && v.length > 0);
  const len = (v: string | undefined) => (v ? v.length : 0);

  const matrix = {
    NODE_ENV: process.env.NODE_ENV || null,
    SUPABASE_URL: flag(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    ),
    SUPABASE_SERVICE_ROLE_KEY: flag(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_SERVICE_ROLE_KEY_len: len(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_ANON_KEY: flag(
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    ),
    DATABASE_URL: flag(process.env.DATABASE_URL),
    DATABASE_URL_port: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.includes(":6543")
        ? 6543
        : process.env.DATABASE_URL.includes(":5432")
          ? 5432
          : "other"
      : null,
    MUX_TOKEN_ID: flag(process.env.MUX_TOKEN_ID),
    MUX_TOKEN_SECRET: flag(process.env.MUX_TOKEN_SECRET),
    MUX_WEBHOOK_SECRET: flag(process.env.MUX_WEBHOOK_SECRET),
    FRONTEND_URL: flag(process.env.FRONTEND_URL),
    REDIS_URL: flag(process.env.REDIS_URL),
    SESSION_SECRET: flag(process.env.SESSION_SECRET),
    STRIPE_SECRET_KEY: flag(process.env.STRIPE_SECRET_KEY),
  };

  const missingCritical = (
    [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "MUX_TOKEN_ID",
      "MUX_TOKEN_SECRET",
    ] as const
  ).filter((k) => {
    if (k === "SUPABASE_URL") return !matrix.SUPABASE_URL;
    return !(matrix as any)[k];
  });

  const missingRecommended = (
    ["DATABASE_URL", "FRONTEND_URL", "MUX_WEBHOOK_SECRET", "REDIS_URL"] as const
  ).filter((k) => !(matrix as any)[k]);

  res.status(200).json({
    status: missingCritical.length ? "incomplete" : "ok",
    matrix,
    missingCritical,
    missingRecommended,
  });
});

export default router;
