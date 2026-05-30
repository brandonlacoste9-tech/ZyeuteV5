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
        console.log("🔧 Fixing user_profiles schema...");

        // 1. Create Region Enum if not exists
        // Postgres doesn't support "CREATE TYPE IF NOT EXISTS" cleanly in older versions, 
        // but we can catch error or check pg_type.
        try {
            await pool.query(`
            CREATE TYPE region AS ENUM (
                'montreal', 'quebec', 'gatineau', 'sherbrooke', 'trois-rivieres',
                'saguenay', 'levis', 'terrebonne', 'laval', 'gaspesie', 'other'
            );
        `);
            console.log("✅ Created 'region' type");
        } catch (e: any) {
            if (e.code === '42710') { // duplicate_object
                console.log("ℹ️ 'region' type already exists");
            } else {
                console.error("⚠️ Error creating type:", e.message);
            }
        }

        // 2. Add region column
        await pool.query(`
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS region region;
    `);
        console.log("✅ Added region column");

        // 3. Add is_admin column
        await pool.query(`
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
    `);
        console.log("✅ Added is_admin column");

    } catch (err) {
        console.error("❌ Schema Fix Failed:", err);
    } finally {
        pool.end();
    }
}
run();
