import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  // Manual direct connection string
  // Format: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
  const DB_PASSWORD = "HOEqEZsZeycL9PRE";
  const DB_REF = "vuanulvyqkfefmjcikfk";
  
  // Try direct connection first
  const connectionString = `postgresql://postgres:${DB_PASSWORD}@db.${DB_REF}.supabase.co:5432/postgres`;
  
  console.log("Testing direct connection to:", `db.${DB_REF}.supabase.co`);

  const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected DIRECTLY!");
    
    const res = await client.query('SELECT now()');
    console.log("Time from DB:", res.rows[0].now);
    
    client.release();
  } catch (err: any) {
    console.error("❌ Direct Connection Error:", err.message);
    
    console.log("\nTrying Pooler connection with different username format...");
    // Try pooler with just 'postgres' if project ref is in hostname? 
    // Usually pooler hostname starts with 'aws-0-...' as seen in the .env
    const poolerUrl = process.env.DATABASE_URL;
    console.log("Pooler URL from env:", poolerUrl);
  } finally {
    await pool.end();
  }
}

main();
