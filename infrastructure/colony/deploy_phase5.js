#!/usr/bin/env node
/**
 * Deploy Phase 5 Migration Script
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import { config } from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env
config({ path: join(__dirname, '../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
}

async function runMigration() {
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        console.log('🔗 Connecting to Supabase...');
        await client.connect();

        const migrationPath = join(__dirname, '../../migrations/PHASE_5_DROP_SESSIONS.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('📄 Executing migration: PHASE_5_DROP_SESSIONS.sql');
        await client.query(sql);

        console.log('✅ Session tables dropped successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
