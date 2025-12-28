import { BaseAgent, AgentTask } from './BaseAgent.js';

export abstract class WorkflowAgent extends BaseAgent {
  protected children: BaseAgent[] = [];

  constructor(agentId: string, children: BaseAgent[] = []) {
    super(agentId);
    this.children = children;
  }

  public async onStart(): Promise<void> {
    for (const child of this.children) {
      await child.start();
    }
  }

  public async onStop(): Promise<void> {
    for (const child of this.children) {
      await child.stop();
    }
  }

  protected async forage(): Promise<void> {
    // Workflow agents might not forage for tasks themselves, 
    // or they forage for "plans" to orchestrate.
  }
}

export class SequentialAgent extends WorkflowAgent {
  protected async processTask(task: AgentTask): Promise<any> {
    const results = [];
    for (const child of this.children) {
      const result = await (child as any).processTask(task); // Simplification for MVP
      results.push(result);
    }
    return results;
  }
}

export class ParallelAgent extends WorkflowAgent {
  protected async processTask(task: AgentTask): Promise<any> {
    return await Promise.all(this.children.map(child => (child as any).processTask(task)));
  }
}

export class LoopAgent extends WorkflowAgent {
  private iterations: number;

  constructor(agentId: string, child: BaseAgent, iterations: number) {
    super(agentId, [child]);
    this.iterations = iterations;
  }

  protected async processTask(task: AgentTask): Promise<any> {
    const results = [];
    for (let i = 0; i < this.iterations; i++) {
      const result = await (this.children[0] as any).processTask(task);
      results.push(result);
    }
    return results;
  }
}
