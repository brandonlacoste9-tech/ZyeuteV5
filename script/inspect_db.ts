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
        console.log("🔍 Checking user_profiles columns...");
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles';
    `);

        res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
