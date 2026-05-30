import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function main() {
  // Purge any environment variables that might conflict
  delete process.env.PGHOST;
  delete process.env.PGPORT;
  delete process.env.PGUSER;
  delete process.env.PGPASSWORD;
  delete process.env.PGDATABASE;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  console.log("Using URL:", process.env.DATABASE_URL?.substring(0, 30) + "...");

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected");
    
    // Check columns
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
    `);
    
    console.log("Columns in user_profiles:");
    res.rows.forEach(row => console.log(` - ${row.column_name} (${row.data_type})`));
    
    client.release();
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
