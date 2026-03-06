import pg from "pg";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config();

const { Pool } = pg;

async function test() {
  const connectionString =
    "postgresql://postgres.vuanulvyqkfefmjcikfk:HOEqEZsZeycL9PRE@aws-0-ca-central-1.pooler.supabase.com:5432/postgres";
  console.log(
    "Testing session pooler connection to:",
    connectionString.replace(/:[^:]*@/, ":****@"),
  );
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Connecting...");
    const client = await pool.connect();
    console.log("✅ Connected successfully!");
    const res = await client.query("SELECT now()");
    console.log("Time from DB:", res.rows[0]);
    client.release();
  } catch (err) {
    console.error("❌ Connection failed:", err);
  } finally {
    await pool.end();
  }
}

test();
