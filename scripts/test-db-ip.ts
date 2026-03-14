import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  // Use the IP address we found from nslookup for the pooler
  const POOLER_IP = "52.45.94.125"; 
  const PORT = 6543;
  const USER = "postgres.vuanulvyqkfefmjcikfk";
  const PASS = "HOEqEZsZeycL9PRE";
  const DB = "postgres";

  const connectionString = `postgresql://${USER}:${PASS}@${POOLER_IP}:${PORT}/${DB}?sslmode=require`;
  
  console.log("Testing connection to IP:", POOLER_IP);

  const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected via IP!");
    
    const res = await client.query('SELECT now()');
    console.log("Time from DB:", res.rows[0].now);
    
    client.release();
  } catch (err: any) {
    console.error("❌ IP Connection Error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
