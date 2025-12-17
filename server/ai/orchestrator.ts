/**  
 * AI Hive - Main Orchestrator
 * Routes tasks to appropriate bees and manages execution
 */

import type { HiveTask, HiveTaskResult, BeeCapability } from './types.js';
import { getBeesByCapability, getBeeById } from './bee-registry.js';
import { v3Core, v3Mod } from '../v3-swarm.js';
import { executePythonBee } from './python-bridge.js';
import { executeTiGuyChatBee } from './bees/ti-guy-chat.js';
import { executeStudioCaptionBee } from './bees/studio-caption.js';
import { executeStudioImageBee } from './bees/studio-image.js';
import { executeStudioVideoBee } from './bees/studio-video.js';
import { executePostComposerBee } from './bees/post-composer.js';

/**
 * Hive Orchestrator - Routes tasks to appropriate bees
 * Integrates with existing V3 Swarm for intelligent routing
 */
export class HiveOrchestrator {
    /**
     * Main entry point for task execution
     */
    async handleTask(task: HiveTask): Promise<HiveTaskResult> {
        try {
            console.log(`[Hive Orchestrator] Handling task: ${task.type}`);

            // 1. Map task type to capability
            const capability = this.mapTaskTypeToCapability(task.type);
            console.log(`[Hive Orchestrator] Mapped to capability: ${capability}`);

            // 2. Get appropriate bee
            const bees = getBeesByCapability(capability);
            if (bees.length === 0) {
                throw new Error(`No bee found for capability: ${capability}`);
            }

            // 3. Execute bee (first available)
            const bee = bees[0];
            console.log(`[Hive Orchestrator] Executing bee: ${bee.id}`);
            const startTime = Date.now();

            let result;
            if (bee.endpoint === 'colony_tasks') {
                // Python bee - queue to Colony OS
                result = await executePythonBee(bee.id, task.payload);
            } else {
                // TypeScript bee - execute directly
                result = await this.executeTypescriptBee(bee.id, task.payload);
            }

            // 4. Run moderation if needed for generated content
            if (['image', 'video', 'caption', 'compose'].includes(capability)) {
                try {
                    const contentToMod = typeof result === 'string' ? result : JSON.stringify(result);
                    const modResult = await v3Mod(contentToMod);
                    if (modResult.status !== 'approved') {
                        console.warn(`[Hive Orchestrator] Content moderation rejected:`, modResult.reason);
                        if (modResult.suggested_rewrite) {
                            // Use suggested rewrite if available
                            result = modResult.suggested_rewrite;
                        } else {
                            throw new Error(`Content rejected by moderation: ${modResult.reason}`);
                        }
                    }
                } catch (modError) {
                    console.error(`[Hive Orchestrator] Moderation failed:`, modError);
                    // Don't fail the task for moderation errors, just log
                }
            }

            const executionTime = Date.now() - startTime;
            console.log(`[Hive Orchestrator] Task completed in ${executionTime}ms`);

            return {
                taskId: task.id,
                success: true,
                data: result,
                metadata: {
                    beeId: bee.id,
                    executionTime,
                    model: bee.model,
                    cost: (result as any)?.metadata?.cost,
                },
            };
        } catch (error) {
            console.error(`[Hive Orchestrator] Task failed:`, error);
            return {
                taskId: task.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Map task type to bee capability
     */
    private mapTaskTypeToCapability(taskType: string): BeeCapability {
        // Direct mappings
        if (taskType.includes('chat')) return 'chat';
        if (taskType.includes('caption')) return 'caption';
        if (taskType.includes('image')) return 'image';
        if (taskType.includes('video')) return 'video';
        if (taskType.includes('compose') || taskType.includes('post')) return 'compose';
        if (taskType.includes('moderation') || taskType.includes('moderate')) return 'moderation';
        if (taskType.includes('analytics')) return 'analytics';
        if (taskType.includes('budget')) return 'budget';

        // Default to chat for unknown types
        return 'chat';
    }

    /**
     * Execute a TypeScript bee
     */
    private async executeTypescriptBee(beeId: string, payload: Record<string, unknown>): Promise<unknown> {
        switch (beeId) {
            case 'ti-guy-chat':
                return executeTiGuyChatBee(payload);
            case 'studio-caption':
                return executeStudioCaptionBee(payload);
            case 'studio-image':
                return executeStudioImageBee(payload);
            case 'studio-video':
                return executeStudioVideoBee(payload);
            case 'post-composer':
                return executePostComposerBee(payload);
            default:
                throw new Error(`Unknown TypeScript bee: ${beeId}`);
        }
    }

    /**
     * Get orchestrator statistics
     */
    getStats() {
        // TODO: Implement metrics tracking
        return {
            totalTasks: 0,
            successfulTasks: 0,
            failedTasks: 0,
            averageExecutionTime: 0,
        };
    }
}

/**
 * Singleton instance
 */
export const hiveOrchestrator = new HiveOrchestrator();
