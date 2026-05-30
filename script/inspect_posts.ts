import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("🔍 Checking 'posts' columns...");
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'posts';
    `);
        if (res.rows.length === 0) console.log("⚠️ 'posts' table not found.");
        else res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

        console.log("\n🔍 Checking 'publications' columns...");
        const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'publications';
    `);
        if (res2.rows.length === 0) console.log("⚠️ 'publications' table not found.");
        else res2.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
