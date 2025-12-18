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
        const tables = ['user_profiles', 'publications', 'posts', 'stories'];
        for (const table of tables) {
            console.log(`\n🔍 Checking ${table} columns...`);
            const res = await pool.query(`
              SELECT column_name, data_type 
              FROM information_schema.columns 
              WHERE table_name = $1;
            `, [table]);

            if (res.rows.length === 0) {
                console.log(` ❌ Table ${table} not found.`);
            } else {
                res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
