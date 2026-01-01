import express from "express";
import { db } from "../storage.js";
import { posts } from "@shared/schema";
import { desc, isNotNull } from "drizzle-orm";

export const presenceRouter = express.Router();

/**
 * GET /api/presence/map
 * Returns the latest 100 posts with coordinates for the Swarm Presence Map.
 */
presenceRouter.get("/map", async (req, res) => {
  try {
    const activePoints = await db
      .select({
        id: posts.id,
        location: posts.location,
        city: posts.city,
        region: posts.region,
        fireCount: posts.fireCount,
        title: posts.caption,
        thumbnail: posts.thumbnailUrl,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(isNotNull(posts.location))
      .orderBy(desc(posts.createdAt))
      .limit(100);

    res.json({
      hive: "quebec",
      timestamp: new Date().toISOString(),
      points: activePoints,
    });
  } catch (error) {
    console.error("❌ Map data fetch error:", error);
    res.status(500).json({ error: "Failed to fetch presence map data" });
  }
});

export default presenceRouter;
