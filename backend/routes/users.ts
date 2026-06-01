import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { supabaseAdmin, requireAuth, optionalAuth } from "../supabase-auth.js";

// Multer: store uploads in memory for Supabase Storage forwarding
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Enrich a user object with real follower/following/post counts from DB.
 * Goes straight to Supabase REST — no Drizzle (pool is unreliable on Render).
 * abonnements columns: follower_id, followee_id
 */
async function enrichUserCounts(user: any): Promise<any> {
  const sb = supabaseAdmin;
  if (!sb) return user;

  try {
    const uid = user.id as string;
    const [followersRes, followingRes, postsRes, subRes] = await Promise.all([
      // Followers: rows where followee_id = uid
      sb
        .from("abonnements")
        .select("*", { count: "exact", head: true })
        .eq("followee_id", uid),
      // Following: rows where follower_id = uid
      sb
        .from("abonnements")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", uid),
      // Posts: publications by this user
      sb
        .from("publications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid),
      // Active subscription tier
      sb
        .from("subscription_tiers")
        .select("tier_name")
        .eq("user_id", uid)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const followersCount = followersRes.count ?? 0;
    const followingCount = followingRes.count ?? 0;
    const postsCount = postsRes.count ?? 0;
    const tierName =
      (subRes as any)?.data?.tier_name || user.subscriptionTier || "free";

    return {
      ...user,
      followers_count: followersCount,
      followersCount: followersCount,
      following_count: followingCount,
      followingCount: followingCount,
      posts_count: postsCount,
      postsCount: postsCount,
      subscriptionTier: tierName,
      subscription_tier: tierName,
    };
  } catch (err) {
    console.warn("[enrichUserCounts] Failed:", err);
    return user;
  }
}

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Stricter for auth attempts
  message: {
    error: "Trop de tentatives. Réessaie dans quelques minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// ============ AUTH ROUTES (bridged via JWT) ============

// Resolve username to email (Helper for login with username)
router.post(
  "/auth/resolve-email",
  authRateLimiter,
  async (req: Request, res: Response) => {
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
  },
);

// Get current user profile
// Auto-provisions user row if Supabase auth user exists but DB row doesn't.
router.get("/auth/me", optionalAuth, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.json({ user: null });
    }

    let user: any = null;

    // Fast path: go straight to Supabase REST (skip Drizzle — pool unreliable on Render).
    // Drizzle times out after 2.5s before falling back, which pushes auth/me over the
    // frontend's 5s timeout and triggers the EMERGENCY render path.
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("id", req.userId)
        .maybeSingle();
      if (data) {
        user = {
          id: data.id,
          username: data.username || "",
          email: data.email || "",
          displayName: data.display_name,
          bio: data.bio,
          avatarUrl: data.avatar_url,
          region: data.region,
          role: data.role || "citoyen",
          isAdmin: data.is_admin || false,
          isPremium: data.is_premium || false,
          plan: data.plan || "free",
          credits: data.credits || 0,
          hiveId: data.hive_id || "quebec",
          city: data.city,
          regionId: data.region_id,
          subscriptionTier: data.subscription_tier || "free",
          tiGuyCommentsEnabled: data.ti_guy_comments_enabled ?? true,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          raisonBannissement: data.raison_bannissement,
          beeAlias: data.bee_alias,
          nectarPoints: data.nectar_points || 0,
          karmaCredits: data.karma_credits || 0,
          cashCredits: data.cash_credits || 0,
        };
      }
    } else {
      // supabaseAdmin unavailable — fall back to Drizzle
      try {
        user = await storage.getUser(req.userId);
      } catch (err) {
        console.error("[Auth] getUser fallback failed:", err);
      }
    }

    // Auto-provision: Supabase auth user exists but no user_profiles row yet
    if (!user) {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1];
        let email = "";
        let username = "";

        if (token && supabaseAdmin) {
          const { data } = await supabaseAdmin.auth.getUser(token);
          if (data?.user) {
            email = data.user.email || "";
            username =
              data.user.user_metadata?.username ||
              data.user.user_metadata?.full_name
                ?.toLowerCase()
                .replace(/\s+/g, "_") ||
              email.split("@")[0] ||
              `user_${req.userId.slice(0, 8)}`;
          }
        }

        if (!username) username = `user_${req.userId.slice(0, 8)}`;

        // Ensure username uniqueness
        if (supabaseAdmin) {
          const { data: existing } = await supabaseAdmin
            .from("user_profiles")
            .select("id")
            .eq("username", username)
            .maybeSingle();
          if (existing)
            username = `${username}_${Math.random().toString(36).slice(2, 6)}`;
        }

        user = await storage.createUser({
          id: req.userId,
          username,
          email,
          role: "citoyen",
        });

        console.log(
          `[Auth] Auto-provisioned user: ${username} (${req.userId})`,
        );
      } catch (provisionError) {
        console.error("[Auth] Auto-provision failed:", provisionError);
        return res.status(404).json({ error: "User not found" });
      }
    }

    // Ban check
    if (user?.role === "banned") {
      return res.status(403).json({
        error: "Compte désactivé.",
        isBanned: true,
        raisonBannissement: user.raisonBannissement,
      });
    }

    const { taxId, customPermissions, ...safeUser } = user;
    const enriched = await enrichUserCounts(safeUser);
    res.json({ user: enriched });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// ============ USER ROUTES ============

// Get user by username or UUID
router.get(
  "/users/:username",
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const identifier = req.params.username as string;
      let user: any;

      // Fast path: Supabase REST (skip Drizzle — pool unreliable on Render)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (supabaseAdmin) {
        const isUuid = uuidRegex.test(identifier);
        const { data } = isUuid
          ? await supabaseAdmin
              .from("user_profiles")
              .select("*")
              .eq("id", identifier)
              .maybeSingle()
          : await supabaseAdmin
              .from("user_profiles")
              .select("*")
              .eq("username", identifier)
              .maybeSingle();
        if (data) {
          user = {
            id: data.id,
            username: data.username || "",
            email: data.email || "",
            displayName: data.display_name,
            bio: data.bio,
            avatarUrl: data.avatar_url,
            region: data.region,
            role: data.role || "citoyen",
            isAdmin: data.is_admin || false,
            isPremium: data.is_premium || false,
            plan: data.plan || "free",
            credits: data.credits || 0,
            hiveId: data.hive_id || "quebec",
            city: data.city,
            regionId: data.region_id,
            subscriptionTier: data.subscription_tier || "free",
            tiGuyCommentsEnabled: data.ti_guy_comments_enabled ?? true,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            raisonBannissement: data.raison_bannissement,
            beeAlias: data.bee_alias,
            nectarPoints: data.nectar_points || 0,
            karmaCredits: data.karma_credits || 0,
            cashCredits: data.cash_credits || 0,
            piasseBalance: data.piasse_balance || 0,
            totalKarma: data.total_karma || 0,
          };
        }
      } else {
        // Drizzle fallback when supabaseAdmin not available
        if (uuidRegex.test(identifier))
          user = await storage.getUser(identifier);
        if (!user) user = await storage.getUserByUsername(identifier);
      }

      // Auto-provision: If requesting own profile by UUID and no DB row yet, create one
      if (!user && req.userId === identifier && uuidRegex.test(identifier)) {
        try {
          const authHeader = req.headers.authorization;
          const token = authHeader?.split(" ")[1];
          let email = "";
          let username = "";

          if (token && supabaseAdmin) {
            const { data } = await supabaseAdmin.auth.getUser(token);
            if (data?.user) {
              email = data.user.email || "";
              username =
                data.user.user_metadata?.username ||
                data.user.user_metadata?.full_name
                  ?.toLowerCase()
                  .replace(/\s+/g, "_") ||
                email.split("@")[0] ||
                `user_${identifier.slice(0, 8)}`;
            }
          }

          if (!username) username = `user_${identifier.slice(0, 8)}`;

          if (supabaseAdmin) {
            const { data: existing } = await supabaseAdmin
              .from("user_profiles")
              .select("id")
              .eq("username", username)
              .maybeSingle();
            if (existing)
              username = `${username}_${Math.random().toString(36).slice(2, 6)}`;
          }

          user = await storage.createUser({
            id: identifier,
            username,
            email,
            role: "citoyen",
          });

          console.log(
            `[Auth] Auto-provisioned user via /users/:id: ${username} (${identifier})`,
          );
        } catch (provisionError) {
          console.error(
            "[Auth] Auto-provision in /users/:id failed:",
            provisionError,
          );
        }
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const safeUser = user;

      // Check if current user follows this user
      let isFollowing = false;
      if (req.userId && req.userId !== user.id) {
        isFollowing = await storage.isFollowing(req.userId, user.id);
      }

      const enriched = await enrichUserCounts({ ...safeUser, isFollowing });
      res.json({ user: enriched });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  },
);

// Get current user profile (alias for /api/auth/me — same fast REST path)
router.get("/users/me", optionalAuth, async (req: Request, res: Response) => {
  if (!req.userId) return res.json({ user: null });
  try {
    if (!supabaseAdmin) {
      const user = await storage.getUser(req.userId);
      return res.json({ user });
    }
    const { data } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("id", req.userId)
      .maybeSingle();
    if (!data) return res.status(404).json({ error: "User not found" });
    const user = {
      id: data.id,
      username: data.username || "",
      email: data.email || "",
      displayName: data.display_name,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      region: data.region,
      role: data.role || "citoyen",
      isAdmin: data.is_admin || false,
      isPremium: data.is_premium || false,
      plan: data.plan || "free",
      credits: data.credits || 0,
      hiveId: data.hive_id || "quebec",
      city: data.city,
      regionId: data.region_id,
      subscriptionTier: data.subscription_tier || "free",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    const enriched = await enrichUserCounts(user);
    return res.json({ user: enriched });
  } catch (error) {
    console.error("Get /users/me error:", error);
    return res.status(500).json({ error: "Failed to get user" });
  }
});

// Update current user profile
router.patch("/users/me", requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate input with Zod schema
    const updateUserSchema = z.object({
      // Accept both camelCase (API standard) and snake_case (from ProfileEditSettings direct Supabase writes)
      displayName: z.string().min(1).max(100).optional(),
      display_name: z.string().min(1).max(100).optional(),
      username: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-z0-9_]+$/, "Lettres minuscules, chiffres et _ seulement")
        .optional(),
      bio: z.string().max(2200).optional(),
      avatarUrl: z.string().url().max(2048).optional(),
      avatar_url: z.string().url().max(2048).optional(),
      city: z.string().max(100).optional(),
      // region is plain text in DB (column was converted from enum to text)
      region: z.string().max(100).optional(),
      tiGuyCommentsEnabled: z.boolean().optional(),
      // Geo/language auto-detect fields
      hive_id: z.string().max(50).optional(),
      preferred_language: z.string().max(10).optional(),
      region_id: z.string().max(100).optional(),
    });

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    // Normalize snake_case aliases to camelCase for Drizzle ORM
    const rawData = parsed.data as Record<string, any>;
    const normalized: Record<string, any> = {};

    if (rawData.displayName !== undefined)
      normalized.displayName = rawData.displayName;
    if (rawData.display_name !== undefined)
      normalized.displayName = rawData.display_name;
    if (rawData.username !== undefined) {
      // Check for username uniqueness before updating
      const existing = await storage.getUserByUsername(rawData.username);
      if (existing && existing.id !== req.userId) {
        return res
          .status(409)
          .json({ error: "Ce nom d'utilisateur est déjà pris." });
      }
      normalized.username = rawData.username;
    }
    if (rawData.bio !== undefined) normalized.bio = rawData.bio;
    if (rawData.avatarUrl !== undefined)
      normalized.avatarUrl = rawData.avatarUrl;
    if (rawData.avatar_url !== undefined)
      normalized.avatarUrl = rawData.avatar_url;
    if (rawData.city !== undefined) normalized.city = rawData.city;
    if (rawData.region !== undefined) normalized.region = rawData.region;
    if (rawData.tiGuyCommentsEnabled !== undefined)
      normalized.tiGuyCommentsEnabled = rawData.tiGuyCommentsEnabled;
    if (rawData.hive_id !== undefined) normalized.hiveId = rawData.hive_id;
    if (rawData.region_id !== undefined)
      normalized.regionId = rawData.region_id;

    const updated = await storage.updateUser(req.userId!, normalized);

    // preferred_language is not in the Drizzle schema yet — persist via supabaseAdmin REST
    if (rawData.preferred_language !== undefined && supabaseAdmin) {
      void supabaseAdmin
        .from("user_profiles")
        .update({
          preferred_language: rawData.preferred_language,
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.userId!);
    }

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: updated });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ============ FOLLOWS ROUTES ============

// Follow user
router.post("/users/:id/follow", requireAuth, async (req, res) => {
  try {
    if ((req.params.id as string) === req.userId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const success = await storage.followUser(
      req.userId!,
      req.params.id as string,
    );
    res.json({ success, isFollowing: success });

    // Fire-and-forget push notification for new follower
    if (success) {
      try {
        const follower = await storage.getUser(req.userId!);
        const followerUsername = follower?.username || "";
        const followedUserId = req.params.id as string;
        if (followerUsername) {
          const { notifyNewFollower } =
            await import("../services/pushNotify.js");
          notifyNewFollower(followedUserId, followerUsername).catch(() => {});
        }
      } catch (_e) {
        /* non-critical */
      }
    }
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Unfollow user
router.delete(
  "/users/:id/follow",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const success = await storage.unfollowUser(
        req.userId!,
        req.params.id as string,
      );
      res.json({ success, isFollowing: false });
    } catch (error) {
      console.error("Unfollow error:", error);
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  },
);

// Get followers
router.get("/users/:id/followers", async (req: Request, res: Response) => {
  try {
    const followers = await storage.getFollowers(req.params.id as string);
    res.json({ followers });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ error: "Failed to get followers" });
  }
});

// Get following
router.get("/users/:id/following", async (req: Request, res: Response) => {
  try {
    const following = await storage.getFollowing(req.params.id as string);
    res.json({ following });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ error: "Failed to get following" });
  }
});

// ============ AVATAR UPLOAD ROUTE ============
// POST /api/users/me/avatar — upload avatar image to Supabase Storage via service key
router.post(
  "/users/me/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      if (!supabaseAdmin) {
        return res.status(503).json({ error: "Storage not configured" });
      }

      const userId = req.userId!;
      const ext = req.file.mimetype.includes("png") ? "png" : "jpg";
      const filePath = `avatars/${userId}.${ext}`;

      // Upload to Supabase Storage avatars bucket using service role key (bypasses RLS)
      const { error: uploadError } = await supabaseAdmin.storage
        .from("avatars")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("[Avatar Upload] Supabase Storage error:", uploadError);
        return res.status(500).json({ error: "Failed to upload avatar" });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update user profile with new avatar URL
      const updated = await storage.updateUser(userId, { avatarUrl });

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ avatarUrl, user: updated });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  },
);

/**
 * GET /api/users/me/saved
 * Get current user's saved/bookmarked posts
 */
router.get("/me/saved", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // saved_posts table: user_id, publication_id, created_at
  // If table doesn't exist, return empty gracefully
  const { data, error } = await supabase
    .from("saved_posts")
    .select(
      `
      id,
      created_at,
      publication:publication_id (
        id, caption, media_url, thumbnail_url, type, mux_playback_id,
        reactions_count, comments_count,
        user:user_id (id, username, display_name, avatar_url)
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error && error.code === "42P01") {
    // Table doesn't exist yet — return empty
    return res.json({ saved: [] });
  }
  if (error) return res.status(500).json({ error: error.message });

  const saved = (data || []).map((row: any) => ({
    id: row.id,
    savedAt: row.created_at,
    post: row.publication,
  }));

  res.json({ saved });
});

/**
 * POST /api/users/me/saved/:postId
 * Bookmark a post
 */
router.post("/me/saved/:postId", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { postId } = req.params;
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from("saved_posts")
    .upsert(
      { user_id: userId, publication_id: postId },
      { onConflict: "user_id,publication_id" },
    );

  if (error && error.code === "42P01") {
    return res.status(503).json({ error: "saved_posts table not yet created" });
  }
  if (error) return res.status(500).json({ error: error.message });
  res.json({ saved: true });
});

/**
 * DELETE /api/users/me/saved/:postId
 * Remove a bookmark
 */
router.delete("/me/saved/:postId", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { postId } = req.params;
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from("saved_posts")
    .delete()
    .eq("user_id", userId)
    .eq("publication_id", postId);

  if (error && error.code === "42P01") {
    return res.json({ saved: false }); // Table doesn't exist, treat as success
  }
  if (error) return res.status(500).json({ error: error.message });
  res.json({ saved: false });
});

export default router;
