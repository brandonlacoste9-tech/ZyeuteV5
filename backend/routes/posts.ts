import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { sql } from "drizzle-orm";
import { insertPostSchema, insertCommentSchema } from "../../shared/schema.js";
import { v3Mod } from "../v3-swarm.js";
import { validatePostType } from "../../shared/utils/validatePostType.js";
import { getVideoQueue, getHLSVideoQueue } from "../queue.js";
import { evaluerPublication } from "../lib/evaluateur-video.js";
import { GovernanceBee } from "../ai/bees/governance-bee.js";
import { cacheMiddleware } from "../utils/cache.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseRest = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Import existing auth middlewares
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  next();
};

const router = Router();

// ============ POSTS ROUTES ============

// Get explore posts (public, popular) with Hive filtering
router.get(
  "/explore",
  cacheMiddleware(60),
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const hiveId = (req.query.hive as string) || "quebec";
    try {
      const posts = await storage.getExplorePosts(page, limit, hiveId);
      res.json({ posts, hiveId });
    } catch (error) {
      const err = error as Error | any;
      console.error("Get explore error:", {
        message: err.message,
        code: err.code,
        detail: err.detail,
      });
      res.status(200).json({ posts: [], hiveId });
    }
  },
);

// ⚜️ LES CHOIX DU GRAND CASTOR
router.get(
  "/publications/choix-du-castor",
  cacheMiddleware(120), // Cache for longer as these change less often
  async (req: Request, res: Response) => {
    try {
      const results = await storage.getRawDb().execute(sql`
      SELECT p.*, u.username, u.display_name, u.avatar_url
      FROM publications p
      JOIN user_profiles u ON p.user_id = u.id
      WHERE p.choix_du_castor = true
      ORDER BY p.score_momentum DESC, p.created_at DESC
      LIMIT 3
    `);
      res.json(results.rows || results);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des choix du Castor:",
        error,
      );
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

router.get("/publications/explore", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const posts = await storage.getRecentPosts(limit);
    res.json({ posts });
  } catch (error) {
    console.error("Get publications error:", error);
    res.status(500).json({ error: "Failed to get publications" });
  }
});

// Get nearby posts
router.get(
  "/posts/nearby",
  optionalAuth,
  async (req: Request, res: Response) => {
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
  },
);

// Get regional trending posts
router.get(
  "/posts/trending/:regionId",
  cacheMiddleware(30),
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const before = req.query.before
        ? new Date(req.query.before as string)
        : undefined;

      const posts = await storage.getRegionalTrendingPosts(
        req.params.regionId as string,
        limit,
        before,
      );
      res.json({ posts });
    } catch (error) {
      console.error("Get regional trending error:", error);
      res.status(500).json({ error: "Failed to get regional trending posts" });
    }
  },
);

// Get single post
router.get("/posts/:id", optionalAuth, async (req: Request, res: Response) => {
  try {
    const post = await storage.getPost(req.params.id as string);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    let isFired = false;
    if (req.userId) {
      isFired = await storage.hasUserFiredPost(
        req.params.id as string,
        req.userId,
      );
    }

    let viewCountIncremented = false;
    if (req.userId && post.isEphemeral) {
      const newViewCount = await storage.incrementPostViews(
        req.params.id as string,
      );
      viewCountIncremented = true;

      if (post.maxViews && newViewCount >= post.maxViews) {
        await storage.markPostBurned(
          req.params.id as string,
          "view_limit_exceeded",
        );
      }
    } else if (!post.isEphemeral) {
      await storage.incrementPostViews(req.params.id as string);
    }

    res.json({
      post: {
        ...post,
        isFired,
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
router.get("/users/:username/posts", async (req: Request, res: Response) => {
  try {
    const identifier = req.params.username as string;
    let user;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
      user = await storage.getUser(identifier);
    }

    if (!user) {
      user = await storage.getUserByUsername(identifier);
    }

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
router.post("/posts", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(req.userId!);
    const hiveId = user?.hiveId || "quebec";

    const body = { ...req.body };
    if (body.caption && !body.content) {
      body.content = body.caption;
    }

    if (body.videoType === "mux" && body.muxData) {
      const { assetId, playbackId, uploadId } = body.muxData;
      body.muxAssetId = assetId;
      body.muxUploadId = uploadId;
      body.muxPlaybackId = playbackId || null;
      if (playbackId) {
        body.mediaUrl = `https://stream.mux.com/${playbackId}.m3u8`;
        body.hlsUrl = body.mediaUrl;
        body.thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      }
      body.content =
        body.caption || body.content || "Nouveau partage sur Zyeuté! 🍁";
    }

    if (body.videoType === "pexels" && body.pexelsData) {
      const { videoUrl, thumbnail, duration } = body.pexelsData;
      body.mediaUrl = videoUrl;
      body.thumbnailUrl = thumbnail;
      body.duration = duration;
      body.content = body.caption || body.content || "Vidéo Pexels";
    }

    const parsed = insertPostSchema.safeParse({
      ...body,
      userId: req.userId,
      hiveId,
    });

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const moderationContent = `${parsed.data.caption || ""} ${parsed.data.content || ""}`;
    const modResult = await v3Mod(moderationContent);

    if (modResult.is_minor_danger) {
      console.error(`🚨 Child Safety Violation: Banning user ${req.userId}`);
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

      try {
        const { scanAndFlagRelatedUsers } =
          await import("../services/userFlaggingSystem.js");
        await scanAndFlagRelatedUsers(req.userId!);
      } catch (scanError) {
        console.error("Security scan error during ban:", scanError);
      }

      return res.status(403).json({
        error:
          "Votre compte a été banni pour violation grave des règles de sécurité (Tolérance Zéro).",
      });
    }

    let videoModerationApproved = true;
    if (parsed.data.mediaUrl && body.videoType !== "pexels") {
      const validatedType = validatePostType(
        parsed.data.mediaUrl,
        (parsed.data as any).type || "photo",
      );

      if (validatedType === "video") {
        try {
          const { moderateVideoFromUrl } =
            await import("../services/videoModeration.js");
          const videoModResult = await moderateVideoFromUrl(
            parsed.data.mediaUrl,
            moderationContent,
          );

          if (!videoModResult.approved) {
            await storage.createModerationLog({
              userId: req.userId!,
              action: videoModResult.is_minor_danger ? "ban" : "reject",
              reason: videoModResult.reason,
              details: `Video rejected`,
              score:
                videoModResult.severity === "critical"
                  ? 10
                  : videoModResult.severity === "high"
                    ? 5
                    : 2,
            });

            if (videoModResult.is_minor_danger) {
              await storage.updateUser(req.userId!, {
                role: "banned",
                bio: "COMPTE DÉSACTIVÉ.",
              });
              return res
                .status(403)
                .json({ error: "Votre compte a été banni." });
            }

            return res.status(403).json({
              error: `Vidéo rejetée: ${videoModResult.reason}`,
              moderation: {
                approved: false,
                severity: videoModResult.severity,
                reasons: videoModResult.reasons,
              },
            });
          }
          videoModerationApproved = videoModResult.approved;
        } catch (videoModError) {
          console.error("Video mod error:", videoModError);
        }
      }
    }

    const isEphemeral = req.body.isEphemeral === true;
    const maxViews = isEphemeral ? parseInt(req.body.maxViews) || 1 : undefined;
    const expiresAt = isEphemeral
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : undefined;

    const validatedType =
      body.videoType === "mux" || body.videoType === "pexels"
        ? "video"
        : validatePostType(
            parsed.data.mediaUrl,
            (parsed.data as any).type || "photo",
          );

    // Use Supabase REST to create post (no DATABASE_URL dependency)
    let post: any;
    if (supabaseRest) {
      const { data: postData, error: postErr } = await supabaseRest
        .from("publications")
        .insert({
          user_id: parsed.data.userId,
          content: parsed.data.content || parsed.data.caption,
          caption: parsed.data.caption,
          media_url: parsed.data.mediaUrl,
          hls_url: (parsed.data as any).hlsUrl || null,
          thumbnail_url: (parsed.data as any).thumbnailUrl || null,
          type: validatedType,
          processing_status: "completed",
          is_moderated: true,
          moderation_approved: modResult.status === "approved" && videoModerationApproved,
          est_masque: modResult.status !== "approved" || !videoModerationApproved,
          hive_id: parsed.data.hiveId || "quebec",
          region: (parsed.data as any).region || "montreal",
          visibility: (parsed.data as any).visibility || "public",
          visibilite: (parsed.data as any).visibility || "public",
          mux_asset_id: (parsed.data as any).muxAssetId || null,
          mux_upload_id: (parsed.data as any).muxUploadId || null,
          mux_playback_id: (parsed.data as any).muxPlaybackId || null,
          is_ephemeral: isEphemeral,
          max_views: maxViews || null,
          expires_at: expiresAt || null,
          video_source: body.videoType || "upload",
        })
        .select()
        .single();
      if (postErr) throw new Error("Failed to create post: " + postErr.message);
      post = { ...postData, id: postData.id, mediaUrl: postData.media_url, hlsUrl: postData.hls_url, userId: postData.user_id };
    } else {
      post = await storage.createPost({
        ...parsed.data,
        type: validatedType,
        processingStatus: "completed",
        isModerated: true,
        moderationApproved: modResult.status === "approved" && videoModerationApproved,
        isHidden: modResult.status !== "approved" || !videoModerationApproved,
        isEphemeral,
        maxViews,
        expiresAt,
      } as any);
    }

    const isMuxOrPexels =
      req.body.videoType === "mux" || req.body.videoType === "pexels";
    if (!isMuxOrPexels) {
      const videoQueue = getVideoQueue();
      await videoQueue.add("processVideo", {
        postId: post.id,
        videoUrl: post.mediaUrl,
        userId: req.userId,
        visual_filter: req.body.visual_filter || "prestige",
      });

      const hlsQueue = getHLSVideoQueue();
      if (hlsQueue && post.mediaUrl) {
        hlsQueue
          .add("processHLS", {
            postId: post.id,
            videoUrl: post.mediaUrl,
            userId: req.userId,
          })
          .catch(() => {});
      }
    }

    if (validatedType === "video" && post.mediaUrl) {
      const bucketName = process.env.GCS_BUCKET_NAME || "zyeute-videos";
      if (post.mediaUrl.includes(bucketName)) {
        const urlParts = post.mediaUrl.split(bucketName + "/");
        if (urlParts.length > 1) {
          const gcsUri = `gs://${bucketName}/${urlParts[1]}`;
          (async () => {
            try {
              const verdict = await evaluerPublication(gcsUri);
              if (verdict.decision === "promouvoir") {
                await GovernanceBee.ajuster_momentum(post.id);
              }
            } catch (e) {
              console.error("Automated promotion eval failed:", e);
            }
          })();
        }
      }
    }

    res.status(201).json({
      post,
      moderation: {
        approved: modResult.status === "approved",
        reason: modResult.status !== "approved" ? modResult.reason : null,
      },
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Delete post
router.delete(
  "/posts/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const post = await storage.getPost(req.params.id as string);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (post.userId !== req.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.deletePost(req.params.id as string);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  },
);

// ============ REACTIONS ROUTES ============

// Toggle fire reaction on post
router.post(
  "/posts/:id/fire",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const result = await storage.togglePostReaction(
        req.params.id as string,
        req.userId!,
      );
      // Broadcasting logic omitted here since io is attached to app usually.
      // Ideally io logic belongs to a standalone notification service, but we will return the result.
      res.json(result);
    } catch (error) {
      console.error("Toggle fire error:", error);
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  },
);

// ============ COMMENTS ROUTES ============

// Get post comments
router.get("/posts/:id/comments", async (req: Request, res: Response) => {
  try {
    const comments = await storage.getPostComments(req.params.id as string);
    res.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Failed to get comments" });
  }
});

// Add comment
router.post(
  "/posts/:id/comments",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const parsed = insertCommentSchema.safeParse({
        postId: req.params.id,
        userId: req.userId,
        content: req.body.content,
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const comment = await storage.createComment(parsed.data);
      const user = await storage.getUser(req.userId!);

      res.status(201).json({
        comment: { ...comment, user, isFired: false },
      });
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  },
);

// Delete comment
router.delete(
  "/comments/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteComment(req.params.id as string);
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  },
);

// Toggle fire on comment
router.post(
  "/comments/:id/fire",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const result = await storage.toggleCommentReaction(
        req.params.id as string,
        req.userId!,
      );
      res.json(result);
    } catch (error) {
      console.error("Toggle comment fire error:", error);
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  },
);

export default router;
