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
        console.log("🐝 Checking colony_tasks table...");

        // Check if table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'colony_tasks'
            );
        `);

        if (tableCheck.rows[0].exists) {
            console.log("✅ colony_tasks table exists!");

            // Get columns
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'colony_tasks'
                ORDER BY ordinal_position;
            `);

            console.log("\n📋 Columns:");
            cols.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`));

            // Count tasks
            const count = await pool.query(`SELECT COUNT(*) FROM colony_tasks;`);
            console.log(`\n📊 Total tasks: ${count.rows[0].count}`);

        } else {
            console.log("❌ colony_tasks table does NOT exist!");
            console.log("Run the migration: migrations/0003_create_colony_tasks.sql");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}
run();
