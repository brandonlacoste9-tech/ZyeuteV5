/**
 * One-off script to test DB connection. Do NOT commit real passwords.
 * Usage: TEST_DB_PASSWORD=yourpassword node test-passwords.js
 * Or use DATABASE_URL from .env (e.g. with dotenv).
 */

const pg = require("pg");
const { Pool } = pg;

const ref = "vuanulvyqkfefmjcikfk";
const host = "aws-0-us-east-1.pooler.supabase.com";
const password = process.env.TEST_DB_PASSWORD || process.env.DATABASE_URL?.match(/:([^@]+)@/)?.[1];

if (!password) {
  console.error("Set TEST_DB_PASSWORD or DATABASE_URL (with password) in the environment.");
  process.exit(1);
}

async function test() {
  const url = `postgres://postgres.${ref}:${password}@${host}:6543/postgres?pgbouncer=true`;
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    const client = await pool.connect();
    console.log("✅ SUCCESS");
    client.release();
  } catch (err) {
    console.error("❌ FAILED:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

test();
