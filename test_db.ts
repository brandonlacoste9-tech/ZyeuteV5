import { getPool } from "./backend/storage";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.join(process.cwd(), ".env");
console.log("Attempting to load .env from:", envPath);

if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error("❌ Dotenv error:", result.error);
  } else {
    console.log("✅ Dotenv loaded successfully");
    console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
    // Be careful NOT to log the full secret, just first few chars
    if (process.env.DATABASE_URL) {
      console.log(
        "DATABASE_URL starts with:",
        process.env.DATABASE_URL.substring(0, 20),
      );
    }
  }
} else {
  console.warn("⚠️ No .env file found at:", envPath);
}

async function testConnection() {
  console.log("Testing database connection...");
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL is missing from environment");
    }

    const pool = getPool();
    console.log(
      "Pool initialized with connection string length:",
      dbUrl.length,
    );

    const client = await pool.connect();
    console.log("Successfully connected to the database!");

    const res = await client.query("SELECT COUNT(*) FROM users");
    console.log(`Found ${res.rows[0].count} users in the database.`);

    client.release();
  } catch (err: any) {
    console.error("Database connection failed:", err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    process.exit();
  }
}

testConnection();
