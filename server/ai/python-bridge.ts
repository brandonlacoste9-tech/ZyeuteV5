/**
 * AI Hive - Python Colony Bridge
 * Queues tasks to Python Colony bees via Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * Execute a Python Colony bee by queueing a task
 * 
 * @param beeId - The bee ID (e.g., 'finance-bee', 'guardian-bee')
 * @param payload - Task payload
 * @returns Task result once completed
 */
export async function executePythonBee(
    beeId: string,
    payload: Record<string, unknown>
): Promise<unknown> {
    console.log(`[Python Bridge] Queueing task for bee: ${beeId}`);

    // Insert task into colony_tasks table
    const { data, error } = await supabase
        .from('colony_tasks')
        .insert({
            type: beeId,
            payload,
            status: 'pending',
            created_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to queue Python bee: ${error.message}`);
    }

    // Poll for completion
    const taskId = data.id;
    const maxAttempts = 60; // 60 seconds max wait

    for (let i = 0; i < maxAttempts; i++) {
        const { data: task } = await supabase
            .from('colony_tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        if (task.status === 'completed') {
            console.log(`[Python Bridge] Task ${taskId} completed`);
            return task.result;
        }

        if (task.status === 'failed') {
            throw new Error(task.error || 'Python bee execution failed');
        }

        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Python bee execution timeout (task ${taskId})`);
}
