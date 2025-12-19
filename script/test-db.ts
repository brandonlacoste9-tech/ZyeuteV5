
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log("Testing connection...");
  const connectionString = "postgres://postgres:tvjgdx3qhidTdMU7@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  console.log("Testing IPv6 Pooler...");

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Time:", res.rows[0].now);
    client.release();
  } catch (err: any) {
    console.error("Connection failed:", err.message);
    console.error("Code:", err.code);
  } finally {
    await pool.end();
  }
}

testConnection();
