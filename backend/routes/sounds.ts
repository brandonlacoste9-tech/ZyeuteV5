/**
 * Sounds/Music Library Routes (TikTok-style)
 * Manage sound library for videos
 */

import { Router } from "express";
import { storage } from "../storage.js";
import { db } from "../storage.js";
import { sounds, posts } from "../../shared/schema.js";
import { eq, desc, sql, like, or } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import { verifyAuthToken } from "../supabase-auth.js";

const router = Router();
const soundLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[SoundRoute] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[SoundRoute] ${msg}`, ...args),
};

/**
 * GET /api/sounds
 * Get sounds (trending, by category, search)
 * Query params: category, search, trending, limit, page
 */
router.get("/", async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const trending = req.query.trending === "true";
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 0;
    const offset = page * limit;

    let query = db.select().from(sounds);

    // Apply filters
    if (trending) {
      // Order by use count (most used = trending)
      query = query.orderBy(desc(sounds.useCount), desc(sounds.createdAt));
    } else if (category) {
      query = query.where(eq(sounds.category, category));
    } else if (search) {
      query = query.where(
        or(
          like(sounds.title, `%${search}%`),
          like(sounds.artist || "", `%${search}%`),
        ),
      );
    } else {
      // Default: newest first
      query = query.orderBy(desc(sounds.createdAt));
    }

    const soundList = await query.limit(limit).offset(offset);

    res.json({
      success: true,
      sounds: soundList,
      page,
      limit,
    });
  } catch (error: any) {
    soundLogger.error("Error getting sounds:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des sons" });
  }
});

/**
 * GET /api/sounds/trending
 * Get trending sounds (most used in last 7 days)
 */
router.get("/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    // Get sounds used in videos created in last 7 days
    const trendingSounds = await db
      .select({
        sound: sounds,
        recentUseCount: sql<number>`count(${posts.id})::int`,
      })
      .from(sounds)
      .leftJoin(
        posts,
        sql`${posts.soundId} = ${sounds.id} AND ${posts.createdAt} > NOW() - INTERVAL '7 days'`,
      )
      .groupBy(sounds.id)
      .orderBy(desc(sql`count(${posts.id})`), desc(sounds.useCount))
      .limit(limit);

    res.json({
      success: true,
      sounds: trendingSounds.map((s) => s.sound),
    });
  } catch (error: any) {
    soundLogger.error("Error getting trending sounds:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des sons tendance" });
  }
});

/**
 * GET /api/sounds/:soundId
 * Get sound details
 */
router.get("/:soundId", async (req, res) => {
  try {
    const soundId = req.params.soundId;

    const sound = await db
      .select()
      .from(sounds)
      .where(eq(sounds.id, soundId))
      .limit(1);

    if (!sound || sound.length === 0) {
      return res.status(404).json({ error: "Son introuvable" });
    }

    // Get videos using this sound
    const videosUsingSound = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.soundId, soundId));

    res.json({
      success: true,
      sound: sound[0],
      useCount: Number(videosUsingSound[0]?.count) || 0,
    });
  } catch (error: any) {
    soundLogger.error("Error getting sound:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du son" });
  }
});

/**
 * POST /api/sounds
 * Create/upload a new sound
 * Body: { title, artist?, audioUrl, coverImageUrl?, category?, isOriginal? }
 */
router.post("/", async (req, res) => {
  try {
    // Verify auth
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      userId = await verifyAuthToken(authHeader.split(" ")[1]);
    }

    const { title, artist, audioUrl, coverImageUrl, category, isOriginal } =
      req.body;

    if (!title || !audioUrl) {
      return res.status(400).json({
        error: "title et audioUrl sont requis",
      });
    }

    soundLogger.info(
      `Creating sound: ${title}${userId ? ` by user ${userId}` : ""}`,
    );

    // Create sound
    const [newSound] = await db
      .insert(sounds)
      .values({
        title,
        artist: artist || null,
        audioUrl,
        coverImageUrl: coverImageUrl || null,
        category: category || "original",
        isOriginal: isOriginal || false,
        createdBy: userId || null,
      })
      .returning();

    res.status(201).json({
      success: true,
      sound: newSound,
    });
  } catch (error: any) {
    soundLogger.error("Error creating sound:", error);
    res.status(500).json({ error: "Erreur lors de la création du son" });
  }
});

/**
 * POST /api/sounds/:soundId/use
 * Mark sound as used (increment use count)
 * Called when a video uses this sound
 */
router.post("/:soundId/use", async (req, res) => {
  try {
    const soundId = req.params.soundId;

    // Increment use count
    await db
      .update(sounds)
      .set({
        useCount: sql`${sounds.useCount} + 1`,
      })
      .where(eq(sounds.id, soundId));

    res.json({
      success: true,
      message: "Son marqué comme utilisé",
    });
  } catch (error: any) {
    soundLogger.error("Error marking sound as used:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du son" });
  }
});

export default router;
