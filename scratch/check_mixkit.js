import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

const { Pool } = pg;

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    const res = await client.query(
      `SELECT id, media_url, original_url FROM publications WHERE media_url ILIKE '%mixkit%' LIMIT 10`
    );
    
    console.log(`Found ${res.rowCount} videos with Mixkit URLs:`);
    res.rows.forEach(r => console.log(r.id, r.media_url));
    
    client.release();
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

check();
