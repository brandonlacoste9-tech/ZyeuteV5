
const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = pg;

async function run() {
  const url = process.env.DATABASE_URL;
  console.log('Testing...');
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('SUCCESS');
    client.release();
  } catch (err) {
    console.log('FAILURE: ' + err.message);
  }
  await pool.end();
}

run();
