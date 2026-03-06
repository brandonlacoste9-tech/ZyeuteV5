import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// Try us-east-1 host from docs
const databaseUrl =
  "postgresql://postgres.vuanulvyqkfefmjcikfk:HOEqEZsZeycL9PRE@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function test() {
  console.log("Connecting to:", databaseUrl.split("@")[1]);
  try {
    const start = Date.now();
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Success!", res.rows[0]);
    console.log(`Time: ${Date.now() - start}ms`);
  } catch (err: any) {
    console.error("❌ Failed!");
    console.error(err.message);
    console.error(err.code);
  } finally {
    await pool.end();
  }
}

test();
