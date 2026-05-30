import { config } from "dotenv";
import { join } from "path";
import pg from "pg";

config({ path: join(process.cwd(), ".env") });

async function test(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  console.log(`\n--- Testing ${host} ---`);
  
  const DB_PASSWORD = "HOEqEZsZeycL9PRE";
  const DB_REF = "vuanulvyqkfefmjcikfk";
  
  const connectionString = `postgresql://postgres.${DB_REF}:${DB_PASSWORD}@${host}:6543/postgres?sslmode=require`;
  
  const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    const client = await pool.connect();
    console.log(`✅ SUCCESS in ${region}!`);
    const res = await client.query('SELECT now()');
    console.log("Time:", res.rows[0].now);
    client.release();
    return true;
  } catch (err: any) {
    console.error(`❌ Failed in ${region}:`, err.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  
  // Test common regions
  const regions = ["us-east-1", "ca-central-1", "us-west-1", "eu-central-1"];
  
  for (const region of regions) {
    if (await test(region)) break;
  }
}

main();
