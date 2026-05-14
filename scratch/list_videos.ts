
import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function listVideos() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const result = await pool.query("SELECT id, media_url, caption, type, processing_status, hive_id FROM publications WHERE type = 'video' ORDER BY created_at DESC LIMIT 10");
    console.log("Recent videos:");
    result.rows.forEach(row => {
      console.log(` - [${row.id}] ${row.media_url?.substring(0, 50)}... (${row.processing_status}) Hive: ${row.hive_id}`);
    });
  } catch (error) {
    console.error("Error listing videos:", error);
  } finally {
    await pool.end();
  }
}

listVideos();
