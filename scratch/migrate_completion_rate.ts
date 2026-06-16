import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const { Pool } = pg;
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("Running migration...");
  try {
    await pool.query(`ALTER TABLE video_views ADD COLUMN IF NOT EXISTS completion_rate real;`);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
