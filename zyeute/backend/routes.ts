import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import rateLimit from "express-rate-limit";
import { sql } from "drizzle-orm";
import { storage } from "./storage.js";
import {
  insertUserSchema,
  insertPostSchema,
  insertCommentSchema,
  insertStorySchema,
  GIFT_CATALOG,
  type GiftType,
  users,
} from "../shared/schema.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { fal } from "@fal-ai/client";
import {
  v3TiGuyChat,
  v3Flow,
  v3Feed,
  v3Microcopy,
  v3Mod,
  FAL_PRESETS,
} from "./v3-swarm.js";
import { lookupWord } from "./utils/dictionary.js";
import emailAutomation from "./email-automation.js";
// Import Studio API routes
import studioRoutes from "./routes/studio.js";
import enhanceRoutes from "./routes/enhance.js";
import royaleRoutes from "./routes/royale.js";
// [NEW] Import the JWT verifier
// TODO: Replace with Clerk session verification once Clerk is integrated
import { verifyAuthToken } from "./supabase-auth.js";
import aiRoutes from "./routes/ai.routes.js";
import debugRoutes from "./api/debug.js";
import adminRoutes from "./routes/admin.js";
import moderationRoutes from "./routes/moderation.js";
import { healthRouter } from "./routes/health.js";
import { economyRoutes } from "./routes/economy.js";
// Import tracing utilities
import {
  traced,
  traceDatabase,
  traceExternalAPI,
  traceStripe,
  traceSupabase,
  addSpanAttributes,
} from "./tracer.js";
import { getVideoQueue, getImageQueue } from "./queue.js";
import { 
  sanitizePostForUser, 
  sanitizePostsForUser, 
  verifyPostOwnership 
} from "./utils/security.js";
import { joualizeText, type JoualStyle } from "./services/joualizer.js";
import { VertexBridge } from "./ai/vertex-bridge.js";
import { RoyaleService } from "./services/royale-service.js";
import { hiveTapService } from "./services/hive-tap-service.js";
import { giftbitService } from "./services/giftbit-service.js";
import { synapseBridge } from "./colony/synapse-bridge.js";
import {
  generateWithTIGuy,
  moderateContent,
  transcribeAudio,
  generateImage,
  checkVertexAIHealth,
  type ContentGenerationRequest,
  type ModerationResult,
  type TranscriptionResult,
  type ImageGenerationRequest,
  type ImageGenerationResponse,
} from "./ai/vertex-service.js";

// Configure FAL client
fal.config({
  credentials: process.env.FAL_API_KEY,
});

// Rate limiters for different endpoint types
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: { error: "Trop de requêtes AI. Réessaie dans quelques minutes! 🦫" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 auth attempts per minute per IP (stricter to prevent brute force)
  message: {
    error: "Trop de tentatives de connexion. Réessaie dans une minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requests per 15 minutes per IP
  message: { error: "Trop de requêtes. Réessaie bientôt!" },
  standardHeaders: true,
  legacyHeaders: false,
});

// TODO: Remove this Stripe initialization - use shared/billing.ts instead
// Stripe configuration - only initialize if API key is present
// This is kept for backwards compatibility but should use billing module
import Stripe from "stripe";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
  });
} else {
  console.warn(
    "⚠️ STRIPE_SECRET_KEY not found - payment features will be disabled",
  );
}

import { requireAuth, optionalAuth } from "./middleware/auth.js";


// [UPDATED] Hybrid Auth Middleware


export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ============ HEALTH & SYSTEM ROUTES ============
  app.use("/api", healthRouter);

  // [NEW] Debug and Scalability Diagnostics
  app.use("/api/debug", debugRoutes);

  // [NEW] Admin Observability Dashboard
  app.use("/api/admin", requireAuth, adminRoutes);

  // [NEW] Economy Routes
  app.use("/api/economy", economyRoutes);

  // Apply general rate limiting to all other API routes

  // Apply general rate limiting to all other API routes
  app.use("/api", generalRateLimiter);

  // ============ BOOTSTRAP AI / SWARM ROUTES (PUBLIC/HYBRID) ============
  app.use("/api/ai", aiRoutes);

  // ============ BEE SYSTEM ROUTES ============
  const beeRoutes = (await import("./routes/bees.js")).default;
  app.use("/api/bees", beeRoutes);

  // ============ LEARNING SYSTEM ROUTES ============
  const learningRoutes = (await import("./routes/learning.js")).default;
  app.use("/api/learning", requireAuth, learningRoutes);

  // ============ MLOPS PIPELINES ROUTES ============
  const mlopsRoutes = (await import("./routes/mlops.js")).default;
  app.use("/api/mlops", requireAuth, mlopsRoutes);

  // ============ OBSERVABILITY DASHBOARD ROUTES ============
  const dashboardRoutes = (await import("./routes/dashboard.js")).default;
  app.use("/api/dashboard", requireAuth, dashboardRoutes);

  // ============ BUGBOT ROUTES ============
  const bugbotRoutes = (await import("./routes/bugbot.js")).default;
  app.use("/api/bugbot", requireAuth, bugbotRoutes);

  // ============ BUGBOT METRICS ROUTES ============
  const bugbotMetricsRoutes = (await import("./routes/bugbot-metrics.js")).default;
  app.use("/api/bugbot", bugbotMetricsRoutes); // Metrics endpoint is public for Prometheus

  // ============ STUDIO AI HIVE ROUTES ============
  // TODO: Add subscription check for premium features
  app.use("/api/studio", requireAuth, studioRoutes);

  // ============ ARCADE / ROYALE ROUTES ============
  app.use("/api/royale", royaleRoutes);

  // ============ ANTIGRAVITY INTEROP (CURSOR BRIDGE) ============
  const { default: antigravityRoutes } =
    await import("./routes/antigravity.js");
  // Publicly accessible for local testing/Cursor agent
  app.use("/api/antigravity", antigravityRoutes);

  // ============ DEEP ENHANCE ROUTES (Moved to end to prevent middleware blocking) ============
  // enhanceRoutes moved to end of file

  // ============ LEGACY AUTH ROUTES (for backward compatibility) ============

  /* LEGACY SIGNUP REMOVED - Using Supabase Auth
  // Sign up
  app.post("/api/auth/signup", authRateLimiter, async (req, res) => {
     // ... implementation removed ...
     res.status(410).json({ error: "Please use Supabase Auth" });
  });
  */

  /* LEGACY LOGIN REMOVED - Using Supabase Auth
  // Login
  app.post("/api/auth/login", authRateLimiter, async (req, res) => {
     res.status(410).json({ error: "Please use Supabase Auth" });
  });
  */

  // Legacy /api/auth/logout removed - Frontend uses Supabase signOut directly

  // [NEW] Resolve username to email (Helper for login with username)
  app.post("/api/auth/resolve-email", authRateLimiter, async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || typeof username !== "string") {
        return res.status(400).json({ error: "Username is required" });
      }

      // Sanitize username
      const cleanUsername = username.trim().toLowerCase();

      const user = await storage.getUserByUsername(cleanUsername);
      if (user && user.email) {
        // Return email so frontend can use it for Supabase auth
        return res.json({ email: user.email });
      }

      return res.status(404).json({ error: "Utilisateur non trouvé" });
    } catch (error) {
      console.error("Resolve email error:", error);
      res.status(500).json({ error: "Failed to resolve username" });
    }
  });

  // [RESTORED] Get current user profile (bridged via JWT)
  // This is needed because frontend/src/services/api.ts still calls /auth/me
  // to get the full profile data (coins, region, etc.) which isn't in the JWT.
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // const { password: _, ...safeUser } = user;
      // res.json({ user: safeUser });
      res.json({ user: user }); // User object from Drizzle should be safe now
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // Colony OS status endpoint
  app.get("/api/colony/status", async (req, res) => {
    res.json({
      connected: synapseBridge.isConnected(),
      status: synapseBridge.getConnectionStatus(),
      url: process.env.COLONY_OS_URL || "not configured"
    });
  });

  // ============ USER ROUTES ============

  // Get user by username
  app.get("/api/users/:username", optionalAuth, async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const safeUser = user;

      // Check if current user follows this user
      let isFollowing = false;
      if (req.userId && req.userId !== user.id) {
        isFollowing = await storage.isFollowing(req.userId, user.id);
      }

      res.json({ user: { ...safeUser, isFollowing } });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Update current user profile
  app.patch("/api/users/me", requireAuth, async (req, res) => {
    try {
      const { displayName, bio, avatarUrl, region, tiGuyCommentsEnabled } =
        req.body;

      const updated = await storage.updateUser(req.userId!, {
        displayName,
        bio,
        avatarUrl,
        region,
        tiGuyCommentsEnabled,
      });

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      const safeUser = updated;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ============ POSTS ROUTES ============

  // Get feed posts - supports guest mode (returns explore posts for guests)
  app.get("/api/feed", optionalAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      // If authenticated, return personalized feed
      // If guest (no auth), return explore posts
      let posts: any[];
      if (req.userId) {
        posts = await storage.getFeedPosts(req.userId, page, limit);
      } else {
        // Guest mode: return explore posts
        posts = await storage.getExplorePosts(page, limit);
      }

      // 🔒 SECURITY: Sanitize all posts in feed/explore
      const sanitizedPosts = sanitizePostsForUser(posts, req.userId);
      res.json({ 
        posts: sanitizedPosts,
        ...(req.userId ? {} : { isGuestMode: true })
      });
    } catch (error) {
      console.error("Get feed error:", error);
      res.status(500).json({ error: "Failed to get feed" });
    }
  });

  // Get Smart "Pour Toi" Feed - Uses Vector Recommendations
  app.get("/api/feed/smart", optionalAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // Initial version: Use a fixed embedding for testing or search-based
      // In a real scenario, we'd fetch the user's "interest profile" embedding
      // or embed the search query if one exists.
      let embedding = req.query.embedding
        ? JSON.parse(req.query.embedding as string)
        : null;

      let posts: any[];
      if (!embedding) {
        // Fallback: Just return explore posts if no vector provided yet
        posts = await storage.getExplorePosts(0, limit);
        const sanitizedPosts = sanitizePostsForUser(posts, req.userId);
        return res.json({ posts: sanitizedPosts, isFallback: true });
      }

      posts = await storage.getSmartRecommendations(embedding, limit);
      const sanitizedPosts = sanitizePostsForUser(posts, req.userId);
      res.json({ posts: sanitizedPosts });
    } catch (error) {
      console.error("Get smart feed error:", error);
      res.status(500).json({ error: "Failed to get smart recommendations" });
    }
  });

  // [NEW] Joualizer Rewrite Engine
  app.post("/api/ai/joualize", requireAuth, aiRateLimiter, async (req, res) => {
    try {
      const { text, style } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      const validStyles: JoualStyle[] = ["street", "old", "enhanced"];
      if (!style || !validStyles.includes(style as JoualStyle)) {
        return res.status(400).json({
          error: "Invalid style. Use 'street', 'old', or 'enhanced'.",
        });
      }

      const rewrittenText = await joualizeText(text, style as JoualStyle);
      res.json({ originalText: text, rewrittenText, style });
    } catch (error) {
      console.error("Joualizer error:", error);
      res.status(500).json({ error: "Failed to joualize text" });
    }
  });

  // [NEW] Discovery Feed - AI-powered content discovery
  app.get("/api/feed/discover", optionalAuth, async (req, res) => {
    try {
      const type = (req.query.type as string) || "tags"; // 'tags', 'vibe', 'recommended'
      const query = req.query.query as string | undefined;
      const vibe = (req.query.vibe as string) || query;
      const limit = parseInt(req.query.limit as string) || 20;
      const hiveId =
        (req.query.hive as string) ||
        (req.userId ? await storage.getUserHive(req.userId) : "quebec");

      let posts: any[] = [];

      if (type === "tags" && query) {
        // Search by AI-generated tags
        const tags = query
          .split(/[,\s]+/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        posts = await storage.getPostsByAITags(tags, limit, hiveId);
      } else if (type === "vibe" && vibe) {
        // Filter by vibe category
        const validVibes = ["party", "chill", "nature", "food", "urban", "art"];
        const selectedVibe = validVibes.includes(vibe) ? vibe : "chill";
        posts = await storage.getPostsByVibe(selectedVibe, limit, hiveId);
      } else if (type === "recommended") {
        // Personalized recommendations based on user engagement
        if (!req.userId) {
          return res.status(401).json({ error: "Authentication required for recommendations" });
        }
        posts = await storage.getRecommendedPosts(req.userId, limit, hiveId);
      } else {
        return res.status(400).json({ error: "Invalid discovery type or missing query" });
      }

      // 🔒 SECURITY: Sanitize all posts in discovery feed
      const sanitizedPosts = sanitizePostsForUser(posts, req.userId);
      res.json({
        posts: sanitizedPosts,
        type,
        query: type === "tags" ? query : vibe,
        count: sanitizedPosts.length,
      });
    } catch (error: any) {
      console.error("Discovery feed error:", error);
      res.status(500).json({ error: "Failed to fetch discovery feed" });
    }
  });

  // [NEW] Infinite Scroll Feed - Cursor-based Pagination with Hive Filtering
  app.get("/api/feed/infinite", optionalAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const cursor = req.query.cursor as string | undefined;
      const feedType = (req.query.type as string) || "explore"; // 'feed', 'explore', 'smart'
      const hiveId =
        (req.query.hive as string) ||
        (req.userId ? await storage.getUserHive(req.userId) : "quebec");

      let posts: any[] = [];

      // Determine which feed to fetch
      if (req.userId && feedType === "feed") {
        // User's personalized feed
        const page = cursor ? parseInt(cursor) : 0;
        posts = await storage.getFeedPosts(req.userId, page, limit + 1, hiveId);
      } else if (feedType === "smart" && req.userId) {
        // Smart recommendations (if user provides embedding)
        const embedding = req.query.embedding
          ? JSON.parse(req.query.embedding as string)
          : null;
        if (embedding) {
          posts = await storage.getSmartRecommendations(
            embedding,
            limit + 1,
            hiveId,
          );
        } else {
          posts = await storage.getExplorePosts(
            cursor ? parseInt(cursor) : 0,
            limit + 1,
            hiveId,
          );
        }
      } else {
        // Explore/public feed (default)
        const page = cursor ? parseInt(cursor) : 0;
        posts = await storage.getExplorePosts(page, limit + 1, hiveId);
      }

      // Check if there are more posts
      const hasMore = posts.length > limit;
      const items = hasMore ? posts.slice(0, -1) : posts;

      // Calculate next cursor
      const nextCursor = hasMore
        ? (cursor ? parseInt(cursor) + 1 : 1).toString()
        : null;

      res.json({
        posts: items,
        nextCursor,
        hasMore,
        feedType,
        hiveId,
      });
    } catch (error) {
      console.error("Get infinite feed error:", error);
      res.status(500).json({ error: "Failed to load feed" });
    }
  });

  // Get explore posts (public, popular) with Hive filtering
  app.get("/api/explore", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      const hiveId = (req.query.hive as string) || "quebec";

      const posts = await storage.getExplorePosts(page, limit, hiveId);
      res.json({ posts, hiveId });
    } catch (error) {
      console.error("Get explore error:", error);
      res.status(500).json({ error: "Failed to get explore posts" });
    }
  });

  // Get nearby posts
  app.get("/api/posts/nearby", optionalAuth, async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radius = parseInt(req.query.radius as string) || 50000;

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Lat and Lon are required" });
      }

      const posts = await storage.getNearbyPosts(lat, lon, radius);
      res.json({ posts });
    } catch (error) {
      console.error("Get nearby error:", error);
      res.status(500).json({ error: "Failed to get nearby posts" });
    }
  });

  // Get regional trending posts
  app.get("/api/posts/trending/:regionId", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const before = req.query.before
        ? new Date(req.query.before as string)
        : undefined;

      const posts = await storage.getRegionalTrendingPosts(
        req.params.regionId,
        limit,
        before,
      );
      res.json({ posts });
    } catch (error) {
      console.error("Get regional trending error:", error);
      res.status(500).json({ error: "Failed to get regional trending posts" });
    }
  });

  // Get single post
  app.get("/api/posts/:id", optionalAuth, async (req, res) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes.ts:515',message:'GET /api/posts/:id called',data:{postId:req.params.id,userId:req.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check if current user has fired this post
      let isFired = false;
      if (req.userId) {
        isFired = await storage.hasUserFiredPost(req.params.id, req.userId);
      }

      // Handle ephemeral posts (Fantasma Mode)
      let viewCountIncremented = false;
      if (req.userId && post.isEphemeral) {
        // Increment view count for ephemeral posts
        const newViewCount = await storage.incrementPostViews(req.params.id);
        viewCountIncremented = true;

        // Check if post should be deleted (view count exceeded)
        if (post.maxViews && newViewCount >= post.maxViews) {
          // Mark post as burned (deleted due to ephemeral expiration)
          await storage.markPostBurned(req.params.id, "view_limit_exceeded");
          // Note: Post content deletion will be handled by a cleanup job
        }
      } else if (!post.isEphemeral) {
        // Only increment views for non-ephemeral posts
        await storage.incrementPostViews(req.params.id);
      }

      // 🔒 SECURITY: Sanitize post data - hide originalUrl and jobId from non-owners
      const sanitizedPost = sanitizePostForUser(post, req.userId);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes.ts:546',message:'Post sanitized before response',data:{postId:post.id,originalUrlInResponse:!!sanitizedPost.originalUrl,jobIdInResponse:!!sanitizedPost.jobId,isOwner:post.userId===req.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      res.json({
        post: {
          ...sanitizedPost,
          isFired,
          // Don't show content if ephemeral and user has already viewed it
          content:
            post.isEphemeral &&
            viewCountIncremented &&
            post.maxViews &&
            (post.viewCount || 0) >= post.maxViews
              ? "[Contenido eliminado - Fantasma expirado]"
              : post.content,
        },
      });
    } catch (error) {
      console.error("Get post error:", error);
      res.status(500).json({ error: "Failed to get post" });
    }
  });

  // Get user's posts
  app.get("/api/users/:username/posts", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const posts = await storage.getPostsByUser(user.id);
      res.json({ posts });
    } catch (error) {
      console.error("Get user posts error:", error);
      res.status(500).json({ error: "Failed to get posts" });
    }
  });

  // Create post with Hive assignment
  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      // Get user's hive (default to quebec if not set)
      const user = await storage.getUser(req.userId!);
      const hiveId = user?.hiveId || "quebec";

      const parsed = insertPostSchema.safeParse({
        ...req.body,
        userId: req.userId,
        hiveId, // Assign post to user's hive
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      // [PHASE 9] Synchronous AI Moderation
      const moderationContent = `${parsed.data.caption || ""} ${parsed.data.content || ""}`;
      const modResult = await v3Mod(moderationContent);

      if (modResult.is_minor_danger) {
        console.error(`🚨 Child Safety Violation: Banning user ${req.userId}`);

        // Record persistent moderation log
        await storage.createModerationLog({
          userId: req.userId!,
          action: "ban",
          reason: "minor_danger",
          details: modResult.reason,
          score: 10,
        });

        await storage.updateUser(req.userId!, {
          role: "banned",
          bio: "COMPTE DÉSACTIVÉ : Zyeuté applique une politique de tolérance zéro concernant toute forme de leurre, grooming ou interaction inappropriée impliquant des mineurs.",
        });
        return res.status(403).json({
          error:
            "Votre compte a été banni pour violation grave des règles de sécurité (Tolérance Zéro).",
        });
      }

      // Handle ephemeral posts (Fantasma Mode)
      const isEphemeral = req.body.isEphemeral === true;
      const maxViews = isEphemeral
        ? parseInt(req.body.maxViews) || 1
        : undefined;
      const expiresAt = isEphemeral
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : undefined; // 24 hours

      // Create post first (with pending status for videos)
      const post = await storage.createPost({
        ...parsed.data,
        processingStatus: parsed.data.type === "video" ? "pending" : "completed",
        isModerated: true,
        moderationApproved: modResult.status === "approved",
        isHidden: modResult.status !== "approved",
        isEphemeral,
        maxViews,
        expiresAt,
      });

      // Queue video/image for processing by workers
      // Now we can pass postId to the worker
      let jobId: string | undefined;
      if (parsed.data.type === "video") {
        const videoQueue = getVideoQueue();
        const job = await videoQueue.add("processVideo", {
          postId: post.id, // Pass postId so worker can update the post
          videoUrl: parsed.data.mediaUrl,
          userId: req.userId,
          visualFilter: req.body.visualFilter || "prestige",
        });
        jobId = job.id?.toString();
        
        // Update post with jobId for tracking
        await storage.updatePost(post.id, { jobId });
      } else if (parsed.data.type === "photo" && req.body.visualFilter && req.body.visualFilter !== "none") {
        // Queue image processing if filter is provided
        const imageQueue = getImageQueue();
        const job = await imageQueue.add("processImage", {
          postId: post.id,
          userId: req.userId,
          imageUrl: parsed.data.mediaUrl,
          visualFilter: req.body.visualFilter,
        });
        jobId = job.id?.toString();
        
        // Update post with jobId for tracking
        await storage.updatePost(post.id, { jobId });
      }

      // Publish event to Colony OS
      await synapseBridge.publishEvent("post.created", {
        postId: post.id,
        userId: req.userId,
        type: post.type,
        hiveId: post.hiveId
      }).catch(err => console.warn("Failed to publish post.created event:", err));

      res.status(201).json({
        post,
        jobId, // Include jobId for video/image processing tracking
        moderation: {
          approved: modResult.status === "approved",
          reason: modResult.status !== "approved" ? modResult.reason : null,
        },
      });
    } catch (error: any) {
      console.error("Create post error:", error);
      
      // Capture error in Sentry
      const { captureException } = await import("./utils/sentry.js");
      captureException(error, {
        tags: {
          endpoint: "/api/posts",
          method: "POST",
          status_code: "500",
        },
        extra: {
          userId: req.userId,
          postType: req.body?.type,
          hasMediaUrl: !!req.body?.mediaUrl,
        },
        userId: req.userId,
      });
      
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Job status endpoint for video processing
  app.get("/api/jobs/:id/status", requireAuth, async (req, res) => {
    try {
      const jobId = req.params.id;
      const videoQueue = getVideoQueue();

      const job = await videoQueue.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const state = await job.getState();
      const progress = job.progress || 0;

      res.json({
        id: job.id,
        state,
        progress,
        data: job.data,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        attemptsMade: job.attemptsMade,
      });
    } catch (error: any) {
      console.error("Job status error:", error);
      
      // Capture error in Sentry
      const { captureException } = await import("./utils/sentry.js");
      captureException(error, {
        tags: {
          endpoint: "/api/jobs/:id/status",
          method: "GET",
          status_code: "500",
        },
        extra: {
          userId: req.userId,
          jobId: req.params.id,
        },
        userId: req.userId,
      });
      
      res.status(500).json({ error: "Failed to get job status" });
    }
  });

  // Delete post
  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      // 🔒 SECURITY: Verify ownership before allowing deletion
      await verifyPostOwnership(req.params.id, req.userId!);

      await storage.deletePost(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "Post not found") {
        return res.status(404).json({ error: "Post not found" });
      }
      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: "Not authorized" });
      }
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // ============ REACTIONS ROUTES ============

  // Toggle fire reaction on post
  app.post("/api/posts/:id/fire", requireAuth, async (req, res) => {
    try {
      const result = await storage.togglePostReaction(
        req.params.id,
        req.userId!,
      );
      res.json(result);
    } catch (error) {
      console.error("Toggle fire error:", error);
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  });

  // Delete fire reaction on post (explicit unfire)
  app.delete("/api/posts/:id/fire", requireAuth, async (req, res) => {
    try {
      const result = await storage.togglePostReaction(
        req.params.id,
        req.userId!,
      );
      // If it was already removed, result.added will be false
      if (!result.added) {
        res.json({ success: true, fire_count: result.newCount });
      } else {
        // If it was added, we need to remove it (toggle again)
        const finalResult = await storage.togglePostReaction(
          req.params.id,
          req.userId!,
        );
        res.json({ success: true, fire_count: finalResult.newCount });
      }
    } catch (error) {
      console.error("Unfire error:", error);
      res.status(500).json({ error: "Failed to remove reaction" });
    }
  });

  // Mark post as not interested
  app.post("/api/posts/:id/not-interested", requireAuth, async (req, res) => {
    try {
      const success = await storage.markPostNotInterested(
        req.params.id,
        req.userId!,
      );
      res.json({ success });
    } catch (error) {
      console.error("Mark not interested error:", error);
      res.status(500).json({ error: "Failed to mark post as not interested" });
    }
  });

  // ============ COMMENTS ROUTES ============

  // Get post comments
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getPostComments(req.params.id);
      res.json({ comments });
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  // Add comment
  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const parsed = insertCommentSchema.safeParse({
        postId: req.params.id,
        userId: req.userId,
        content: req.body.content,
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const comment = await storage.createComment(parsed.data);

      // Get user info for response
      const user = await storage.getUser(req.userId!);

      res.status(201).json({
        comment: { ...comment, user, isFired: false },
      });
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Delete comment
  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteComment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Toggle fire on comment
  app.post("/api/comments/:id/fire", requireAuth, async (req, res) => {
    try {
      const result = await storage.toggleCommentReaction(
        req.params.id,
        req.userId!,
      );
      res.json(result);
    } catch (error) {
      console.error("Toggle comment fire error:", error);
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  });

  // ============ FOLLOWS ROUTES ============

  // Follow user
  app.post("/api/users/:id/follow", requireAuth, async (req, res) => {
    try {
      if (req.params.id === req.userId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      const success = await storage.followUser(req.userId!, req.params.id);
      res.json({ success, isFollowing: success });
    } catch (error) {
      console.error("Follow error:", error);
      res.status(500).json({ error: "Failed to follow user" });
    }
  });

  // Unfollow user
  app.delete("/api/users/:id/follow", requireAuth, async (req, res) => {
    try {
      const success = await storage.unfollowUser(req.userId!, req.params.id);
      res.json({ success, isFollowing: false });
    } catch (error) {
      console.error("Unfollow error:", error);
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  // Get followers
  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.params.id);
      res.json({
        followers: followers.map((f) => {
          return f;
        }),
      });
    } catch (error) {
      console.error("Get followers error:", error);
      res.status(500).json({ error: "Failed to get followers" });
    }
  });

  // Get following
  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const following = await storage.getFollowing(req.params.id);
      res.json({
        following: following.map((f) => {
          return f;
        }),
      });
    } catch (error) {
      console.error("Get following error:", error);
      res.status(500).json({ error: "Failed to get following" });
    }
  });

  // ============ POUTINE ROYALE (ARCADE) ROUTES ============
  app.get("/api/royale/tournaments", async (_req, res) => {
    try {
      const tournaments = await RoyaleService.getActiveTournaments();
      res.json(tournaments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/royale/join", requireAuth, async (req, res) => {
    try {
      const result = await RoyaleService.joinTournament(
        req.userId!,
        req.body.tournamentId,
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/royale/submit", requireAuth, async (req, res) => {
    try {
      const { tournamentId, score, layers, metadata } = req.body;
      const result = await RoyaleService.submitScore(
        req.userId!,
        tournamentId,
        score,
        layers,
        metadata,
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/royale/leaderboard/:tournamentId", async (req, res) => {
    try {
      const leaderboard = await RoyaleService.getLeaderboard(
        req.params.tournamentId,
      );
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ STORIES ROUTES ============

  // Get active stories
  app.get("/api/stories", optionalAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const stories = await storage.getActiveStories(userId);
      res.json({ stories });
    } catch (error) {
      console.error("Get stories error:", error);
      res.status(500).json({ error: "Failed to get stories" });
    }
  });

  // Create story
  app.post("/api/stories", requireAuth, async (req, res) => {
    try {
      // Stories expire after 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const parsed = insertStorySchema.safeParse({
        ...req.body,
        userId: req.userId,
        expiresAt,
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const story = await storage.createStory(parsed.data);
      res.status(201).json({ story });
    } catch (error) {
      console.error("Create story error:", error);
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  // Mark story as viewed
  app.post("/api/stories/:id/view", requireAuth, async (req, res) => {
    try {
      await storage.markStoryViewed(req.params.id, req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark story viewed error:", error);
      res.status(500).json({ error: "Failed to mark story viewed" });
    }
  });

  // ============ NOTIFICATIONS ROUTES ============

  // Get notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.userId!);
      res.json({ notifications });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification read" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ error: "Failed to mark notifications read" });
    }
  });

  // ============ AI GENERATION ROUTES ============

  // Generate image with Flux
  app.post(
    "/api/ai/generate-image",
    aiRateLimiter,
    requireAuth,
    async (req, res) => {
      try {
        const { prompt, aspectRatio = "1:1" } = req.body;

        if (!prompt || typeof prompt !== "string") {
          return res.status(400).json({ error: "Prompt is required" });
        }

        if (!process.env.FAL_API_KEY) {
          return res.status(500).json({ error: "FAL API key not configured" });
        }

        console.log(
          `Generating image with Flux: "${prompt.substring(0, 50)}..."`,
        );

        const result = await traceExternalAPI(
          "fal-ai",
          "flux/schnell",
          "POST",
          async (span) => {
            span.setAttributes({
              "ai.model": "flux-schnell",
              "ai.prompt_length": prompt.length,
              "ai.aspect_ratio": aspectRatio,
            });

            return fal.subscribe("fal-ai/flux/schnell", {
              input: {
                prompt,
                image_size:
                  aspectRatio === "16:9"
                    ? "landscape_16_9"
                    : aspectRatio === "9:16"
                      ? "portrait_16_9"
                      : aspectRatio === "4:3"
                        ? "landscape_4_3"
                        : aspectRatio === "3:4"
                          ? "portrait_4_3"
                          : "square",
                num_images: 1,
              },
              logs: true,
              onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                  console.log("Flux generation in progress...");
                }
              },
            });
          },
        );

        const images = (result.data as any)?.images || [];
        if (images.length === 0) {
          return res.status(500).json({ error: "No image generated" });
        }

        res.json({
          imageUrl: images[0].url,
          prompt,
        });
      } catch (error: any) {
        console.error("AI image generation error:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to generate image" });
      }
    },
  );

  // Enhanced TI-GUY AI Chat (Vertex AI-powered dual-purpose assistant)
  app.post(
    "/api/ai/tiguy-chat",
    aiRateLimiter,
    requireAuth,
    async (req, res) => {
      try {
        const { message, conversationHistory = [], mode = "auto" } = req.body;

        if (!message || typeof message !== "string") {
          return res.status(400).json({ error: "Message is required" });
        }

        // Determine mode based on context or user preference
        let aiMode: "content" | "customer_service" = "content";

        if (mode === "customer_service") {
          aiMode = "customer_service";
        } else if (mode === "auto") {
          // Auto-detect mode based on message content
          const customerKeywords = [
            "help",
            "problem",
            "issue",
            "support",
            "question",
            "comment",
            "report",
            "aide",
            "problème",
            "question",
          ];
          const hasCustomerKeywords = customerKeywords.some((keyword) =>
            message.toLowerCase().includes(keyword),
          );
          aiMode = hasCustomerKeywords ? "customer_service" : "content";
        } else {
          aiMode = mode as "content" | "customer_service";
        }

        // Build context from conversation history
        const context = conversationHistory
          .slice(-5)
          .map((msg: any) => `${msg.sender}: ${msg.text}`)
          .join("\n");

        const request: ContentGenerationRequest = {
          mode: aiMode,
          message,
          context,
          language: "auto",
        };

        // Determine use case from route
        const useCase = aiMode === "customer_service" ? "customer_service" : "chat";
        const userCredits = (req as any).userCredits || 0; // Get from auth middleware if available

        const response = await generateWithTIGuy(request, userCredits, useCase);

        res.json({
          response: response.content,
          mode: response.mode,
          confidence: response.confidence,
          language: response.language,
          // Include AI metadata for frontend visibility
          metadata: response.metadata ? {
            intendedModel: response.metadata.intendedModel,
            actualModel: response.metadata.actualModel,
            circuitBreakerIntervened: response.metadata.circuitBreakerIntervened,
          } : undefined,
        });
      } catch (error: any) {
        console.error("Enhanced TI-GUY AI error:", error);
        res.status(500).json({
          error: error.message || "Ti-Guy est fatigué, réessaie plus tard!",
          fallback: true,
        });
      }
    },
  );

  // Vertex AI Content Moderation
  app.post("/api/ai/moderate", aiRateLimiter, requireAuth, async (req, res) => {
    try {
      const { content, type = "text" } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const result: ModerationResult = await moderateContent(content, type);

      res.json(result);
    } catch (error: any) {
      console.error("Content moderation error:", error);
      res.status(500).json({
        error: error.message || "Moderation service unavailable",
        allowed: true, // Safe fallback
        reasons: ["service_error"],
        severity: "low",
      });
    }
  });

  // Vertex AI Image Generation
  app.post(
    "/api/ai/generate-image",
    aiRateLimiter,
    requireAuth,
    async (req, res) => {
      try {
        const { prompt, aspectRatio = "1:1", style } = req.body;

        if (!prompt || typeof prompt !== "string") {
          return res.status(400).json({ error: "Prompt is required" });
        }

        const request: ImageGenerationRequest = {
          prompt,
          aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3",
          style,
          language: "fr",
        };

        const result: ImageGenerationResponse = await generateImage(request);

        res.json(result);
      } catch (error: any) {
        console.error("Image generation error:", error);
        res.status(500).json({
          error: error.message || "Image generation failed",
        });
      }
    },
  );

  // French Audio Transcription
  app.post(
    "/api/ai/transcribe",
    aiRateLimiter,
    requireAuth,
    async (req, res) => {
      try {
        const { audioData, language = "fr-CA" } = req.body;

        if (!audioData) {
          return res.status(400).json({ error: "Audio data is required" });
        }

        // Convert base64 to buffer
        const audioBuffer = Buffer.from(audioData, "base64");

        const result: TranscriptionResult = await transcribeAudio(
          audioBuffer,
          language as "fr-CA" | "fr-FR" | "en-US",
        );

        res.json(result);
      } catch (error: any) {
        console.error("Transcription error:", error);
        res.status(500).json({
          error: error.message || "Transcription failed",
          transcript: "",
          confidence: 0,
        });
      }
    },
  );

  // Vertex AI Health Check
  app.get("/api/ai/health", async (req, res) => {
    try {
      const health = await checkVertexAIHealth();

      const overallHealth = health.vertexAI && health.speech && health.vision;

      res.json({
        status: overallHealth ? "healthy" : "degraded",
        services: health,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Health check error:", error);
      res.status(500).json({
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Support Ticket Management
  app.post("/api/support/tickets", requireAuth, async (req, res) => {
    try {
      const { subject, description, category, priority = "normal" } = req.body;

      if (!subject || !description) {
        return res
          .status(400)
          .json({ error: "Subject and description are required" });
      }

      const ticket = await storage.createSupportTicket({
        user_id: req.userId,
        subject,
        description,
        category,
        priority,
        status: "open",
      });

      // Add initial message from user
      await storage.addTicketMessage({
        ticket_id: ticket.id,
        sender_type: "user",
        sender_id: req.userId,
        message: description,
      });

      res.status(201).json({
        ticket,
        message:
          "Votre demande de support a été créée. Ti-Guy va vous aider! 🦫",
      });
    } catch (error: any) {
      console.error("Create support ticket error:", error);
      res.status(500).json({ error: "Failed to create support ticket" });
    }
  });

  app.get("/api/support/tickets", requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getUserSupportTickets(req.userId!);
      res.json({ tickets });
    } catch (error: any) {
      console.error("Get support tickets error:", error);
      res.status(500).json({ error: "Failed to get support tickets" });
    }
  });

  app.get("/api/support/tickets/:ticketId", requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.ticketId);

      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check if user owns this ticket
      if (ticket.user_id !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({ ticket });
    } catch (error: any) {
      console.error("Get support ticket error:", error);
      res.status(500).json({ error: "Failed to get support ticket" });
    }
  });

  app.post(
    "/api/support/tickets/:ticketId/messages",
    requireAuth,
    async (req, res) => {
      try {
        const { message } = req.body;
        const ticketId = req.params.ticketId;

        if (!message) {
          return res.status(400).json({ error: "Message is required" });
        }

        // Verify ticket ownership
        const ticket = await storage.getSupportTicket(ticketId);
        if (!ticket || ticket.user_id !== req.userId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const ticketMessage = await storage.addTicketMessage({
          ticket_id: ticketId,
          sender_type: "user",
          sender_id: req.userId,
          message,
        });

        res.status(201).json({ message: ticketMessage });
      } catch (error: any) {
        console.error("Add ticket message error:", error);
        res.status(500).json({ error: "Failed to add message" });
      }
    },
  );

  // V3 Flow - Orchestrated AI actions
  app.post("/api/v3/flow", aiRateLimiter, requireAuth, async (req, res) => {
    try {
      const { action, context } = req.body;

      if (!action || typeof action !== "string") {
        return res.status(400).json({ error: "Action is required" });
      }

      if (!process.env.DEEPSEEK_API_KEY) {
        return res
          .status(500)
          .json({ error: "DeepSeek API key not configured" });
      }

      const result = await v3Flow(action, context);
      res.json(result);
    } catch (error: any) {
      console.error("V3 Flow error:", error);
      res.status(500).json({ error: error.message || "V3 flow failed" });
    }
  });

  // V3 Feed - Generate AI feed items
  app.post(
    "/api/v3/feed-item",
    aiRateLimiter,
    requireAuth,
    async (req, res) => {
      try {
        const { context } = req.body;

        if (!process.env.DEEPSEEK_API_KEY) {
          return res
            .status(500)
            .json({ error: "DeepSeek API key not configured" });
        }

        const feedItem = await v3Feed(context);
        res.json(feedItem);
      } catch (error: any) {
        console.error("V3 Feed error:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to generate feed item" });
      }
    },
  );

  // V3 Microcopy - Generate UI text in Ti-Guy voice
  app.post(
    "/api/v3/microcopy",
    aiRateLimiter,
    requireAuth,
    async (req, res) => {
      try {
        const { type, context } = req.body;

        if (
          !type ||
          ![
            "loading",
            "error",
            "success",
            "onboarding",
            "empty_state",
          ].includes(type)
        ) {
          return res.status(400).json({ error: "Valid type is required" });
        }

        if (!process.env.DEEPSEEK_API_KEY) {
          return res
            .status(500)
            .json({ error: "DeepSeek API key not configured" });
        }

        const text = await v3Microcopy(type, context);
        res.json({ text });
      } catch (error: any) {
        console.error("V3 Microcopy error:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to generate microcopy" });
      }
    },
  );

  // Get FAL presets
  app.get("/api/v3/fal-presets", requireAuth, (req, res) => {
    res.json(FAL_PRESETS);
  });

  // Generate video with Kling (image-to-video)
  app.post(
    "/api/ai/generate-video",
    aiRateLimiter,
    requireAuth,
    async (req, res) => {
      try {
        const {
          imageUrl,
          prompt = "Animate this image with natural movement",
        } = req.body;

        if (!imageUrl || typeof imageUrl !== "string") {
          return res.status(400).json({ error: "Image URL is required" });
        }

        if (!process.env.FAL_API_KEY) {
          return res.status(500).json({ error: "FAL API key not configured" });
        }

        console.log(`Generating video with Kling from image...`);

        const result = await fal.subscribe(
          "fal-ai/kling-video/v2/master/image-to-video",
          {
            input: {
              image_url: imageUrl,
              prompt,
              duration: "5" as const,
            },
            logs: true,
            onQueueUpdate: (update) => {
              if (update.status === "IN_PROGRESS") {
                console.log("Kling video generation in progress...");
              }
            },
          },
        );

        const video = (result.data as any)?.video;
        if (!video?.url) {
          return res.status(500).json({ error: "No video generated" });
        }

        res.json({
          videoUrl: video.url,
          prompt,
        });
      } catch (error: any) {
        console.error("AI video generation error:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to generate video" });
      }
    },
  );

  // ============ STRIPE SUBSCRIPTION ROUTES ============
  // TODO: These routes use the centralized billing module

  // Create checkout session for premium subscription
  app.post("/api/stripe/create-checkout", requireAuth, async (req, res) => {
    try {
      const { tier = "bronze" } = req.body;
      const origin = req.headers.origin || "http://localhost:5173";

      // TODO: Use billing module once fully configured
      const { createCheckoutSession } = await import("../shared/billing.js");
      const result = await createCheckoutSession(req.userId!, tier, origin);

      if (result.error) {
        return res.status(500).json({ error: result.error.message });
      }

      if (!result.url) {
        return res.status(500).json({ error: "Failed to create checkout session" });
      }

      res.json({ url: result.url });
    } catch (error: any) {
      console.error("Stripe checkout error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // Get subscription status
  app.get("/api/stripe/subscription-status", requireAuth, async (req, res) => {
    try {
      // TODO: Use billing module once fully configured
      const { getSubscriptionStatus } = await import("../shared/billing.js");
      const status = await getSubscriptionStatus(req.userId!);

      res.json({
        isPremium: status.isPremium,
        subscriptionEnd: status.subscriptionEnd,
        tier: status.tier,
        status: status.status,
      });
    } catch (error: any) {
      console.error("Subscription status error:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  // Stripe webhook handler
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        return res.status(400).json({ error: "Missing stripe-signature header" });
      }

      // TODO: Use billing module once fully configured
      const { handleStripeWebhook } = await import("../shared/billing.js");
      await handleStripeWebhook(req.body, signature);

      res.json({ received: true });
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({ error: error.message || "Webhook processing failed" });
    }
  });

  // ============ EMAIL AUTOMATION ROUTES ============

  // Admin middleware for email management routes
  async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await storage.getUser(req.userId);
    if (!user || !(user as any).isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  }

  // Get pending emails (admin only)
  app.get("/api/email/pending", requireAdmin, async (req, res) => {
    try {
      const pendingEmails = emailAutomation.getPendingEmails();
      res.json({
        count: pendingEmails.length,
        emails: pendingEmails.map((e) => ({
          id: e.id,
          type: e.emailType,
          scheduledFor: e.scheduledFor,
          status: e.status,
        })),
      });
    } catch (error: any) {
      console.error("Email pending error:", error);
      res.status(500).json({ error: "Failed to get pending emails" });
    }
  });

  // Process email queue (admin only - in production use cron job)
  app.post("/api/email/process-queue", requireAdmin, async (req, res) => {
    try {
      const sentCount = await emailAutomation.processEmailQueue();
      res.json({
        success: true,
        processed: sentCount,
        message: `Processed ${sentCount} emails`,
      });
    } catch (error: any) {
      console.error("Email queue processing error:", error);
      res.status(500).json({ error: "Failed to process email queue" });
    }
  });

  // Send test welcome email (for testing)
  app.post("/api/email/send-welcome", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const result = await emailAutomation.sendEmailNow(userId, "welcome");

      if (result.success) {
        res.json({ success: true, message: "Welcome email sent!" });
      } else {
        res.status(500).json({ error: result.error || "Failed to send email" });
      }
    } catch (error: any) {
      console.error("Send welcome email error:", error);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  });

  // Resend webhook handler for tracking email events
  app.post("/api/email/webhook", async (req, res) => {
    try {
      const event = req.body;
      console.log(`[Resend Webhook] Event received:`, event.type);

      switch (event.type) {
        case "email.sent":
          console.log(`[Resend] Email sent: ${event.data?.email_id}`);
          break;
        case "email.delivered":
          console.log(`[Resend] Email delivered: ${event.data?.email_id}`);
          break;
        case "email.opened":
          console.log(`[Resend] Email opened: ${event.data?.email_id}`);
          break;
        case "email.clicked":
          console.log(`[Resend] Email link clicked: ${event.data?.email_id}`);
          break;
        case "email.bounced":
          console.error(`[Resend] Email bounced: ${event.data?.email_id}`);
          break;
        case "email.complained":
          console.error(
            `[Resend] Email spam complaint: ${event.data?.email_id}`,
          );
          break;
        default:
          console.log(`[Resend] Unknown event: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Preview email content (for testing)
  app.post("/api/email/preview", requireAuth, async (req, res) => {
    try {
      const { emailType, username } = req.body;

      if (!emailType || !username) {
        return res
          .status(400)
          .json({ error: "emailType and username required" });
      }

      const content = await emailAutomation.generatePersonalizedContent(
        emailType,
        username,
        req.body.context,
      );

      res.json(content);
    } catch (error: any) {
      console.error("Email preview error:", error);
      res.status(500).json({ error: "Failed to generate email preview" });
    }
  });

  // Manually trigger onboarding sequence (for testing)
  app.post("/api/email/trigger-onboarding", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      emailAutomation.scheduleOnboardingSequence(userId);
      res.json({
        success: true,
        message: "Onboarding sequence scheduled",
      });
    } catch (error: any) {
      console.error("Email trigger error:", error);
      res.status(500).json({ error: "Failed to trigger onboarding" });
    }
  });

  // Cancel pending emails for current user only (user can cancel their own)
  app.delete("/api/email/cancel", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const { emailType } = req.body;

      // Users can only cancel their own emails
      const cancelled = emailAutomation.cancelPendingEmails(userId, emailType);
      res.json({
        success: true,
        cancelled,
        message: `Cancelled ${cancelled} pending emails`,
      });
    } catch (error: any) {
      console.error("Email cancel error:", error);
      res.status(500).json({ error: "Failed to cancel emails" });
    }
  });

  // ============ VIRTUAL GIFTS ROUTES ============

  // Get gift catalog
  app.get("/api/gifts/catalog", (req, res) => {
    res.json({
      gifts: Object.entries(GIFT_CATALOG).map(([type, info]) => ({
        type,
        ...info,
        priceDisplay: `$${(info.price / 100).toFixed(2)}`,
      })),
    });
  });

  // Create payment intent for gift purchase
  app.post(
    "/api/gifts/create-payment-intent",
    requireAuth,
    async (req, res) => {
      try {
        const { giftType, postId } = req.body;

        if (!stripe) {
          return res.status(500).json({ error: "Stripe not configured" });
        }

        // Validate gift type
        if (!giftType || !(giftType in GIFT_CATALOG)) {
          return res.status(400).json({ error: "Invalid gift type" });
        }

        // Validate post exists and get recipient
        const post = await storage.getPost(postId);
        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }

        const senderId = req.userId!;
        const recipientId = post.userId;

        // Can't gift your own post
        if (senderId === recipientId) {
          return res
            .status(400)
            .json({ error: "Tu peux pas t'envoyer un cadeau à toi-même! 🎁" });
        }

        const giftInfo = GIFT_CATALOG[giftType as GiftType];
        const amount = giftInfo.price;

        // TODO: Use billing module instead of direct Stripe call
        const { createPaymentIntent } = await import("../shared/billing.js");
        const result = await createPaymentIntent(amount, "cad", {
          type: "gift",
          giftType,
          postId,
          senderId,
          recipientId,
        });

        if (result.error || !result.clientSecret) {
          return res.status(500).json({ 
            error: result.error?.message || "Failed to create payment intent" 
          });
        }

        res.json({
          clientSecret: result.clientSecret,
          amount,
          giftInfo,
        });
      } catch (error: any) {
        console.error("Gift payment intent error:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to create payment intent" });
      }
    },
  );

  // Confirm gift after successful payment
  app.post("/api/gifts/confirm", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, giftType, postId } = req.body;
      const senderId = req.userId!;

      if (!paymentIntentId || !giftType || !postId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify payment was successful
      // TODO: Use billing module for payment verification
      const { verifyPaymentIntent } = await import("../shared/billing.js");
      const verification = await verifyPaymentIntent(paymentIntentId);
      
      if (verification.error) {
        return res.status(500).json({ error: verification.error.message });
      }

      if (verification.status !== "succeeded") {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Verify metadata matches
      if (
        verification.metadata.postId !== postId ||
        verification.metadata.giftType !== giftType ||
        verification.metadata.senderId !== senderId
      ) {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      const recipientId = verification.metadata.recipientId;

      // Get recipient's hive for regional gift filtering
      const recipient = await storage.getUser(recipientId);
      const recipientHive = recipient?.hiveId || "quebec";

      // Filter available gifts by hive
      const availableGifts = Object.entries(
        GIFT_CATALOG as Record<string, any>,
      ).filter(([key, gift]) => !gift.hive || gift.hive === recipientHive);

      const availableGiftTypes = Object.fromEntries(availableGifts);
      const giftInfo = availableGiftTypes[giftType as GiftType];

      if (!giftInfo) {
        return res.status(400).json({
          error: `Gift type '${giftType}' not available in hive '${recipientHive}'`,
        });
      }

      // Create the gift
      const gift = await storage.createGift({
        senderId,
        recipientId,
        postId,
        giftType,
        amount: giftInfo.price,
        stripePaymentId: paymentIntentId,
      });

      // Create notification for recipient
      const sender = await storage.getUser(senderId);
      await storage.createNotification({
        userId: recipientId,
        type: "gift",
        fromUserId: senderId,
        postId,
        giftId: gift.id,
        message: `${sender?.displayName || sender?.username} t'a envoyé un ${giftInfo.emoji} ${giftInfo.name}!`,
      });

      res.json({
        success: true,
        gift,
        giftInfo,
      });
    } catch (error: any) {
      console.error("Gift confirm error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to confirm gift" });
    }
  });

  // Get available gifts for a hive
  app.get("/api/gifts/catalog/:hiveId?", async (req, res) => {
    try {
      const hiveId = req.params.hiveId || "quebec";

      // Filter gifts by hive (universal + regional)
      const availableGifts = Object.entries(
        GIFT_CATALOG as Record<string, any>,
      ).filter(([key, gift]) => !gift.hive || gift.hive === hiveId);

      const giftCatalog = Object.fromEntries(availableGifts);

      res.json({
        hiveId,
        gifts: giftCatalog,
      });
    } catch (error: any) {
      console.error("Get gift catalog error:", error);
      res.status(500).json({ error: "Failed to get gift catalog" });
    }
  });

  // Clean up expired ephemeral posts (Fantasma Mode maintenance)
  app.post("/api/admin/cleanup-ephemeral", requireAuth, async (req, res) => {
    try {
      // Only allow admin users
      const user = await storage.getUser(req.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const deletedCount = await storage.cleanupExpiredEphemeralPosts();

      res.json({
        success: true,
        deletedCount,
        message: `Cleaned up ${deletedCount} expired ephemeral posts`,
      });
    } catch (error: any) {
      console.error("Cleanup ephemeral posts error:", error);
      res.status(500).json({ error: "Failed to cleanup ephemeral posts" });
    }
  });

  // Get gifts for a post
  app.get("/api/posts/:id/gifts", async (req, res) => {
    try {
      const postId = req.params.id;
      const gifts = await storage.getGiftsByPost(postId);
      const count = await storage.getPostGiftCount(postId);

      // Group by gift type for display
      const giftCounts: Record<string, number> = {};
      gifts.forEach((g) => {
        giftCounts[g.giftType] = (giftCounts[g.giftType] || 0) + 1;
      });

      res.json({
        totalCount: count,
        giftCounts,
        recentGifts: gifts.slice(0, 5).map((g) => ({
          id: g.id,
          type: g.giftType,
          sender: {
            id: g.sender.id,
            username: g.sender.username,
            displayName: g.sender.displayName,
            avatarUrl: g.sender.avatarUrl,
          },
          createdAt: g.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("Get post gifts error:", error);
      res.status(500).json({ error: "Failed to get gifts" });
    }
  });

  // Get user's received gifts
  app.get("/api/users/me/gifts", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const gifts = await storage.getUserReceivedGifts(userId);

      res.json({
        gifts: gifts.map((g) => ({
          id: g.id,
          type: g.giftType,
          amount: g.amount,
          sender: {
            id: g.sender.id,
            username: g.sender.username,
            displayName: g.sender.displayName,
            avatarUrl: g.sender.avatarUrl,
          },
          post: {
            id: g.post.id,
            mediaUrl: g.post.mediaUrl,
          },
          createdAt: g.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("Get user gifts error:", error);
      res.status(500).json({ error: "Failed to get gifts" });
    }
  });

  // [TI-SCRIPT] Dictionary Lookup Route
  app.get("/api/dictionary/lookup/:word", async (req, res) => {
    try {
      const { word } = req.params;
      const entry = await lookupWord(word);

      if (!entry) {
        return res
          .status(404)
          .json({ error: "Mot non trouvé dans le dictionnaire local." });
      }

      res.json(entry);
    } catch (error: any) {
      console.error("Dictionary lookup error:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la recherche dans le dictionnaire." });
    }
  });

  // ============ PARENTAL CONTROLS ROUTES ============

  // Link a child account
  app.post("/api/parental/link", requireAuth, async (req, res) => {
    try {
      const parentId = req.userId!;
      const { childUsername } = req.body;

      if (!childUsername) {
        return res.status(400).json({ error: "Nom d'utilisateur requis." });
      }

      const child = await storage.linkChild(parentId, childUsername);
      if (!child) {
        return res
          .status(404)
          .json({ error: "Utilisateur introuvable. T'es sûr du nom?" });
      }

      res.json({ success: true, child });
    } catch (error: any) {
      console.error("Link child error:", error);
      res.status(500).json({ error: "Erreur lors du jumelage." });
    }
  });

  // Get children linked to parent
  app.get("/api/parental/children", requireAuth, async (req, res) => {
    try {
      const parentId = req.userId!;
      const children = await storage.getChildren(parentId);
      res.json({ children });
    } catch (error: any) {
      console.error("Get children error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération." });
    }
  });

  // Get parental controls for a child
  app.get(
    "/api/parental/controls/:childId",
    requireAuth,
    async (req, res: Response) => {
      try {
        const parentId = req.userId!;
        const { childId } = req.params;

        // Verify parent owns this child
        const child = await storage.getUser(childId);
        if (!child || child.parentId !== parentId) {
          return res.status(403).json({ error: "Accès refusé. Pas ton kid!" });
        }

        const controls = await storage.getParentalControls(childId);
        res.json({ controls: controls || {} });
      } catch (error: any) {
        console.error("Get controls error:", error);
        res.status(500).json({ error: "Erreur serveur." });
      }
    },
  );

  // Update parental controls
  app.post("/api/parental/controls", requireAuth, async (req, res) => {
    try {
      const parentId = req.userId!;
      const { childUserId, ...controlsData } = req.body;

      if (!childUserId) {
        return res.status(400).json({ error: "ID de l'enfant requis." });
      }

      // Verify parent owns this child
      const child = await storage.getUser(childUserId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ error: "Accès refusé." });
      }

      const updated = await storage.upsertParentalControls({
        childUserId,
        ...controlsData,
      });

      res.json({ success: true, controls: updated });
    } catch (error: any) {
      console.error("Update controls error:", error);
      res.status(500).json({ error: "Erreur lors de la sauvegarde." });
    }
  });

  // --- HIVE TAP ROUTES (Shadow Ledger) ---
  app.post("/api/hive-tap/token", requireAuth, async (req, res) => {
    try {
      const senderId = req.userId!;
      const { amount, location } = req.body;
      const token = await hiveTapService.generateHandshakeToken(
        senderId,
        amount,
        location,
      );
      res.json({ token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/hive-tap/process", requireAuth, async (req, res) => {
    try {
      const receiverId = req.userId!;
      const { token, location } = req.body;
      const result = await hiveTapService.processIncomingTap(
        receiverId,
        token,
        location,
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- VOUCHER & PAYOUT ROUTES (Giftbit Integration) ---
  app.post("/api/vouchers/payout", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const { brandCode, amountInCents, recipientEmail, firstName, lastName } =
        req.body;

      // 1. Initial deduction (Safe)
      const success = await storage.updateUser(userId, {
        cashCredits: sql`${users.cashCredits} - ${amountInCents}`,
      } as any);

      if (!success) {
        return res
          .status(400)
          .json({ error: "Balance insuffisante pour ce cadeau." });
      }

      // 2. Process Order via Giftbit
      const order = await giftbitService.placeOrder({
        userId,
        brandCode,
        priceInCents: amountInCents,
        recipientEmail,
        recipientFirstName: firstName,
        recipientLastName: lastName,
      });

      res.json({ success: true, order });
    } catch (error: any) {
      console.error("Payout error:", error);
      res.status(500).json({
        error:
          "Erreur lors de l'envoi du cadeau. Le remboursement est en cours.",
      });
    }
  });

  // ============ BOOTSTRAP AI / SWARM ROUTES ============
  // Hybrid AI System: DeepSeek + Fal.ai + Vertex Knowledge Base
  app.use("/api/ai", aiRoutes);
  app.use("/api/moderation", requireAuth, moderationRoutes);

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
  } catch (error) {
    console.warn(
      "[Colony Bridge] Metrics reporting disabled (module not found or failed to load).",
    );
  }
  // ============ DEEP ENHANCE ROUTES (Moved here) ============
  app.use("/api", requireAuth, enhanceRoutes);

  console.log("✅ Colony OS metrics bridge initialized");

  return httpServer;
}
