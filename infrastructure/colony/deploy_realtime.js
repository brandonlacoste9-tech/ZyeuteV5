#!/usr/bin/env node
/**
 * Deploy Realtime Migration Script
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

        const migrationPath = join(__dirname, '../../migrations/0004_enable_realtime.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('📄 Executing migration: 0004_enable_realtime.sql');
        await client.query(sql);

        console.log('✅ Realtime enabled for colony_tasks!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
