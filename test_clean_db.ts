import pg from "pg";
import dotenv from "dotenv";
import path from "path";

const envPath = path.join(process.cwd(), ".env");
dotenv.config({ path: envPath });

// CLEAR POTENTIAL CONFLICTING ENV VARS
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGDATABASE;

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  console.log(
    "Test after clearing PG vars. URL starts with:",
    connectionString?.substring(0, 30),
  );

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log("✅ CLEAN CONNECTION SUCCESS!");
    client.release();
  } catch (err: any) {
    console.error("❌ CLEAN CONNECTION FAILED:", err.message);
  } finally {
    process.exit();
  }
}

testConnection();
