/**
 * AUTH MIDDLEWARE
 * 
 * TODO: Replace with Clerk session verification once integrated
 */

import { Request, Response, NextFunction } from "express";
// TODO: Replace with authClient abstraction once Clerk is integrated
import { verifyAuthToken } from "../supabase-auth.js";
import { storage } from "../storage.js";

// Ensure Request has userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Strategy: Check for JWT (Bearer Token)
  // TODO: Replace with Clerk session verification once integrated
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    // TODO: Replace verifyAuthToken with Clerk session verification
    const userId = await verifyAuthToken(token);

    if (userId) {
      // Check if user is banned
      const user = await storage.getUser(userId);
      if (user?.role === "banned") {
        return res.status(403).json({
          error:
            "Votre compte a été désactivé en raison d'une violation grave de nos protocoles de sécurité. Zyeuté applique une politique de tolérance zéro concernant toute forme de leurre, grooming ou interaction inappropriée impliquant des mineurs.",
          isBanned: true,
        });
      }

      req.userId = userId;
      return next();
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const userId = await verifyAuthToken(token);

    if (userId) {
      req.userId = userId;
    }
  }
  next();
}
