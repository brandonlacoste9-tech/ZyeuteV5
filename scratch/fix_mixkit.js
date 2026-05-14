import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

const { Pool } = pg;

async function fix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected");
    
    const w3schools = "https://www.w3schools.com/html/mov_bbb.mp4";
    
    const res = await client.query(
      `UPDATE publications 
       SET media_url = $1, 
           original_url = $1,
           hls_url = NULL,
           mux_playback_id = NULL,
           mux_asset_id = NULL
       WHERE media_url LIKE '%mixkit.co%'`,
       [w3schools]
    );
    
    console.log(`✅ Fixed ${res.rowCount} videos that had dead Mixkit URLs.`);
    
    client.release();
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

fix();
