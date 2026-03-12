import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.join(process.cwd(), ".env");
dotenv.config({ path: envPath });

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  console.log(
    "Direct test with string:",
    connectionString?.substring(0, 30) + "...",
  );

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log("✅ DIRECT CONNECTION SUCCESS!");
    const res = await client.query("SELECT current_database()");
    console.log("Connected to:", res.rows[0].current_database);
    client.release();
  } catch (err: any) {
    console.error("❌ DIRECT CONNECTION FAILED:", err.message);
    console.error("Stack:", err.stack);
  } finally {
    process.exit();
  }
}

testConnection();
