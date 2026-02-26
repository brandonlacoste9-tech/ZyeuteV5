/**
 * Debug feed endpoint
 */

import { Router } from "express";
import { storage } from "../storage.js";

const router = Router();

/**
 * GET /api/debug/feed - Check feed data
 */
router.get("/feed", async (req, res) => {
  try {
    // Raw query to see what's happening
    const pool = storage.getRawDb();

    // Check posts
    const postsResult = await pool.query(`
      SELECT COUNT(*) as total,
        COUNT(CASE WHEN visibility = 'public' AND est_masque = false AND deleted_at IS NULL THEN 1 END) as visible
      FROM publications
    `);

    // Check users
    const usersResult = await pool.query(`
      SELECT COUNT(*) as count FROM user_profiles
    `);

    // Try the actual feed query without user join
    const postsOnly = await pool.query(`
      SELECT id, caption, media_url, user_id, created_at
      FROM publications
      WHERE visibility = 'public' AND est_masque = false AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 3
    `);

    // Try with user join
    let withUser = null;
    let joinError = null;
    try {
      withUser = await pool.query(`
        SELECT p.id, p.caption, p.media_url, p.user_id, u.username, u.display_name
        FROM publications p
        LEFT JOIN user_profiles u ON p.user_id = u.id
        WHERE p.visibility = 'public' AND p.est_masque = false AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        LIMIT 3
      `);
    } catch (e: any) {
      joinError = e.message;
    }

    res.json({
      stats: postsResult.rows[0],
      users: usersResult.rows[0],
      postsOnly: postsOnly.rows,
      withUser: withUser?.rows || null,
      joinError,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
