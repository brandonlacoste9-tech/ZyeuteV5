/**
 * Test the Hive Pipeline
 * Verifies that the Orchestrator correctly routes tasks to bees
 */

import dotenv from 'dotenv';
import path from 'path';

// Load env vars for real API calls
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { orchestrator } from '../server/ai/cores/orchestrator-core';
import type { HiveTask } from '../server/ai/types';
import crypto from 'crypto';

async function testPipeline() {
    console.log('🐝 Testing Hive Pipeline...\n');

    const tests = [
        { type: 'chat', payload: { message: 'Salut Ti-Guy!' } },
        { type: 'generate_caption', payload: { context: 'Quebec sunset' } },
        { type: 'generate_image', payload: { prompt: 'A maple leaf in autumn' } },
        { type: 'generate_video', payload: { prompt: 'Drone shot of Montreal' } },
        { type: 'compose_post', payload: { prompt: 'Morning coffee vibes' } },
        { type: 'moderate', payload: { content: 'Hello world' } },
        { type: 'check_budget', payload: { cost: 0.10 } },
        { type: 'analytics_summary', payload: { period: 'today' } },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const task: HiveTask = {
            id: crypto.randomUUID(),
            type: test.type,
            payload: test.payload,
            createdAt: new Date(),
        };

        try {
            const result = await orchestrator.handleHiveTask(task);

            if (result.success) {
                console.log(`✅ ${test.type}: PASSED`);
                console.log(`   Bee: ${result.metadata?.beeId}`);
                passed++;
            } else {
                console.log(`❌ ${test.type}: FAILED - ${result.error}`);
                failed++;
            }
        } catch (err: any) {
            console.log(`❌ ${test.type}: ERROR - ${err.message}`);
            failed++;
        }
    }

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    console.log(passed === tests.length ? '🎉 All tests passed!' : '⚠️ Some tests failed');
}

testPipeline().catch(console.error);
