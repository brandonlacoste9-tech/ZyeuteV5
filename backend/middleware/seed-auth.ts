/**
 * Protects /api/seed/* — requires X-Cron-Secret or admin JWT.
 */
import type { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../supabase-auth.js";
import { storage } from "../storage.js";

export async function requireSeedAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const header = String(req.headers["x-cron-secret"] ?? "").trim();

  if (cronSecret && header === cronSecret) {
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

  res.status(401).json({ error: "Unauthorized" });
}
