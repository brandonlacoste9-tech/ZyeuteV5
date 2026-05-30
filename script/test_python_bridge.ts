import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import type { HiveTask } from '../server/ai/types';

// Load env vars BEFORE importing modules that use them
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testPythonBridge() {
    console.log('🐍 Testing Python Bridge...');

    // Dynamic import ensures storage.ts initializes AFTER env vars are loaded
    const { executePythonBee } = await import('../server/ai/python-bridge');

    const task: HiveTask = {
        id: crypto.randomUUID(),
        type: 'finance_report',
        payload: { period: 'Q4 2025' },
        createdAt: new Date(),
        priority: 10
    };

    try {
        const result = await executePythonBee('finance-bee', task);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

testPythonBridge().then(() => process.exit(0));
