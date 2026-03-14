import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function test(port: number, user: string, host: string) {
  console.log(`\n--- Testing ${host}:${port} as ${user} ---`);
  const PASS = "HOEqEZsZeycL9PRE";
  const DB = "postgres";
  
  const connectionString = `postgresql://${user}:${PASS}@${host}:${port}/${DB}?sslmode=require`;
  
  const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    const client = await pool.connect();
    console.log(`✅ Success on port ${port}!`);
    const res = await client.query('SELECT now()');
    console.log("Time:", res.rows[0].now);
    client.release();
    return true;
  } catch (err: any) {
    console.error(`❌ Failed:`, err.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const host = "aws-0-us-east-1.pooler.supabase.com";
  const ref = "vuanulvyqkfefmjcikfk";

  // Test 1: Transaction mode (Port 6543) with postgres.REF
  await test(6543, `postgres.${ref}`, host);
  
  // Test 2: Session mode (Port 5432) with postgres.REF
  await test(5432, `postgres.${ref}`, host);
  
  // Test 3: Session mode (Port 5432) with just postgres
  await test(5432, "postgres", host);
  
  // Test 4: Transaction mode (Port 6543) with just postgres
  await test(6543, "postgres", host);
}

main();
