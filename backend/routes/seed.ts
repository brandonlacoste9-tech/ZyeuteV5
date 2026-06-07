/**
 * Seed Route - Emergency feed population endpoint
 * Populates the feed with sample Pexels videos when database is empty
 */

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireSeedAccess } from "../middleware/seed-auth.js";

const router = Router();
router.use(requireSeedAccess);

// Sample Pexels video URLs for Quebec-themed content
const SAMPLE_VIDEOS = [
  {
    caption: "🎬 Bienvenue sur Zyeuté! #Quebec #Video",
    media_url:
      "https://videos.pexels.com/video-files/857251/857251-hd_1920_1080_25fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/857251/pexels-photo-857251.jpeg",
  },
  {
    caption: "🌆 La ville de Montréal la nuit #Montreal #Night",
    media_url:
      "https://videos.pexels.com/video-files/3214448/3214448-uhd_2560_1440_25fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/3214448/pexels-photo-3214448.jpeg",
  },
  {
    caption: "🍁 Beauté du Québec #Nature #Quebec",
    media_url:
      "https://videos.pexels.com/video-files/4824363/4824363-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/4824363/pexels-photo-4824363.jpeg",
  },
  {
    caption: "💃 Danse et culture #Dance #Culture",
    media_url:
      "https://videos.pexels.com/video-files/5896379/5896379-uhd_2560_1440_25fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/5896379/pexels-photo-5896379.jpeg",
  },
  {
    caption: "🏙️ Vie urbaine #CityLife #Urban",
    media_url:
      "https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_24fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/4763824/pexels-photo-4763824.jpeg",
  },
  {
    caption: "🎵 Musique québécoise #Musique #Quebec",
    media_url:
      "https://videos.pexels.com/video-files/2278095/2278095-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/2278095/pexels-photo-2278095.jpeg",
  },
  {
    caption: "🏔️ Les Laurentides en été #Nature #Laurentides",
    media_url:
      "https://videos.pexels.com/video-files/1448735/1448735-uhd_2560_1440_24fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/1448735/pexels-photo-1448735.jpeg",
  },
  {
    caption: "🍺 Microbrasserie québécoise #Bière #Quebec",
    media_url:
      "https://videos.pexels.com/video-files/3066561/3066561-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/3066561/pexels-photo-3066561.jpeg",
  },
  {
    caption: "❄️ Carnaval de Québec #Carnaval #HiverQC",
    media_url:
      "https://videos.pexels.com/video-files/2611709/2611709-uhd_2560_1440_25fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/2611709/pexels-photo-2611709.jpeg",
  },
  {
    caption: "🎨 Art de rue Montréal #StreetArt #Montreal",
    media_url:
      "https://videos.pexels.com/video-files/4761395/4761395-uhd_2560_1440_25fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/4761395/pexels-photo-4761395.jpeg",
  },
];

/**
 * POST /api/seed/feed - Seed the feed with sample videos
 */
router.post("/feed", async (req, res) => {
  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Missing Supabase configuration",
        details: "SUPABASE_SERVICE_ROLE_KEY not set",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if there's at least one user
    const { data: users, error: userError } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(1);

    if (userError) {
      return res.status(500).json({
        error: "Database error checking users",
        details: userError.message,
      });
    }

    if (!users || users.length === 0) {
      return res.status(400).json({
        error: "No users found",
        details: "Create a user account first before seeding posts",
      });
    }

    const userId = users[0].id;

    // Insert sample videos
    const insertedPosts = [];
    for (const video of SAMPLE_VIDEOS) {
      const { data, error } = await supabase
        .from("publications")
        .insert({
          user_id: userId,
          caption: video.caption,
          content: video.caption,
          media_url: video.media_url,
          thumbnail_url: video.thumbnail,
          type: "video",
          visibility: "public",
          hive_id: "quebec",
          region_id: "montreal",
          city: "Montréal",
          reactions_count: Math.floor(Math.random() * 50) + 5,
          comments_count: Math.floor(Math.random() * 10),
          shares_count: 0,
          piasse_count: 0,
          processing_status: "completed",
          est_masque: false,
          moderation_approved: true,
          deleted_at: null,
        })
        .select("id, caption, media_url")
        .single();

      if (error) {
        console.error("Insert error:", error);
        continue;
      }

      insertedPosts.push(data);
    }

    res.json({
      success: true,
      message: `Seeded ${insertedPosts.length} videos to the feed`,
      posts: insertedPosts,
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    res.status(500).json({
      error: "Seed failed",
      details: error.message,
    });
  }
});

/**
 * GET /api/seed/status - Check if feed needs seeding
 */
router.get("/status", async (req, res) => {
  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Missing Supabase configuration",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Count posts
    const { count, error } = await supabase
      .from("publications")
      .select("*", { count: "exact", head: true });

    if (error) {
      return res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }

    res.json({
      postsCount: count || 0,
      needsSeeding: (count || 0) === 0,
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Status check failed",
      details: error.message,
    });
  }
});

// ─── Mexico Pexels videos ─────────────────────────────────────────────────────
const MEXICO_VIDEOS = [
  {
    caption: "🌮 Los mejores tacos de CDMX #mexico #cdmx #tacos #fyp",
    media_url:
      "https://videos.pexels.com/video-files/3214448/3214448-uhd_2560_1440_25fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/3214448/pexels-photo-3214448.jpeg",
  },
  {
    caption: "🏖️ Cancún paradise 🇲🇽 #cancun #mexico #playa #viral",
    media_url:
      "https://videos.pexels.com/video-files/5532774/5532774-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/5532774/pexels-photo-5532774.jpeg",
  },
  {
    caption: "🎭 Lucha Libre en vivo! #luchaLibre #mexico #cdmx",
    media_url:
      "https://videos.pexels.com/video-files/4761395/4761395-uhd_2560_1440_25fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/4761395/pexels-photo-4761395.jpeg",
  },
  {
    caption: "🌆 Ciudad de México de noche ✨ #cdmx #nightlife #mexico",
    media_url:
      "https://videos.pexels.com/video-files/2278095/2278095-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/2278095/pexels-photo-2278095.jpeg",
  },
  {
    caption: "💃 Baile tradicional mexicano 🇲🇽 #folclor #mexico #viral",
    media_url:
      "https://videos.pexels.com/video-files/5896379/5896379-uhd_2560_1440_25fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/5896379/pexels-photo-5896379.jpeg",
  },
  {
    caption: "🌋 Popocatépetl desde el aire #volcan #mexico #naturaleza",
    media_url:
      "https://videos.pexels.com/video-files/1448735/1448735-uhd_2560_1440_24fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/1448735/pexels-photo-1448735.jpeg",
  },
  {
    caption: "🍺 Cerveza y amigos 🇲🇽 #mexico #fiesta #viral #fyp",
    media_url:
      "https://videos.pexels.com/video-files/3066561/3066561-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/3066561/pexels-photo-3066561.jpeg",
  },
  {
    caption: "🎸 Mariachi en la Plaza Garibaldi #mariachi #mexico #cdmx",
    media_url:
      "https://videos.pexels.com/video-files/857251/857251-hd_1920_1080_25fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/857251/pexels-photo-857251.jpeg",
  },
  {
    caption: "🏟️ Estadio Azteca puro corazón #futbol #mexico #tri",
    media_url:
      "https://videos.pexels.com/video-files/4824363/4824363-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/4824363/pexels-photo-4824363.jpeg",
  },
  {
    caption: "🌅 Amanecer en Oaxaca 😍 #oaxaca #mexico #travel #fyp",
    media_url:
      "https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_24fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/4763824/pexels-photo-4763824.jpeg",
  },
];

/**
 * POST /api/seed/mexico - Seed Mexico hive feed with sample videos
 */
router.post("/mexico", async (req, res) => {
  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use Brandon's account as the seed author (same as Quebec)
    const BRANDON_ID = "46db6dc0-060d-4ffd-ba5e-0dfe46878855";

    const insertedPosts = [];
    for (const video of MEXICO_VIDEOS) {
      const { data, error } = await supabase
        .from("publications")
        .insert({
          user_id: BRANDON_ID,
          caption: video.caption,
          content: video.caption,
          media_url: video.media_url,
          thumbnail_url: video.thumbnail,
          type: "video",
          visibility: "public",
          hive_id: "mexico",
          region_id: "cdmx",
          city: "Ciudad de México",
          reactions_count: Math.floor(Math.random() * 150) + 20,
          comments_count: Math.floor(Math.random() * 20),
          shares_count: Math.floor(Math.random() * 10),
          piasse_count: 0,
          processing_status: "completed",
          est_masque: false,
          moderation_approved: true,
          deleted_at: null,
        })
        .select("id, caption, media_url")
        .single();

      if (error) {
        console.error("[Seed Mexico] Insert error:", error);
        continue;
      }

      insertedPosts.push(data);
    }

    res.json({
      success: true,
      message: `Seeded ${insertedPosts.length} Mexico videos to the feed`,
      posts: insertedPosts,
    });
  } catch (error: any) {
    console.error("[Seed Mexico] error:", error);
    res
      .status(500)
      .json({ error: "Mexico seed failed", details: error.message });
  }
});

/**
 * POST /api/seed/providers — Pixabay + Pexels + Apify (stable stock + TikTok via Apify).
 * Query: ?pexels=1&pixabay=1&apify=1&limit=15
 */
router.post("/providers", async (req, res) => {
  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Missing Supabase configuration",
        details: "SUPABASE_SERVICE_ROLE_KEY required",
      });
    }

    const q = req.query;
    const limit = Math.min(
      120,
      Math.max(1, parseInt(String(q.limit ?? req.body?.limit ?? 40), 10) || 40),
    );
    const flag = (name: string) =>
      q[name] === "1" ||
      q[name] === "true" ||
      req.body?.[name] === true ||
      req.body?.[name] === "1";

    const anySet =
      flag("pexels") || flag("pixabay") || flag("apify") || flag("apify_only");
    const force =
      q.force === "1" || q.force === "true" || req.body?.force === true;
    const { replenishQuebecFeedPool, seedFeedProviders } =
      await import("../services/feed-seed-providers.js");

    if (force || q.target) {
      const result = await replenishQuebecFeedPool({
        supabaseUrl,
        supabaseServiceKey: supabaseKey,
        force: true,
        maxApify: flag("apify") || flag("apify_only") || !anySet ? limit : 0,
        maxPexels: flag("pexels") ? Math.min(30, limit) : 0,
        targetCount: q.target ? parseInt(String(q.target), 10) : undefined,
      });
      const total = result.apify + result.pexels + result.pixabay;
      return res.json({
        success: total > 0,
        message: `Playable ${result.playableCountBefore}→${result.playableCountAfter} (total ${result.feedCountBefore}→${result.feedCountAfter})`,
        total,
        ...result,
      });
    }

    const stats = await seedFeedProviders({
      supabaseUrl,
      supabaseServiceKey: supabaseKey,
      limitPerProvider: limit,
      hiveId: (q.hive as string) || "quebec",
      regionId: (q.region as string) || "montreal",
      pexels: flag("pexels"),
      pixabay: flag("pixabay"),
      apify: flag("apify") || flag("apify_only") || !anySet,
    });

    const total = stats.pexels + stats.pixabay + stats.apify;
    res.json({
      success: total > 0 || stats.errors.length === 0,
      message: `Providers seed: pexels=${stats.pexels} pixabay=${stats.pixabay} apify=${stats.apify}`,
      total,
      ...stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Providers seed error:", error);
    res.status(500).json({ error: "Providers seed failed", details: message });
  }
});

/**
 * POST /api/seed/tikwm — Import TikToks via TikWM (no TikAPI key; uses challenge/hashtag IDs).
 */
router.post("/tikwm", async (req, res) => {
  try {
    const { collectTikwmFeedSeedCandidates } =
      await import("../services/tikwm-feed.js");
    const { importFeedSeedCandidates } =
      await import("../services/tikapi-feed-insert.js");

    const limitRaw = req.query.limit ?? req.body?.limit;
    const maxImport = limitRaw != null ? parseInt(String(limitRaw), 10) : 40;

    const candidates = await collectTikwmFeedSeedCandidates({
      regionalPerTag: 10,
      viralPerTag: 6,
    });

    if (!candidates.length) {
      return res.status(503).json({
        success: false,
        message: "TikWM returned no importable videos",
        candidates: 0,
      });
    }

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const databaseUrl = process.env.DATABASE_URL?.trim();

    const stats = await importFeedSeedCandidates({
      candidates,
      maxImport: Number.isFinite(maxImport) && maxImport > 0 ? maxImport : 40,
      databaseUrl,
      supabaseUrl,
      supabaseServiceKey: supabaseKey,
    });

    res.json({
      success: true,
      message: `TikWM seed: ${stats.imported} imported`,
      candidates: candidates.length,
      ...stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("TikWM seed error:", error);
    res.status(500).json({ error: "TikWM seed failed", details: message });
  }
});

/**
 * POST /api/seed/tikapi — Import TikToks via TikAPI (uses TIKAPI_KEY + Supabase on server).
 * Query: ?force=1&limit=40
 */
router.post("/tikapi", async (req, res) => {
  try {
    const { replenishFeedTikApiIfLow } =
      await import("../services/feed-replenish-tikapi.js");
    const force =
      req.query.force === "1" ||
      req.query.force === "true" ||
      req.body?.force === true;
    const limitRaw = req.query.limit ?? req.body?.limit;
    const maxImport =
      limitRaw != null ? parseInt(String(limitRaw), 10) : undefined;

    const result = await replenishFeedTikApiIfLow({
      force,
      maxImport:
        Number.isFinite(maxImport) && maxImport! > 0 ? maxImport : undefined,
      hiveId: (req.query.hive as string) || "quebec",
    });

    if (!result.triggered && result.imported === 0) {
      const hint = !process.env.TIKAPI_KEY?.trim()
        ? "Set TIKAPI_KEY on the server"
        : !process.env.SUPABASE_SERVICE_ROLE_KEY
          ? "Set SUPABASE_SERVICE_ROLE_KEY on the server"
          : "Feed may already be above threshold; use ?force=1";
      return res.status(503).json({
        success: false,
        message: hint,
        ...result,
      });
    }

    res.json({
      success: true,
      message: `TikAPI replenish: ${result.imported} imported`,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("TikAPI seed error:", error);
    res.status(500).json({ error: "TikAPI seed failed", details: message });
  }
});

/**
 * POST /api/seed/mux-backfill — Re-ingest broken TikTok CDN posts into Mux.
 * Query: ?limit=10
 */
router.post("/mux-backfill", async (req, res) => {
  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    const limitRaw = req.query.limit ?? req.body?.limit ?? "10";
    const limit = parseInt(String(limitRaw), 10);

    const { backfillTikTokToMuxOrStorage } =
      await import("../services/backfill-tiktok-mirror.js");
    const { isMuxIngestConfigured } =
      await import("../services/tiktok-mux-ingest.js");

    const stats = await backfillTikTokToMuxOrStorage({
      supabaseUrl,
      supabaseServiceKey: supabaseKey,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
      hiveId: (req.query.hive as string) || "quebec",
    });

    res.json({
      success: true,
      muxConfigured: isMuxIngestConfigured(),
      message: `Backfill: ${stats.muxIngested} Mux, ${stats.mirrored} Supabase mirror`,
      ...stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Mux backfill error:", error);
    res.status(500).json({ error: "Mux backfill failed", details: message });
  }
});

/**
 * POST /api/seed/seedance — AI video generation via BytePlus Seedance → Mux → feed.
 * Query: ?limit=1 (max 5). Requires ARK_API_KEY + MUX or Supabase for permanent storage.
 */
router.post("/seedance", async (req, res) => {
  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    const { isBytePlusArkConfigured, listArkVideoModels } =
      await import("../services/byteplus-seedance.js");
    const { isMuxIngestConfigured } =
      await import("../services/tiktok-mux-ingest.js");

    if (!isBytePlusArkConfigured()) {
      return res.status(503).json({
        success: false,
        error: "ARK_API_KEY not configured on server",
      });
    }

    const limitRaw = req.query.limit ?? req.body?.limit ?? "1";
    const limit = parseInt(String(limitRaw), 10);
    const customPrompt =
      typeof req.body?.prompt === "string" ? req.body.prompt : undefined;

    const { seedFeedFromSeedance } =
      await import("../services/seedance-feed-seed.js");

    const stats = await seedFeedFromSeedance({
      supabaseUrl,
      supabaseServiceKey: supabaseKey,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 1,
      hiveId: (req.query.hive as string) || "quebec",
      prompts: customPrompt ? [customPrompt] : undefined,
    });

    const videoModels = await listArkVideoModels();

    res.json({
      success: stats.imported > 0,
      message: `Seedance: ${stats.generated} generated, ${stats.imported} in feed (${stats.muxIngested} Mux)`,
      muxConfigured: isMuxIngestConfigured(),
      availableVideoModels: videoModels.slice(0, 8),
      ...stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Seedance seed error:", error);
    res.status(500).json({ error: "Seedance seed failed", details: message });
  }
});

router.post("/custom", async (req, res) => {
  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    const videos = req.body.videos;
    const rawCandidates = req.body.candidates;

    if (!Array.isArray(videos) && !Array.isArray(rawCandidates)) {
      return res.status(400).json({
        error: "Expected videos or candidates array in request body",
      });
    }

    const { importCustomSeedVideos } =
      await import("../services/seed-custom-import.js");
    const { importFeedSeedCandidates } =
      await import("../services/tikapi-feed-insert.js");

    if (Array.isArray(rawCandidates) && rawCandidates.length > 0) {
      const stats = await importFeedSeedCandidates({
        candidates: rawCandidates,
        maxImport: rawCandidates.length,
        databaseUrl: process.env.DATABASE_URL,
        supabaseUrl,
        supabaseServiceKey: supabaseKey,
      });
      return res.json({
        success: stats.imported > 0,
        message: `Imported ${stats.imported} via Mux pipeline (${stats.muxIngested} Mux)`,
        ...stats,
      });
    }

    const result = await importCustomSeedVideos({
      videos: videos as Record<string, unknown>[],
      supabaseUrl,
      supabaseServiceKey: supabaseKey,
      databaseUrl: process.env.DATABASE_URL,
    });

    const { muxPipeline, legacyInserted, legacyFailed } = result;
    const totalImported = muxPipeline.imported + legacyInserted;

    res.json({
      success: totalImported > 0,
      message: `Seeded ${totalImported} videos (${muxPipeline.muxIngested} Mux, ${muxPipeline.mirrored} mirrored, ${legacyInserted} legacy)`,
      ...muxPipeline,
      imported: totalImported,
      legacyInserted,
      legacyFailed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Custom Seed error:", error);
    res.status(500).json({ error: "Custom Seed failed", details: message });
  }
});

export default router;
