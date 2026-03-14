import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const host = "aws-0-us-east-1.pooler.supabase.com";
  const PASS = "HOEqEZsZeycL9PRE";
  const REF = "vuanulvyqkfefmjcikfk";
  
  // Try with DB name as postgres.REF
  const connectionString = `postgresql://postgres:${PASS}@${host}:6543/postgres.${REF}?sslmode=require`;
  
  console.log("Testing connection with DB Name as postgres.REF...");

  const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ SUCCESS!");
    client.release();
  } catch (err: any) {
    console.error("❌ FAILED:", err.message);
  } finally {
    await pool.end();
  }
}

main();
