import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// Try direct connection instead of pooler
const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;
if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not defined in .env");
  process.exit(1);
}

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
