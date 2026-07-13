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

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";
const supabaseRest =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

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

    const isMuxUpload = body.videoType === "mux";
    let videoModerationApproved = true;
    // Mux HLS URLs are playlists, not fetchable MP4 — skip Gemini video mod (also avoids 15s+ timeouts).
    if (parsed.data.mediaUrl && !isMuxUpload) {
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
      body.videoType === "mux"
        ? "video"
        : validatePostType(
            parsed.data.mediaUrl,
            (parsed.data as any).type || "photo",
          );

    // Use Supabase REST to create post (no DATABASE_URL dependency)
    let post: any;
    if (supabaseRest) {
      const regionId =
        (parsed.data as any).regionId ||
        (parsed.data as any).region ||
        "montreal";
      const { data: postData, error: postErr } = await supabaseRest
        .from("publications")
        .insert({
          user_id: parsed.data.userId,
          content: parsed.data.content || parsed.data.caption || "",
          caption: parsed.data.caption,
          media_url: parsed.data.mediaUrl || null,
          hls_url: (parsed.data as any).hlsUrl || null,
          thumbnail_url: (parsed.data as any).thumbnailUrl || null,
          type: validatedType,
          processing_status:
            isMuxUpload && !(parsed.data as any).muxPlaybackId
              ? "processing"
              : (req.body.processing_status as string) || "completed",
          is_moderated: true,
          moderation_approved:
            modResult.status === "approved" && videoModerationApproved,
          est_masque:
            modResult.status !== "approved" || !videoModerationApproved,
          hive_id: parsed.data.hiveId || "quebec",
          region_id: regionId,
          region: regionId,
          visibility: (parsed.data as any).visibility || "public",
          mux_asset_id: (parsed.data as any).muxAssetId || null,
          mux_upload_id: (parsed.data as any).muxUploadId || null,
          mux_playback_id: (parsed.data as any).muxPlaybackId || null,
          is_ephemeral: isEphemeral,
          max_views: maxViews || null,
          expires_at: expiresAt?.toISOString() ?? null,
          video_source: isMuxUpload ? "mux" : "upload",
        })
        .select()
        .single();
      if (postErr) throw new Error("Failed to create post: " + postErr.message);
      post = {
        ...postData,
        id: postData.id,
        mediaUrl: postData.media_url,
        hlsUrl: postData.hls_url,
        userId: postData.user_id,
      };
    } else {
      post = await storage.createPost({
        ...parsed.data,
        type: validatedType,
        processingStatus: "completed",
        isModerated: true,
        moderationApproved:
          modResult.status === "approved" && videoModerationApproved,
        isHidden: modResult.status !== "approved" || !videoModerationApproved,
        isEphemeral,
        maxViews,
        expiresAt,
      } as any);
    }

    const isMuxOrPexels = req.body.videoType === "mux";
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
    const message =
      error instanceof Error ? error.message : "Failed to create post";
    res.status(500).json({ error: message });
  }
});

// Delete post (soft-delete via Supabase — the direct pool times out in prod)
router.delete(
  "/posts/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!supabaseRest) throw new Error("Supabase not configured");

      const postId = req.params.id as string;
      const userId = req.userId!;
      const isAdmin =
        req.userRole === "admin" ||
        req.userRole === "moderator" ||
        req.userRole === "founder";

      // Fetch owner to enforce author-or-admin authorization.
      const { data: post, error: fetchError } = await supabaseRest
        .from("publications")
        .select("id, user_id")
        .eq("id", postId)
        .is("deleted_at", null)
        .maybeSingle();

      if (fetchError) throw new Error(fetchError.message);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (post.user_id !== userId && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Soft-delete: mark deleted_at + hide (est_masque) so it drops from feeds.
      const { error: updateError } = await supabaseRest
        .from("publications")
        .update({ deleted_at: new Date().toISOString(), est_masque: true })
        .eq("id", postId);

      if (updateError) throw new Error(updateError.message);

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
      const postId = req.params.id as string;
      const userId = req.userId!;

      // Use Supabase REST against the real `reactions` table
      // (Drizzle schema references post_reactions which doesn't exist in prod)
      if (!supabaseRest) throw new Error("Supabase not configured");

      const { data: existing } = await supabaseRest
        .from("reactions")
        .select("id")
        .eq("user_id", userId)
        .eq("publication_id", postId)
        .eq("type", "fire")
        .maybeSingle();

      let added: boolean;
      if (existing) {
        await supabaseRest.from("reactions").delete().eq("id", existing.id);
        added = false;
      } else {
        await supabaseRest
          .from("reactions")
          .insert({ user_id: userId, publication_id: postId, type: "fire" });
        added = true;
      }

      // Read then write updated reactions_count
      const { data: pub } = await supabaseRest
        .from("publications")
        .select("reactions_count")
        .eq("id", postId)
        .single();
      const current = (pub?.reactions_count as number) ?? 0;
      const newCount = added ? current + 1 : Math.max(0, current - 1);
      await supabaseRest
        .from("publications")
        .update({ reactions_count: newCount })
        .eq("id", postId);

      const result = { added, newCount };
      res.json(result);

      // [VIRAL SCORE] Recompute viral_score for this post immediately after a reaction
      // Fire-and-forget — does not block the response
      setImmediate(async () => {
        try {
          const supabaseUrl =
            process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
          const supabaseKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.VITE_SUPABASE_ANON_KEY ||
            "";
          if (!supabaseUrl || !supabaseKey) return;
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(supabaseUrl, supabaseKey);
          // Simple score: reactions * 10 + comments * 5, time-decayed
          // Full batch recompute handles the HN-formula; this is a quick single-row refresh
          const { error: rpcError } = await supabase.rpc(
            "recompute_viral_score",
            { post_id: req.params.id },
          );
          if (rpcError) {
            // RPC may not exist — fall back to simple update
            await supabase
              .from("publications")
              .update({
                viral_score: result.newCount * 10, // rough proxy until batch runs
              })
              .eq("id", req.params.id);
          }
        } catch (err) {
          // Non-critical — batch will catch it
          console.warn("[ViralScore] Quick update failed:", err);
        }
      });
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
    if (!supabaseRest) {
      return res.json({ comments: [] });
    }

    // No FK from commentaires.user_id -> user_profiles, so fetch separately
    const { data: rows, error } = await supabaseRest
      .from("commentaires")
      .select("id, publication_id, user_id, content, created_at")
      .eq("publication_id", req.params.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!rows || rows.length === 0) return res.json({ comments: [] });

    // Batch-fetch unique user profiles
    const userIds = [...new Set(rows.map((r: any) => r.user_id))];
    const { data: profiles } = await supabaseRest
      .from("user_profiles")
      .select("id, username, display_name, avatar_url, username_color")
      .in("id", userIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = p;
    });

    const comments = rows.map((c: any) => ({
      id: c.id,
      postId: c.publication_id,
      userId: c.user_id,
      content: c.content,
      created_at: c.created_at,
      user: profileMap[c.user_id] || null,
      isFired: false,
    }));

    return res.json({ comments });
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
      const content = (req.body.content || "").trim();
      if (!content || content.length > 500) {
        return res
          .status(400)
          .json({ error: "Contenu invalide (1-500 caractères)" });
      }

      if (!supabaseRest) throw new Error("Supabase not configured");

      // Insert directly via Supabase REST (Drizzle pool is dead on Render)
      const { data: commentData, error: insertErr } = await supabaseRest
        .from("commentaires")
        .insert({
          publication_id: req.params.id,
          user_id: req.userId,
          content,
        })
        .select("id, publication_id, user_id, content, created_at")
        .single();

      if (insertErr || !commentData) {
        console.error("[comments] insert error:", insertErr);
        return res
          .status(500)
          .json({ error: "Impossible d'ajouter le commentaire" });
      }

      // Fetch user profile for response
      const { data: userData, error: userFetchErr } = await supabaseRest
        .from("user_profiles")
        .select("id, username, display_name, avatar_url, username_color")
        .eq("id", req.userId!)
        .single();

      if (userFetchErr) {
        console.warn(
          "[comments] user profile fetch error:",
          userFetchErr.message,
          "userId:",
          req.userId,
        );
      }

      const comment = {
        id: commentData.id,
        postId: commentData.publication_id,
        // Dual snake/camel so any frontend consumer can read either field.
        publication_id: commentData.publication_id,
        userId: commentData.user_id,
        user_id: commentData.user_id,
        content: commentData.content,
        created_at: commentData.created_at,
        createdAt: commentData.created_at,
      };
      // If user profile fetch failed, return a minimal stub so the frontend
      // can at least display something instead of falling back to "Utilisateur".
      const user = userData ?? {
        id: req.userId,
        username: null,
        display_name: null,
        avatar_url: null,
        username_color: "#FFFFFF",
      };

      // Respond immediately — the comment is persisted. Notification and
      // moderation are non-critical side-effects and must never block (or fail)
      // the response, otherwise a slow Redis/queue makes the client time out
      // and surface "Impossible d'envoyer le commentaire" for a saved comment.
      res.status(201).json({
        comment: { ...comment, user, isFired: false },
      });

      // Push notification for new comment (best-effort, after response)
      void (async () => {
        try {
          const { data: pubData } = await supabaseRest!
            .from("publications")
            .select("user_id")
            .eq("id", req.params.id)
            .single();
          const postAuthorId = pubData?.user_id;
          const commenterUsername = (user as any)?.username || "";
          const postId = req.params.id as string;
          if (
            postAuthorId &&
            postAuthorId !== req.userId &&
            commenterUsername
          ) {
            const { notifyNewComment } =
              await import("../services/pushNotify.js");
            await notifyNewComment(postAuthorId, commenterUsername, postId);
          }
        } catch {
          /* non-critical */
        }
      })();

      // Moderation check (best-effort, after response)
      void (async () => {
        try {
          const { getModerationQueue } = await import("../queue.js");
          const moderationQueue = getModerationQueue();
          await moderationQueue.add("moderate-comment", {
            contentType: "comment",
            contentId: comment.id,
            userId: req.userId!,
            text: content,
          });
        } catch (modErr: any) {
          console.warn("[Moderation] Comment queue failed:", modErr?.message);
        }
      })();
      return;
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
      if (!supabaseRest) throw new Error("Supabase not configured");

      // Soft-delete: set deleted_at (commentaires has this column)
      const { data, error } = await supabaseRest
        .from("commentaires")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .eq("user_id", req.userId!) // only own comments
        .select("id")
        .single();

      if (error || !data) {
        return res.status(404).json({ error: "Commentaire introuvable" });
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
