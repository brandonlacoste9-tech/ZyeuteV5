import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { supabaseAdmin } from "../supabase-auth.js";

// Import existing auth middlewares based on how they're handled in routes.ts
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Pass through, token extracted asynchronously if needed
  next();
};

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

    let user = await storage.getUser(req.userId);

    // Auto-provision: If Supabase user exists but no DB row, create one
    if (!user) {
      try {
        // Get user metadata from Supabase auth token (already validated)
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

        if (!username) {
          username = `user_${req.userId.slice(0, 8)}`;
        }

        // Ensure username is unique by appending random suffix if needed
        const existingByUsername = await storage.getUserByUsername(username);
        if (existingByUsername) {
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

    // Exclude sensitive fields from response (taxId, internal permissions)
    const { taxId, customPermissions, ...safeUser } = user;
    res.json({ user: safeUser });
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
      let user;

      // Allow lookup by UUID if the identifier looks like one
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(identifier)) {
        user = await storage.getUser(identifier);
      }

      if (!user) {
        user = await storage.getUserByUsername(identifier);
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

          const existingByUsername = await storage.getUserByUsername(username);
          if (existingByUsername) {
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

      res.json({ user: { ...safeUser, isFollowing } });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  },
);

// Get current user profile (alias for /api/auth/me)
router.get("/users/me", optionalAuth, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.json({ user: null });
    }
    const user = await storage.getUser(req.userId);
    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Update current user profile
router.patch("/users/me", requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate input with Zod schema
    const updateUserSchema = z.object({
      displayName: z.string().min(1).max(100).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().max(2048).optional(),
      region: z
        .enum([
          "montreal",
          "quebec",
          "gatineau",
          "sherbrooke",
          "trois-rivieres",
          "saguenay",
          "levis",
          "terrebonne",
          "laval",
          "gaspesie",
          "other",
        ])
        .optional(),
      tiGuyCommentsEnabled: z.boolean().optional(),
    });

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const updated = await storage.updateUser(req.userId!, parsed.data);

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

export default router;
