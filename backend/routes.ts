/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-explicit-any */
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}
import rateLimit from "express-rate-limit";
import { storage } from "./storage.js";
// [NEW] Import the JWT verifier + Supabase admin client (for auto-provisioning)
import { verifyAuthToken } from "./supabase-auth.js";
import aiRoutes from "./routes/ai.routes.js";

import adminRoutes from "./routes/admin.js";
import tiktokRoutes from "./routes/tiktok.js";
import moderationRoutes from "./routes/moderation.js";
import healthRoutes from "./routes/health.js";
import genaiBuilderRoutes from "./routes/genai-builder.routes.js";
import genaiSearchRoutes from "./routes/genai-search.routes.js";
import enhanceRoutes from "./routes/enhance.js";

import { surgicalUploadRouter } from "./routes/upload-surgical.js";
import { presenceRouter } from "./routes/presence.js";
import flaggingRoutes from "./routes/user-flagging.js";
import remixRoutes from "./routes/remix.js";
import soundRoutes from "./routes/sounds.js";
import pexelsRoutes from "./routes/pexels.js";
import studioRoutes from "./routes/studio.js";
import muxRoutes from "./routes/mux.js";
import mediaProxyRoutes from "./routes/media-proxy.js";

import tiguyActionsRoutes from "./routes/tiguy-actions.js";
import tiguyRoutes from "./routes/tiguy-routes.js";
import dialogflowTiguyRoutes from "./routes/dialogflow-tiguy.js";
import dialogflowWebhookRoutes from "./routes/dialogflow-webhook.js";
import userRoutes from "./routes/users.js";
import postsRoutes from "./routes/posts.js";
import feedRoutes from "./routes/feed.js";
import feedSupabaseRoutes from "./routes/feed-supabase.js";
import maxApiRoutes from "./routes/max-api.js";
import emailRoutes from "./routes/email.js";
import giftRoutes from "./routes/gifts.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import swarmRoutes from "./routes/swarm.js";
import vaultRoutes from "./routes/vault.js";
import familyRoutes from "./routes/family.js";
import economyRoutes from "./routes/economy.js";
import utilRoutes from "./routes/utils.js";
import royaleRoutes from "./routes/royale.js";
import storyRoutes from "./routes/stories.js";
import notificationRoutes from "./routes/notifications.js";
import supportRoutes from "./routes/support.js";
import aiVertexRoutes from "./routes/ai-vertex.js";
import searchRoutes from "./routes/search.js";
import videoDoctorRoutes from "./routes/video-doctor.routes.js";
import { hiveSyncService } from "./services/hive-sync-service.js";

// Rate limiters for different endpoint types
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes per IP (social feed needs headroom)
  message: { error: "Trop de requêtes. Réessaie bientôt!" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stripe configuration - only initialize if API key is present
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn(
    "⚠️ STRIPE_SECRET_KEY not found - payment features will be disabled",
  );
}

// [UPDATED] Hybrid Auth Middleware
// Accepts:
// 1. Authorization: Bearer <jwt> (New, Stateless)
// 2. Cookie Session (Legacy, Stateful)
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Strategy: Check for Supabase JWT (Bearer Token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
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

      (req as any).userId = userId;
      // We don't have role in token currently, default to citoyen or fetch from user
      (req as any).userRole = user?.role || "citoyen";
      return next();
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Surgical Bypass - Launch Edition
  app.use("/api/upload", surgicalUploadRouter);

  // ============ HEALTH & SYSTEM ROUTES ============
  app.use("/api/health", healthRoutes);

  // Video processing webhook (called by HLS worker for cache invalidation)
  app.post("/api/webhook/video-processed", (req, res) => {
    const secret = req.headers["x-webhook-secret"];
    const expected = process.env.WEBHOOK_SECRET;
    if (expected && secret !== expected) {
      return res.status(401).json({ error: "Invalid webhook secret" });
    }
    const { videoId } = req.body || {};
    if (!videoId) {
      return res.status(400).json({ error: "videoId required" });
    }
    // TODO: Invalidate Redis feed cache (DEL feed:*) when cache is implemented
    res.status(200).json({ ok: true, videoId });
  });

  // [HIVE] Incoming events from Colony OS / n8n
  app.post("/api/hive/event", async (req, res) => {
    const secret = req.headers["x-hive-secret"];
    const expected = process.env.HIVE_SECRET_KEY || "zyeute-hive-secret-2026";

    if (secret !== expected) {
      return res.status(401).json({ error: "Hive Secret Invalid" });
    }

    try {
      const result = await hiveSyncService.handleIncomingEvent(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // [NEW] Admin Observability Dashboard
  app.use("/api/admin", requireAuth, adminRoutes);

  // TikTok curation (Omkar Cloud proxy + import; staff-only inside router)
  // Temporary public diagnostic endpoint (no auth)
  app.get("/api/tiktok/diag", async (_req, res) => {
    const key = process.env.TIKTOK_SCRAPER_API_KEY;
    const diag: Record<string, unknown> = {
      hasKey: !!key,
      keyPrefix: key ? key.substring(0, 6) + "..." : null,
      hasTikApiKey: !!process.env.TIKAPI_KEY,
      nodeEnv: process.env.NODE_ENV,
      tlsReject: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
      hasMuxTokenId: !!process.env.MUX_TOKEN_ID,
      hasMuxTokenSecret: !!process.env.MUX_TOKEN_SECRET,
      hasMuxApiToken: !!process.env.MUX_API_TOKEN,
    };
    try {
      const axios = (await import("axios")).default;
      // Test with market=ca (original)
      const r1 = await axios.get("https://tiktok-scraper.omkar.cloud/tiktok/videos/search", {
        params: { search_query: "quebec", market: "ca", max_results: 2 },
        headers: { "API-Key": key || "" },
        timeout: 15000,
      });
      diag.withMarketCA = r1.data?.videos?.length ?? 0;

      // Test without market param
      const r2 = await axios.get("https://tiktok-scraper.omkar.cloud/tiktok/videos/search", {
        params: { search_query: "quebec", max_results: 2 },
        headers: { "API-Key": key || "" },
        timeout: 15000,
      });
      diag.withoutMarket = r2.data?.videos?.length ?? 0;

      // Test with market=us
      const r3 = await axios.get("https://tiktok-scraper.omkar.cloud/tiktok/videos/search", {
        params: { search_query: "quebec", market: "us", max_results: 2 },
        headers: { "API-Key": key || "" },
        timeout: 15000,
      });
      diag.withMarketUS = r3.data?.videos?.length ?? 0;
      diag.sampleVideoId = r2.data?.videos?.[0]?.video_id ?? r3.data?.videos?.[0]?.video_id ?? null;
    } catch (e: any) {
      diag.omkarError = e?.response?.status || e?.code || e?.message || String(e);
      diag.omkarErrorDetail = e?.response?.data || null;
    }
    res.json(diag);
  });
  app.use("/api/tiktok", requireAuth, tiktokRoutes);

  // Apply general rate limiting to all other API routes
  // EXCEPT Pexels routes (they have their own lighter limit since they're just fetching external data)
  app.use("/api", (req, res, next) => {
    // Skip rate limiting for Pexels endpoints (they're read-only external data fetches)
    if (req.path.startsWith("/pexels")) {
      return next();
    }
    return generalRateLimiter(req, res, next);
  });

  app.use("/api/pexels", pexelsRoutes);
  app.use("/api/mux", muxRoutes);
  app.use("/api/video-doctor", videoDoctorRoutes);

  // Media proxy - streams external video/image URLs (fixes Mixkit 403, Unsplash ORB)
  app.use("/api/media-proxy", mediaProxyRoutes);

  // ============ BOOTSTRAP AI / SWARM ROUTES (PUBLIC/HYBRID) ============
  app.use("/api/ai", aiRoutes);

  // ============ GENAI APP BUILDER & SEARCH ROUTES (Uses $1,367.95 credits) ============
  app.use("/api/genai", genaiBuilderRoutes);
  app.use("/api/genai/search", genaiSearchRoutes);

  // ============ STUDIO AI HIVE ROUTES ============
  app.use("/api/studio", requireAuth, studioRoutes);

  // ============ TI-GUY CHAT (Uses Dialogflow CX - $813.16 credits) ============
  app.use("/api/tiguy", tiguyRoutes);

  // ============ TI-GUY ENHANCED ACTIONS (Browser, Image Gen, etc.) ============
  app.use("/api/tiguy/actions", tiguyActionsRoutes);

  // ============ DIALOGFLOW CX TI-GUY VOICE (Uses Dialogflow CX Credits $813.16) ============
  app.use("/api/dialogflow", dialogflowTiguyRoutes);
  // Dialogflow CX Webhook (receives webhook calls from Dialogflow CX)
  app.use("/api/dialogflow", dialogflowWebhookRoutes);

  // ============ MAX API (WhatsApp Production Manager) ============
  app.use("/api/max", maxApiRoutes);

  // ============ DEEP ENHANCE ROUTES (Moved to end to prevent middleware blocking) ============
  // enhanceRoutes moved to end of file

  // ============ USER ROUTES ============
  app.use("/api", userRoutes);

  // ============ POSTS ROUTES ============
  app.use("/api", postsRoutes);

  // ============ FEED ROUTES ============
  app.use("/api/feed", feedRoutes);
  app.use("/api", feedSupabaseRoutes);

  // ============ EMAIL ROUTES ============
  app.use("/api/email", emailRoutes);

  // ============ GIFT ROUTES ============
  app.use("/api/gifts", giftRoutes);

  // ============ STRIPE SUBSCRIPTION ROUTES ============
  app.use("/api/stripe", subscriptionRoutes);

  // ============ V3 SWARM ROUTES ============
  app.use("/api/v3", swarmRoutes);

  // ============ VAULT ROUTES ============
  app.use("/api/posts", vaultRoutes);

  // ============ FAMILY & PARENTAL ROUTES ============
  app.use("/api/parental", familyRoutes);

  // ============ ECONOMY & PAYOUT ROUTES ============
  app.use("/api", economyRoutes);

  // ============ UTILS & DICTIONARY ROUTES ============
  app.use("/api", utilRoutes);

  // ============ SEARCH ROUTES ============
  app.use("/api/search", searchRoutes);

  // ============ STORIES ROUTES ============
  app.use("/api/stories", storyRoutes);

  // ============ NOTIFICATIONS ROUTES ============
  app.use("/api/notifications", notificationRoutes);

  // ============ SUPPORT ROUTES ============
  app.use("/api/support", supportRoutes);

  // ============ POUTINE ROYALE ARCADE ROUTES ============
  app.use("/api/royale", royaleRoutes);

  // ============ VERTEX AI ROUTES ============
  app.use("/api/ai/vertex", aiVertexRoutes);

  // ============ MODERATION & PRESENCE ============
  app.use("/api/moderation", requireAuth, moderationRoutes);
  app.use("/api/admin/flagging", flaggingRoutes);
  app.use("/api/remix", remixRoutes);
  app.use("/api/sounds", soundRoutes);
  app.use("/api/presence", presenceRouter);

  // [DEPRECATED] Manual Vertex AI routes replaced by centralized aiRoutes
  /*
  app.get("/api/ai/search", ...);
  app.post("/api/ai/ingest", ...);
  */

  // Start Colony OS metrics reporting (Safe Mode)
  try {
    const { startMetricsReporting } =
      await import("./colony/metrics-bridge.js");
    startMetricsReporting();
  } catch (_error) {
    console.warn(
      "[Colony Bridge] Metrics reporting disabled (module not found or failed to load).",
    );
  }
  // ============ DEEP ENHANCE ROUTES (Moved here) ============
  app.use("/api", requireAuth, enhanceRoutes);

  console.log("✅ Colony OS metrics bridge initialized");

  // Initialize Hive Sync with Socket.IO
  const io = app.get("io");
  if (io) {
    hiveSyncService.setIo(io);
    console.log("✅ Hive Sync Service initialized with Socket.IO");
  }

  return httpServer;
}
