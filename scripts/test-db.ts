import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

const { Pool } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.DB_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL is not defined in .env");
    return;
  }
  console.log(
    "Testing session pooler connection to:",
    connectionString.replace(/:[^:]*@/, ":****@"),
  );
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected");
    
    const res = await client.query('SELECT count(*) FROM "user_profiles"');
    console.log("User count:", res.rows[0].count);
    
    const users = await client.query('SELECT id, username FROM "user_profiles" LIMIT 5');
    console.log("Some users:");
    users.rows.forEach((u: { username: string; id: string }) => console.log(` - ${u.username} (${u.id})`));
    
    client.release();
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
