
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const { Pool } = pg;

// Use SSL false for Supabase transaction pooler if needed, or proper SSL config
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add SSL support for Supabase
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined
});

async function run() {
    try {
        console.log("🔍 Inspecting latest colony_tasks...");

        const res = await pool.query(`
            SELECT id, command, origin, status, worker_id, created_at, started_at, completed_at, error, result
            FROM colony_tasks 
            ORDER BY created_at DESC 
            LIMIT 5;
        `);

        if (res.rows.length === 0) {
            console.log("No tasks found.");
        } else {
            res.rows.forEach(task => {
                console.log("---------------------------------------------------");
                console.log(`ID:        ${task.id}`);
                console.log(`Command:   ${task.command}`);
                console.log(`Origin:    ${task.origin}`);
                console.log(`Status:    ${task.status}`);
                console.log(`Worker:    ${task.worker_id || '(none)'}`);
                console.log(`Created:   ${task.created_at}`);
                console.log(`Started:   ${task.started_at || '-'}`);
                console.log(`Completed: ${task.completed_at || '-'}`);
                if (task.error) console.log(`Error:     ${task.error}`);
                if (task.result) console.log(`Result:    ${JSON.stringify(task.result).substring(0, 100)}...`);
            });
            console.log("---------------------------------------------------");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}
run();
