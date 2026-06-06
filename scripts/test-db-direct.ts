import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  let directUrl = process.env.DATABASE_URL || "";
  if (directUrl.includes(":6543")) {
    directUrl = directUrl.replace(":6543", ":5432");
  }
  if (!directUrl) {
    console.error("DATABASE_URL is not set. Please set it in .env or .env.local.");
    process.exit(1);
  }
  console.log("Testing direct connection...");

  const pool = new pg.Pool({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected Direct");
    
    const res = await client.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
    console.log("Tables:", res.rows.map(r => r.tablename).join(", "));
    
    const userCount = await client.query('SELECT count(*) FROM user_profiles');
    console.log("User count:", userCount.rows[0].count);

    client.release();
  } catch (err: any) {
    console.error("❌ Direct Connection failed:", err.message);
  } finally {
    await pool.end();
  }
}

main();
