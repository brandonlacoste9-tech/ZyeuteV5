import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// Try direct connection instead of pooler
const databaseUrl =
  "postgresql://postgres.vuanulvyqkfefmjcikfk:HOEqEZsZeycL9PRE@db.vuanulvyqkfefmjcikfk.supabase.co:5432/postgres";

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
