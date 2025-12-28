import { McpTool } from './McpTool.js';
import { MemoryService } from './MemoryService.js';
import { TraceLogger } from './TraceLogger.js';

export interface AgentTask {
  id: string;
  command: string;
  payload: any;
  metadata?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export abstract class BaseAgent {
  protected isRunning = false;
  protected pollInterval = 5000;
  protected agentId: string;
  protected tools: McpTool[] = [];
  protected tracer: TraceLogger;
  protected memory: MemoryService;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.tracer = new TraceLogger(agentId);
    this.memory = new MemoryService();
  }

  public registerTool(tool: McpTool) {
    this.tools.push(tool);
    console.log(`🛠️ [${this.agentId}] Registered tool: ${tool.name}`);
  }

  protected async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found on agent ${this.agentId}`);
    }
    
    console.log(`🛠️ [${this.agentId}] Executing tool: ${name}`, args);
    // In a full implementation, this would call the actual MCP server
    return { status: 'simulated_success', tool: name, data: args };
  }

  public abstract onStart(): Promise<void>;
  public abstract onStop(): Promise<void>;
  
  /** [NEW] Official ADK Lifecycle Hooks */
  public async onStartup?(): Promise<void>;
  public async onShutdown?(): Promise<void>;

  protected abstract forage(): Promise<void>;
  protected abstract processTask(task: AgentTask): Promise<any>;

  public async start() {
    if (this.isRunning) return;
    
    if (this.onStartup) {
      console.log(`🤖 [${this.agentId}] Execoting onStartup...`);
      await this.onStartup();
    }

    // Automated Housekeeping
    await this.tracer.cleanOldTraces(7);

    this.isRunning = true;
    console.log(`🤖 [${this.agentId}] Agent Started.`);
    await this.onStart();
    this.poll();
  }

  public async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    await this.onStop();
    
    if (this.onShutdown) {
      console.log(`🤖 [${this.agentId}] Execoting onShutdown...`);
      await this.onShutdown();
    }

    console.log(`🤖 [${this.agentId}] Agent Stopped.`);
  }

  private async poll() {
    while (this.isRunning) {
      try {
        await this.forage();
      } catch (error) {
        console.error(`🤖 [${this.agentId}] Polling Error:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
  }
}
