/**
 * TikTok curation: Omkar Cloud search/trending/details + import (staff-only).
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { storage } from "../storage.js";
import {
  hasImportableVideoPayload,
  importTikTokVideoToFeed,
  resolveTikTokVideoForImport,
} from "../services/tiktok-feed-import.js";
import {
  TikTokScraperService,
  missingTikTokProviderErrorMessage,
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

function pickVideoPayload(body: Record<string, unknown>): unknown | null {
  if (body.video && typeof body.video === "object") return body.video;
  if (body.item && typeof body.item === "object") return body.item;
  if (body.metadata && typeof body.metadata === "object") return body.metadata;
  return null;
}

// GET /api/tiktok/diag — quick env + connectivity check (staff-only)
router.get("/diag", requireStaff, async (_req, res) => {
  const key = process.env.TIKTOK_SCRAPER_API_KEY;
  const diag: Record<string, unknown> = {
    hasKey: !!key,
    keyPrefix: key ? key.substring(0, 6) + "..." : null,
    hasTikApiKey: !!process.env.TIKAPI_KEY,
  };
  try {
    const axios = (await import("axios")).default;
    const r = await axios.get("https://tiktok-scraper.omkar.cloud/tiktok/videos/search", {
      params: { search_query: "quebec", market: "ca", max_results: 1 },
      headers: { "API-Key": key || "" },
      timeout: 10000,
    });
    diag.omkarStatus = r.status;
    diag.omkarVideoCount = r.data?.videos?.length ?? 0;
    diag.omkarSample = r.data?.videos?.[0]?.video_id ?? null;
  } catch (e: any) {
    diag.omkarError = e?.response?.status || e?.code || e?.message || String(e);
  }
  res.json(diag);
});

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
    if (msg === missingTikTokProviderErrorMessage()) {
      return res.status(503).json({
        error: missingTikTokProviderErrorMessage(),
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
    if (msg === missingTikTokProviderErrorMessage()) {
      return res.status(503).json({
        error: missingTikTokProviderErrorMessage(),
        videos: [],
      });
    }
    console.error("[TikTok] trending failed:", e);
    res.status(200).json({ videos: [] });
  }
});

// POST /api/tiktok/import — { video }, { videoUrl }, or { video_url, metadata? }
router.post("/import", requireStaff, async (req, res) => {
  const body = req.body as Record<string, unknown>;
  let raw: unknown = pickVideoPayload(body);
  const videoUrlParam =
    typeof body.videoUrl === "string"
      ? body.videoUrl.trim()
      : typeof body.video_url === "string"
        ? (body.video_url as string).trim()
        : "";

  const resolved = await resolveTikTokVideoForImport(raw, videoUrlParam || undefined);
  if ("error" in resolved) {
    const e = resolved.error;
    switch (e.reason) {
      case "details_fetch_failed":
        return res.status(503).json({ error: e.detail || "Détails TikTok indisponibles." });
      case "invalid_payload":
        return res.status(400).json({
          error:
            "Fournis video / metadata (objet), videoUrl, ou video_url (lien TikTok).",
        });
      default:
        return res.status(400).json({ error: e.detail || "Requête invalide." });
    }
  }

  const result = await importTikTokVideoToFeed(resolved.video, {
    videoUrlHint: videoUrlParam || undefined,
    metadataSource: "tiktok-scraper",
  });

  if (result.ok) {
    const post = await storage.getPost(result.postId);
    return res.status(201).json({ post: post ?? { id: result.postId } });
  }

  switch (result.reason) {
    case "duplicate":
      return res.status(409).json({
        error: "Cette vidéo est déjà dans le fil.",
        postId: result.postId,
      });
    case "moderation":
      return res.status(403).json({
        error: "Import refusé par la modération texte.",
        detail: result.detail,
      });
    case "no_media":
      return res.status(422).json({ error: "Aucune URL média exploitable." });
    case "no_system_user":
      return res.status(500).json({
        error:
          "Aucun utilisateur système (ti_guy_bot / zyeute_scout) ni profil de repli.",
      });
    default:
      return res.status(500).json({
        error: result.detail || "Échec de l'import.",
      });
  }
});

export default router;
