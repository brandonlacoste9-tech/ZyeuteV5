import { Router, Request, Response } from "express";
import { storage } from "../storage.js";
import { sql } from "drizzle-orm";

const router = Router();

// Search users and posts
router.get("/", async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: "Query required" });

    // Assuming we use drizzle directly to fetch matching results
    // since searchUsers and searchPosts are not in DatabaseStorage interface
    const searchPattern = `%${query}%`;

    // Fallback simple search using available storage methods or direct execute
    // This provides equivalent structure to missing methods
    const [usersResult, postsResult] = await Promise.all([
      storage.getRawDb().execute(sql`
        SELECT id, username, display_name as "displayName", avatar_url as "avatarUrl" 
        FROM user_profiles 
        WHERE username ILIKE ${searchPattern} OR display_name ILIKE ${searchPattern} 
        LIMIT 10
      `),
      storage.getRawDb().execute(sql`
        SELECT id, media_url as "mediaUrl", thumbnail_url as "thumbnailUrl", caption, type 
        FROM publications 
        WHERE caption ILIKE ${searchPattern} OR content ILIKE ${searchPattern} 
        LIMIT 10
      `),
    ]);

    // Handle return row difference depending on the dialect result object
    const users = usersResult.rows || usersResult;
    const posts = postsResult.rows || postsResult;

    res.json({ users, posts });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

export default router;
