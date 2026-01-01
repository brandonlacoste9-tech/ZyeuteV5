import express from "express";
import { db } from "../storage.js";
import { posts } from "@shared/schema";
import { desc, isNotNull, or } from "drizzle-orm";

export const presenceRouter = express.Router();

/**
 * GET /api/presence/map
 * Returns the latest 100 posts with coordinates for the Swarm Presence Map.
 */

const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  montreal: { lat: 45.5017, lng: -73.5673 },
  quebec: { lat: 46.8139, lng: -71.208 },
  gatineau: { lat: 45.4287, lng: -75.7013 },
  sherbrooke: { lat: 45.401, lng: -71.8922 },
  "trois-rivieres": { lat: 46.3416, lng: -72.5421 },
  saguenay: { lat: 48.4287, lng: -71.0664 },
  levis: { lat: 46.8033, lng: -71.1772 },
  laval: { lat: 45.5601, lng: -73.7121 },
  longueuil: { lat: 45.5312, lng: -73.518 },
  gaspesie: { lat: 48.831, lng: -64.4851 },
  charlevoix: { lat: 47.6, lng: -70.4 },
  estrie: { lat: 45.3, lng: -71.3 },
  laurentides: { lat: 46.2, lng: -74.3 },
  mauricie: { lat: 46.5, lng: -72.8 },
  abitibi: { lat: 48.2, lng: -77.9 },
};

presenceRouter.get("/map", async (req, res) => {
  try {
    const postsWithLocation = await db
      .select({
        id: posts.id,
        location: posts.location,
        city: posts.city,
        region: posts.region,
        regionId: posts.regionId,
        fireCount: posts.fireCount,
        title: posts.caption,
        thumbnail: posts.thumbnailUrl,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(or(isNotNull(posts.location), isNotNull(posts.regionId)))
      .orderBy(desc(posts.createdAt))
      .limit(100);

    const activePoints = postsWithLocation
      .map((p) => {
        let lat = 0;
        let lng = 0;

        if (p.location && typeof p.location === "object") {
          // Assuming PostGIS location object format
          const loc = p.location as any;
          lat = loc.y || loc.lat || 0;
          lng = loc.x || loc.lng || 0;
        } else if (p.regionId && REGION_COORDS[p.regionId]) {
          lat = REGION_COORDS[p.regionId].lat;
          lng = REGION_COORDS[p.regionId].lng;
        }

        return {
          ...p,
          lat,
          lng,
        };
      })
      .filter((p) => p.lat !== 0);

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
