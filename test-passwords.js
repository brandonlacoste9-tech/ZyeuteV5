
const pg = require('pg');
const { Pool } = pg;

const passwords = [
  'tvjgdx3qhntdTMU7',
  'tvjgdx3qhidTdMU7'
];

const ref = 'vuanulvyqkfefmjcikfk';
const host = 'aws-0-us-east-1.pooler.supabase.com';

async function test() {
  for (const pwd of passwords) {
    console.log(`Testing password: ${pwd}`);
    const url = `postgres://postgres.${ref}:${pwd}@${host}:6543/postgres?pgbouncer=true`;
    const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      const client = await pool.connect();
      console.log(`✅ SUCCESS with ${pwd}`);
      client.release();
      break;
    } catch (err) {
      console.log(`❌ FAILED with ${pwd}: ${err.message}`);
    } finally {
      await pool.end();
    }
  }
}

test();
