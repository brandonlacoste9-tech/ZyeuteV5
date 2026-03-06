import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function test() {
  console.log("Connecting to:", process.env.DATABASE_URL?.split("@")[1]);
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
