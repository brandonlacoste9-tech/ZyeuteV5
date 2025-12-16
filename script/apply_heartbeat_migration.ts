import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const { Pool } = pg;

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is missing!');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Applying Consolidated Migrations (0005 + 0006)...');

        // 0005: Add hardened columns
        await pool.query(`
      ALTER TABLE colony_tasks 
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
    `);
        console.log('✅ Added started_at');

        await pool.query(`
      ALTER TABLE colony_tasks 
      ADD COLUMN IF NOT EXISTS worker_id TEXT;
    `);
        console.log('✅ Added worker_id');

        await pool.query(`
      ALTER TABLE colony_tasks 
      ADD COLUMN IF NOT EXISTS fal_request_id TEXT;
    `);
        console.log('✅ Added fal_request_id');

        // 0006: Heartbeat
        await pool.query(`
      ALTER TABLE colony_tasks 
      ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE;
    `);
        console.log('✅ Added last_heartbeat');

        // Backfill
        await pool.query(`
      UPDATE colony_tasks 
      SET last_heartbeat = started_at 
      WHERE status = 'processing' AND last_heartbeat IS NULL;
    `);
        console.log('✅ Backfilled last_heartbeat');

        // Indexes
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_colony_tasks_status ON colony_tasks(status);
    `);
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_colony_tasks_async ON colony_tasks(status) WHERE status = 'async_waiting';
    `);
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_colony_tasks_stuck ON colony_tasks(status, last_heartbeat) WHERE status = 'processing';
    `);
        console.log('✅ Indexes created');

        console.log('✨ All migrations applied successfully!');

    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
