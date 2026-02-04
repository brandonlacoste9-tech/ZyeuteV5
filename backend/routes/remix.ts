/**
 * Remix Routes (TikTok-style Duet/Stitch)
 * Allows users to create remixed content (duets, stitches, reactions)
 */

import { Router } from "express";
import { storage } from "../storage.js";
import { db } from "../storage.js";
import { posts } from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import { verifyAuthToken } from "../supabase-auth.js";

const router = Router();
const remixLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[RemixRoute] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[RemixRoute] ${msg}`, ...args),
};

// Middleware to verify auth
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const token = authHeader.split(" ")[1];
    const userId = await verifyAuthToken(token);
    if (!userId) {
      return res.status(401).json({ error: "Token invalide" });
    }

    req.userId = userId;
    next();
  } catch (error: any) {
    remixLogger.error("Auth error:", error);
    res.status(401).json({ error: "Erreur d'authentification" });
  }
};

/**
 * GET /api/remix/:postId
 * Get remix information for a post (remix count, remixes)
 */
router.get("/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;

    // Get remix count
    const remixCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(
        sql`${posts.originalPostId} = ${postId} AND ${posts.remixType} IS NOT NULL`,
      );

    const remixCount = Number(remixCountResult[0]?.count) || 0;

    // Get recent remixes (limit 10)
    const recentRemixes = await db
      .select()
      .from(posts)
      .where(
        sql`${posts.originalPostId} = ${postId} AND ${posts.remixType} IS NOT NULL`,
      )
      .orderBy(sql`${posts.createdAt} DESC`)
      .limit(10);

    res.json({
      success: true,
      remixCount,
      recentRemixes,
    });
  } catch (error: any) {
    remixLogger.error("Error getting remix info:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des remixes" });
  }
});

/**
 * POST /api/remix/:postId
 * Create a remix (duet, stitch, or react)
 * Body: { remixType: 'duet' | 'stitch' | 'react', mediaUrl: string, caption?: string }
 */
router.post("/:postId", requireAuth, async (req, res) => {
  try {
    const originalPostId = req.params.postId;
    const { remixType, mediaUrl, caption } = req.body;
    const userId = req.userId!;

    // Validate remix type
    if (!["duet", "stitch", "react"].includes(remixType)) {
      return res.status(400).json({
        error: "Type de remix invalide. Doit être 'duet', 'stitch', ou 'react'",
      });
    }

    // Verify original post exists
    const originalPost = await storage.getPost(originalPostId);
    if (!originalPost) {
      return res
        .status(404)
        .json({ error: "Publication originale introuvable" });
    }

    remixLogger.info(
      `User ${userId} creating ${remixType} remix of post ${originalPostId}`,
    );

    // Create remix post
    const remixPost = await storage.createPost({
      userId,
      content: caption || `Remix de @${originalPost.userId}`,
      caption: caption || "",
      mediaUrl,
      type: "video", // Remixes are always videos
      originalPostId,
      remixType,
      visibility: "public",
      hiveId: originalPost.hiveId || "quebec",
    } as any);

    // Increment remix count on original post
    await db
      .update(posts)
      .set({
        remixCount: sql`${posts.remixCount} + 1`,
      })
      .where(eq(posts.id, originalPostId));

    remixLogger.info(`Remix created: ${remixPost.id}`);

    res.status(201).json({
      success: true,
      post: remixPost,
      message: `Remix ${remixType} créé avec succès`,
    });
  } catch (error: any) {
    remixLogger.error("Error creating remix:", error);
    res.status(500).json({ error: "Erreur lors de la création du remix" });
  }
});

/**
 * GET /api/remix/:postId/remixes
 * Get all remixes of a post (paginated)
 */
router.get("/:postId/remixes", async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = page * limit;

    const remixes = await db
      .select()
      .from(posts)
      .where(
        sql`${posts.originalPostId} = ${postId} AND ${posts.remixType} IS NOT NULL`,
      )
      .orderBy(sql`${posts.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      remixes,
      page,
      limit,
    });
  } catch (error: any) {
    remixLogger.error("Error getting remixes:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des remixes" });
  }
});

export default router;
