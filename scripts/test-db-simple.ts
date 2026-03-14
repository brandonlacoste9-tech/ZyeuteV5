import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function main() {
  delete process.env.PGHOST;
  delete process.env.PGPORT;
  delete process.env.PGUSER;
  delete process.env.PGPASSWORD;
  delete process.env.PGDATABASE;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected");
    
    try {
        const res = await client.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = "public"');
        console.log("Tables (pg_tables):", res.rows.map(r => r.tablename));
    } catch (e: any) {
        console.log("Could not list tables:", e.message);
    }

    try {
        const res = await client.query('SELECT count(*) FROM user_profiles');
        console.log("User profiles count:", res.rows[0].count);
    } catch (e: any) {
        console.log("Could not count user_profiles:", e.message);
    }
    
    client.release();
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
