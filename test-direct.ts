import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

async function test(url, name) {
  console.log(`Testing ${name}...`);
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log(`${name}: Connected successfully!`);
    client.release();
  } catch (err) {
    console.log(`${name}: Failed - ${err.message}`);
  } finally {
    await pool.end();
  }
}

async function run() {
  const password = process.env.DATABASE_URL.match(/:([^@]+)@/)?.[1];
  const ref = "vuanulvyqkfefmjcikfk";

  // 1. Direct host, user 'postgres'
  const directUrl = `postgres://postgres:${password}@db.${ref}.supabase.co:5432/postgres`;
  await test(directUrl, "Direct Host (5432)");

  // 2. Direct host, user 'postgres.ref' (sometimes required even on 5432 for some reason)
  const directUrl2 = `postgres://postgres.${ref}:${password}@db.${ref}.supabase.co:5432/postgres`;
  await test(directUrl2, "Direct Host with postgres.ref (5432)");
}

run();
