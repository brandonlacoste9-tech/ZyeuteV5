import { BaseAgent, AgentTask } from './BaseAgent.js';

export interface LlmEngine {
  think(messages: any[]): Promise<string>;
  chat?(prompt: string): Promise<string>;
}

export abstract class LlmAgent extends BaseAgent {
  protected engine: LlmEngine;
  protected staticInstruction: string = '';

  constructor(agentId: string, engine: LlmEngine, staticInstruction?: string) {
    super(agentId);
    this.engine = engine;
    if (staticInstruction) {
      this.staticInstruction = staticInstruction;
    }
  }

  protected async think(prompt: string | any[], taskId?: string): Promise<string> {
    const userMessages = typeof prompt === 'string' ? [{ role: 'user', content: prompt }] : prompt;
    
    // Prepend static instruction as a system message (to be cached by App/Engine)
    const messages = [
      ...(this.staticInstruction ? [{ role: 'system', content: this.staticInstruction }] : []),
      ...userMessages
    ];
    
    // Observability: Log the thought process
    if (taskId) {
      await this.tracer.thought(taskId, `🤔 Thinking about task ${taskId}...`, { messages });
    }
    
    const response = await this.engine.think(messages);

    if (taskId) {
      await this.tracer.result(taskId, response);
    }

    return response;
  }

  // Common LlmAgent patterns can be added here
}
