import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const dbUrl = process.env.DATABASE_URL;

async function checkConnection() {
  console.log("🔍 Testing Database Connection...");

  if (!dbUrl) {
    console.error("❌ DATABASE_URL is not defined in environment variables.");
    process.exit(1);
  }

  // Parse masked URL for logging
  try {
    const parsed = new URL(dbUrl);
    console.log(`📡 Attempting to connect to: ${parsed.host}`);
    console.log(`👤 User: ${parsed.username}`);
  } catch (e) {
    console.error("❌ Invalid URL format");
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    console.log(`✅ SUCCESS: Connected in ${Date.now() - start}ms`);

    // Check if we are using Supavisor (Port 6543)
    if (dbUrl.includes(":6543")) {
      console.log("ℹ️  Note: You are using the Supavisor Pooler (Port 6543).");
    } else if (dbUrl.includes(":5432")) {
      console.log("ℹ️  Note: You are using a direct connection (Port 5432).");
    }
  } catch (err: any) {
    console.error("\n❌ CONNECTION FAILED");
    console.error("-------------------");
    console.error(`Error Code: ${err.code || "N/A"}`);
    console.error(`Message: ${err.message}`);

    if (err.message.includes("Tenant or user not found")) {
      console.error("\n💡 ANALYSIS: This is a Supavisor error.");
      console.error(
        "1. Ensure your username follows the format: postgres.[YOUR_PROJECT_REF]",
      );
      console.error(
        "2. If using Port 6543, ensure 'Transaction Mode' is selected if you use a pooler.",
      );
      console.error(
        "3. TRY THIS: Use the 'Direct Connection' string from Supabase (usually Port 5432) instead.",
      );
    }
  } finally {
    await pool.end();
  }
}

checkConnection();
