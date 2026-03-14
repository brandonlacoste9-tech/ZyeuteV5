import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function main() {
  console.log("Testing DB connection...");
  
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected");
    
    const res = await client.query('SELECT count(*) FROM "user_profiles"');
    console.log("User count:", res.rows[0].count);
    
    const users = await client.query('SELECT id, username FROM "user_profiles" LIMIT 5');
    console.log("Some users:");
    users.rows.forEach(u => console.log(` - ${u.username} (${u.id})`));
    
    client.release();
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
