import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const host = "aws-0-us-east-1.pooler.supabase.com";
  const PASS = "HOEqEZsZeycL9PRE";
  const REF = "vuanulvyqkfefmjcikfk";
  
  // Try with options=project=REF
  const connectionString = `postgresql://postgres:${PASS}@${host}:6543/postgres?sslmode=require&options=project%3D${REF}`;
  
  console.log("Testing connection with options=project parameter...");

  const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ SUCCESS with options=project!");
    
    const res = await client.query('SELECT now()');
    console.log("Time from DB:", res.rows[0].now);
    
    client.release();
  } catch (err: any) {
    console.error("❌ FAILED:", err.message);
  } finally {
    await pool.end();
  }
}

main();
