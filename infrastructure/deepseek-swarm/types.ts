export interface DeepSeekBot {
    id: string;
    persona: string;
    contextWindow: number;
    temperature: number;
    costOptimized: boolean;
    capabilities: string[];
    client?: any; // To be typed with actual Client
    memory?: BotMemory;
}

export interface Task {
    id: string;
    description: string;
    priority: number;
    requiredBotType: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result?: any;
}

export interface TaskResult {
    taskId: string;
    success: boolean;
    data: any;
    metrics: {
        executionTimeMs: number;
        tokensUsed: number;
        cost: number;
    };
}

export interface BotMemory {
    addInteraction(input: string, output: string): void;
    getContext(): string[];
}
