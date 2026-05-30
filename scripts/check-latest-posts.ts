import { getPool } from "../backend/storage.js";

async function checkPosts() {
  const pool = getPool();
  try {
    const res = await pool.query(
      'SELECT id, media_url, "mediaUrl", playback_id, content FROM posts ORDER BY created_at DESC LIMIT 10',
    );
    console.log("Latest 10 posts:");
    console.table(res.rows);
  } catch (err) {
    console.error("Error checking posts:", err);
  } finally {
    await pool.end();
  }
}

checkPosts();
