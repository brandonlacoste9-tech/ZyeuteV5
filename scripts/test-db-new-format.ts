import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const DB_PASSWORD = "HOEqEZsZeycL9PRE";
  const DB_REF = "vuanulvyqkfefmjcikfk";
  
  // Try NEW pooler format
  const connectionString = `postgresql://postgres.${DB_REF}:${DB_PASSWORD}@db.${DB_REF}.supabase.co:6543/postgres`;
  
  console.log("Testing NEW pooler format at:", `db.${DB_REF}.supabase.co:6543`);

  const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ SUCCESS with NEW pooler format!");
    
    const res = await client.query('SELECT now()');
    console.log("Time from DB:", res.rows[0].now);
    
    client.release();
  } catch (err: any) {
    console.error("❌ FAILED:", err.message);
  } finally {
    await pool.end();
  }
}

main();
