import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";

/** Founder, moderator, or is_admin — profile mod tools + moderation dashboard. */
export async function requireModerator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  const user = await storage.getUser(userId);
  if (
    !user ||
    (user.role !== "moderator" && user.role !== "founder" && !user.isAdmin)
  ) {
    return res.status(403).json({ error: "Accès refusé. Modérateur requis." });
  }

  next();
}
