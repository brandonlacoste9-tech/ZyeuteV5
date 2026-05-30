
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
        console.log("🔧 Creating 'stories' table...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS stories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
                media_url TEXT NOT NULL,
                media_type VARCHAR(20) NOT NULL, -- 'photo', 'video'
                caption TEXT,
                view_count INTEGER DEFAULT 0,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);

        // Also create index for expiry checks
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
        `);

        console.log("✅ Created stories table");
    } catch (err) {
        console.error("❌ Schema Fix Failed:", err);
    } finally {
        pool.end();
    }
}
run();
