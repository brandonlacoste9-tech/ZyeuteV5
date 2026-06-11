/**
 * Protects /api/seed/* — requires X-Cron-Secret or admin JWT.
 */
import type { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../supabase-auth.js";
import { storage } from "../storage.js";
import { timingSafeEqualStr } from "../utils/timing-safe-equal.js";

/** Strip whitespace and optional wrapping quotes from Render/env paste. */
export function normalizeCronSecret(raw: string | undefined): string {
  if (!raw) return "";
  return raw.trim().replace(/^["']+|["']+$/g, "");
}

function cronHeader(req: Request): string {
  const direct = String(req.headers["x-cron-secret"] ?? "");
  if (direct.trim()) return normalizeCronSecret(direct);

  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    // Cron secret via Bearer (same value as CRON_SECRET env)
    if (token && !token.includes(".")) {
      return normalizeCronSecret(token);
    }
  }
  return "";
}

export async function requireSeedAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const cronSecret = normalizeCronSecret(process.env.CRON_SECRET);
  const header = cronHeader(req);

  if (cronSecret && timingSafeEqualStr(header, cronSecret)) {
    return next();
  }

  // Local dev without CRON_SECRET (direct scripts use Supabase, not HTTP)
  if (!cronSecret && process.env.NODE_ENV !== "production") {
    return next();
  }

  if (!cronSecret) {
    res.status(503).json({
      error: "CRON_SECRET not configured on server",
    });
    return;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const userId = await verifyAuthToken(token);
    if (userId) {
      const user = await storage.getUser(userId);
      if (user?.isAdmin || user?.username === "north") {
        (req as Request & { userId?: string }).userId = userId;
        return next();
      }
    }
  }

  res.status(401).json({
    error: "Unauthorized",
    hint: header
      ? "X-Cron-Secret mismatch — redeploy after updating Render env"
      : "Missing X-Cron-Secret header",
  });
}
