/**
 * TikTok curation: Omkar Cloud search/trending/details + import (staff-only).
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { db, storage } from "../storage.js";
import { posts, users } from "../../shared/schema.js";
import { sql } from "drizzle-orm";
import { v3Mod } from "../v3-swarm.js";
import {
  TikTokScraperService,
  type TikTokVideo,
} from "../services/tiktok-scraper-service.js";

const router = Router();

async function requireStaff(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  const user = await storage.getUser(req.userId);
  if (
    !user ||
    (user.role !== "moderator" &&
      user.role !== "founder" &&
      !user.isAdmin &&
      user.username !== "north")
  ) {
    return res.status(403).json({ error: "Accès réservé à l'équipe." });
  }
  next();
}

async function resolveImportAuthorId(): Promise<string | null> {
  const bot = await storage.getUserByUsername("ti_guy_bot");
  if (bot) return bot.id;
  const scout = await storage.getUserByUsername("zyeute_scout");
  if (scout) return scout.id;
  const row = await db.select({ id: users.id }).from(users).limit(1);
  return row[0]?.id ?? null;
}

function pickVideoPayload(body: Record<string, unknown>): unknown | null {
  if (body.video && typeof body.video === "object") return body.video;
  if (body.item && typeof body.item === "object") return body.item;
  if (body.metadata && typeof body.metadata === "object") return body.metadata;
  return null;
}

// GET /api/tiktok/search?q=...
router.get("/search", requireStaff, async (req, res) => {
  const q = (req.query.q as string)?.trim();
  if (!q) {
    return res.status(400).json({ error: "Paramètre q requis." });
  }

  const maxResults = Math.min(
    30,
    Math.max(1, parseInt(String(req.query.max_results || "15"), 10) || 15),
  );

  try {
    const videos = await TikTokScraperService.search(q, maxResults);
    res.json({ videos, query: q });
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (msg.includes("TIKTOK_SCRAPER_API_KEY")) {
      return res.status(503).json({
        error:
          "TIKTOK_SCRAPER_API_KEY manquant côté serveur. Configure la clé Omkar Cloud.",
        videos: [],
        query: q,
      });
    }
    console.error("[TikTok] search failed:", e);
    res.status(200).json({ videos: [], query: q });
  }
});

// GET /api/tiktok/trending
router.get("/trending", requireStaff, async (req, res) => {
  const maxResults = Math.min(
    30,
    Math.max(1, parseInt(String(req.query.max_results || "15"), 10) || 15),
  );

  try {
    const videos = await TikTokScraperService.getTrending(maxResults);
    res.json({ videos });
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (msg.includes("TIKTOK_SCRAPER_API_KEY")) {
      return res.status(503).json({
        error: "TIKTOK_SCRAPER_API_KEY manquant côté serveur.",
        videos: [],
      });
    }
    console.error("[TikTok] trending failed:", e);
    res.status(200).json({ videos: [] });
  }
});

// POST /api/tiktok/import — { video }, { videoUrl }, or { video_url, metadata? }
router.post("/import", requireStaff, async (req, res) => {
  if (!process.env.TIKTOK_SCRAPER_API_KEY) {
    return res.status(503).json({
      error: "TIKTOK_SCRAPER_API_KEY manquant côté serveur.",
    });
  }

  const body = req.body as Record<string, unknown>;
  let raw: unknown = pickVideoPayload(body);
  const videoUrlParam =
    typeof body.videoUrl === "string"
      ? body.videoUrl.trim()
      : typeof body.video_url === "string"
        ? (body.video_url as string).trim()
        : "";

  if (!raw && videoUrlParam) {
    raw = await TikTokScraperService.getVideoDetails(videoUrlParam);
  }

  if (!raw || typeof raw !== "object") {
    return res.status(400).json({
      error:
        "Fournis video / metadata (objet), videoUrl, ou video_url (lien TikTok).",
    });
  }

  const v = raw as TikTokVideo & Record<string, any>;
  const videoId = v.video_id;
  if (!videoId) {
    return res.status(400).json({ error: "Réponse TikTok invalide (video_id)." });
  }

  const existing = await db
    .select({ id: posts.id })
    .from(posts)
    .where(sql`${posts.mediaMetadata}->>'tiktok_id' = ${videoId}`)
    .limit(1);

  if (existing.length > 0) {
    return res.status(409).json({
      error: "Cette vidéo est déjà dans le fil.",
      postId: existing[0].id,
    });
  }

  const caption =
    typeof v.caption === "string" ? v.caption : "TikTok — import curation";
  const content = caption || "TikTok Import";
  const modResult = await v3Mod(`${caption} ${content}`);
  if (modResult.is_minor_danger || modResult.status !== "approved") {
    return res.status(403).json({
      error: "Import refusé par la modération texte.",
      detail: modResult.reason,
    });
  }

  const pageUrl =
    videoUrlParam ||
    v.original_url ||
    (v.author?.handle
      ? `https://www.tiktok.com/@${v.author.handle}/video/${videoId}`
      : "");

  const mediaUrl =
    v.media?.video_url ||
    v.media?.hd_video_url ||
    (v.media as { download_addr?: string } | undefined)?.download_addr;
  if (!mediaUrl || typeof mediaUrl !== "string") {
    return res.status(422).json({ error: "Aucune URL média exploitable." });
  }

  const hlsOrHd =
    v.media?.hd_video_url && v.media.hd_video_url !== mediaUrl
      ? v.media.hd_video_url
      : null;

  const thumbnailUrl =
    v.thumbnails?.cover_url ||
    (v.thumbnails as { origin_cover_url?: string })?.origin_cover_url ||
    (v as { video?: { cover?: string } }).video?.cover ||
    null;

  const authorHandle =
    v.author?.handle ||
    (v.author as { unique_id?: string } | undefined)?.unique_id ||
    v.author?.nickname ||
    null;

  const userId = await resolveImportAuthorId();
  if (!userId) {
    return res.status(500).json({
      error:
        "Aucun utilisateur système (ti_guy_bot / zyeute_scout) ni profil de repli.",
    });
  }

  const hiveUser = await storage.getUser(userId);
  const hiveId = hiveUser?.hiveId || "quebec";

  try {
    const post = await storage.createPost({
      userId,
      type: "video",
      mediaUrl,
      hlsUrl: hlsOrHd || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      content,
      caption,
      visibility: "public",
      hiveId,
      processingStatus: "completed",
      fireCount: typeof v.stats?.likes === "number" ? v.stats.likes : 0,
      mediaMetadata: {
        tiktok_id: videoId,
        author: authorHandle,
        source: "tiktok-scraper",
        stats: v.stats ?? {},
        original_url: pageUrl || undefined,
      },
      isModerated: true,
      moderationApproved: true,
      isHidden: false,
    } as any);

    res.status(201).json({ post });
  } catch (e: any) {
    console.error("[TikTok] import insert failed:", e);
    res.status(500).json({ error: e?.message || "Échec de l'import." });
  }
});

export default router;
