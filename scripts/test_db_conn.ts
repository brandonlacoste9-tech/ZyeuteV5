import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Connecting to:", process.env.DATABASE_URL?.split("@")[1]);
    const res = await pool.query("SELECT NOW()");
    console.log("Success:", res.rows[0]);
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
