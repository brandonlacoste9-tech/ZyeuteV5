import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const DB_PASSWORD = "HOEqEZsZeycL9PRE";
  const DB_REF = "vuanulvyqkfefmjcikfk";
  // The IPv6 address we got from nslookup
  const IPV6 = "2600:1f18:2e13:9d3a:b631:d6ce:392f:2ac0";
  
  const connectionString = `postgresql://postgres.${DB_REF}:${DB_PASSWORD}@[${IPV6}]:6543/postgres`;
  
  console.log("Testing connection to IPv6 address:", IPV6);

  const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ SUCCESS with IPv6!");
    
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
