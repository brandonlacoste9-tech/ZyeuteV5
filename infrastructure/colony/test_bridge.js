#!/usr/bin/env node
/**
 * Test Colony Bridge
 * Inserts a task into Supabase and watches for the poller to pick it up
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '.env.colony') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBridge() {
    console.log('🧪 Testing Colony Bridge...\n');

    // 1. Insert a task
    console.log('📤 Inserting test task...');
    const { data: task, error: insertError } = await supabase
        .from('colony_tasks')
        .insert({
            command: 'System Integrity Check',
            origin: 'Bridge Test',
            priority: 'high',
            status: 'pending',
            metadata: {
                target_bee: 'guardian',
                swarm_mode: true,
                test: true
            }
        })
        .select()
        .single();

    if (insertError) {
        console.error('❌ Insert failed:', insertError.message);
        process.exit(1);
    }

    console.log(`✅ Task created: ${task.id}`);
    console.log(`   Command: ${task.command}`);
    console.log(`   Status: ${task.status}`);

    // 2. Subscribe to updates
    console.log('\n⏳ Waiting for Task Poller to pick it up (watching for 15s)...\n');

    const timeout = setTimeout(() => {
        console.log('⏰ Timeout - Check if Task Poller is running!');
        process.exit(1);
    }, 15000);

    const channel = supabase
        .channel(`task-${task.id}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'colony_tasks',
                filter: `id=eq.${task.id}`
            },
            (payload) => {
                console.log(`📥 Task Update: ${payload.old.status} → ${payload.new.status}`);

                if (payload.new.status === 'completed') {
                    clearTimeout(timeout);
                    console.log('\n🎉 SUCCESS! The Colony Bridge is WORKING!');
                    console.log('   Result:', JSON.stringify(payload.new.result, null, 2));
                    process.exit(0);
                }
            }
        )
        .subscribe();
}

testBridge();
