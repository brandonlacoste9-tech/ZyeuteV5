
const { Pool } = require('pg');
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const { rows } = await pool.query('SELECT count(*) FROM publications');
    console.log(`Total publications: ${rows[0].count}`);
    
    if (rows[0].count > 0) {
        const { rows: latest } = await pool.query('SELECT caption, media_url, created_at FROM publications ORDER BY created_at DESC LIMIT 5');
        console.log('Latest 5 publications:');
        latest.forEach(r => console.log(`- ${r.caption} (${r.created_at})`));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

check();
