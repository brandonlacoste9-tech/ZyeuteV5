import { QuebecContextEngine } from './context-engine.js';
import { TiGuyPromptBuilder } from './prompt-builder.js';

export class TiGuyUnified {
    private static instance: TiGuyUnified;
    private contextEngine: QuebecContextEngine;
    private promptBuilder: TiGuyPromptBuilder;

    private constructor() {
        this.contextEngine = new QuebecContextEngine();
        this.promptBuilder = new TiGuyPromptBuilder();
    }

    static getInstance(): TiGuyUnified {
        if (!TiGuyUnified.instance) {
            TiGuyUnified.instance = new TiGuyUnified();
        }
        return TiGuyUnified.instance;
    }

    /**
     * Generates the dynamic system prompt and analyzes the user message.
     * Returns the system prompt to be used with the LLM.
     */
    public prepareInteraction(message: string): { systemPrompt: string, contextSnapshot: any } {
        // 1. Analyze Context (Slang, Topic, etc.)
        const context = this.contextEngine.analyze(message);

        // 2. Build Dynamic Prompt
        const systemPrompt = this.promptBuilder.build(context);

        return {
            systemPrompt,
            contextSnapshot: context
        };
    }
}
