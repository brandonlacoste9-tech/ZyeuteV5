import { useState } from 'react';
import { colonyClient } from '@/zyeute-colony-bridge/ColonyClient';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

/**
 * SwarmDebug Component
 * A fixed debug button to test the Colony OS bridge
 */
export function SwarmDebug() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [taskStatus, setTaskStatus] = useState<string>('idle');

    const handleTestSwarm = async () => {
        try {
            setIsSubmitting(true);
            setTaskStatus('submitting');

            toast.info('🐝 Submitting task to Colony OS...');

            // Submit task to the swarm
            const taskId = await colonyClient.submitTask({
                description: 'Health Check Request',
                beeType: 'finance',
                priority: 'high'
            });

            if (!taskId) {
                throw new Error('Failed to submit task');
            }

            setCurrentTaskId(taskId);
            setTaskStatus('pending');
            toast.success(`✅ Task submitted: ${taskId.substring(0, 8)}...`);

            // Subscribe to task updates
            const subscription = colonyClient.subscribeToTask(taskId, (status, result) => {
                setTaskStatus(status);

                if (status === 'processing') {
                    toast.loading(`🐝 Task is being processed...`, { id: taskId });
                } else if (status === 'completed') {
                    toast.success(`✅ Task completed!`, { id: taskId });
                    console.log('Task result:', result);
                    subscription.unsubscribe();
                    setIsSubmitting(false);
                } else if (status === 'failed') {
                    toast.error(`❌ Task failed`, { id: taskId });
                    console.error('Task error:', result);
                    subscription.unsubscribe();
                    setIsSubmitting(false);
                }
            });

            // Auto-unsubscribe after 30 seconds if no completion
            setTimeout(() => {
                if (taskStatus !== 'completed' && taskStatus !== 'failed') {
                    subscription.unsubscribe();
                    setIsSubmitting(false);
                    toast.warning('⏰ Task monitoring timed out. Check Task Poller logs.');
                }
            }, 30000);

        } catch (error) {
            console.error('Swarm test error:', error);
            toast.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsSubmitting(false);
            setTaskStatus('error');
        }
    };

    const getStatusColor = () => {
        switch (taskStatus) {
            case 'pending': return 'bg-yellow-500';
            case 'processing': return 'bg-blue-500';
            case 'completed': return 'bg-green-500';
            case 'failed': return 'bg-red-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-purple-500';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {/* Status indicator */}
            {currentTaskId && (
                <div className="bg-black/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs font-mono">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
                        <span>{taskStatus.toUpperCase()}</span>
                    </div>
                    <div className="text-gray-400 mt-1">
                        {currentTaskId.substring(0, 8)}...
                    </div>
                </div>
            )}

            {/* Test button */}
            <button
                onClick={handleTestSwarm}
                disabled={isSubmitting}
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Testing Swarm...</span>
                    </>
                ) : (
                    <>
                        <span className="text-xl">🐝</span>
                        <span>Test Swarm</span>
                    </>
                )}
            </button>

            {/* Tooltip */}
            {!isSubmitting && (
                <div className="absolute bottom-full mb-2 right-0 hidden group-hover:block">
                    <div className="bg-black/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap">
                        Test the Colony OS Bridge
                    </div>
                </div>
            )}
        </div>
    );
}
