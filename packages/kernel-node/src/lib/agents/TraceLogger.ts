import { db } from '../db.js';
import { agentTraces } from '../../../../../shared/schema.js';
import { sql } from 'drizzle-orm';

/**
 * TraceLogger - The "Flight Recorder" for Agent Observability
 */
export class TraceLogger {
  private agentId: string;
  private taskId?: string;

  constructor(agentId: string, taskId?: string) {
    this.agentId = agentId;
    this.taskId = taskId;
  }

  /**
   * Logs a trace event to the database
   */
  public async log(params: {
    type: 'thought' | 'tool_call' | 'error' | 'result';
    content: string;
    metadata?: Record<string, any>;
  }) {
    try {
      console.log(`📡 [Trace:${this.agentId}] ${params.type.toUpperCase()}: ${params.content.substring(0, 100)}...`);
      
      await db.insert(agentTraces).values({
        agentId: this.agentId,
        taskId: this.taskId,
        traceType: params.type,
        content: params.content,
        metadata: params.metadata || {}
      });
    } catch (err) {
      console.error(`🚨 [TraceError:${this.agentId}] Failed to log trace:`, err);
    }
  }

  /**
   * Helper for logging thoughts
   */
  public async thought(taskId: string, content: string, metadata?: any) {
    this.taskId = taskId; // Update current task ID context
    await this.log({ type: 'thought', content, metadata });
  }

  /**
   * Helper for logging tool execution
   */
  public async tool(taskId: string, name: string, args: any, result: any) {
    this.taskId = taskId;
    await this.log({ 
      type: 'tool_call', 
      content: `Executed tool: ${name}`, 
      metadata: { tool: name, args, result } 
    });
  }

  /**
   * Helper for logging errors
   */
  public async error(taskId: string, message: string, error?: any) {
    this.taskId = taskId;
    await this.log({ 
      type: 'error', 
      content: message, 
      metadata: { error: error?.message || String(error) } 
    });
  }

  /**
   * Helper for logging results
   */
  public async result(taskId: string, content: string, metadata?: any) {
    this.taskId = taskId;
    await this.log({ type: 'result', content, metadata });
  }

  /**
   * Housekeeping: Remove traces older than N days
   */
  public async cleanOldTraces(days: number = 7) {
    try {
      await db.execute(sql`DELETE FROM ${agentTraces} WHERE created_at < NOW() - INTERVAL '${sql.raw(days.toString())} days'`);
      console.log(`🧹 [Tracer] Cleaned up traces older than ${days} days.`);
    } catch (err) {
      console.error(`🚨 [TracerError] Cleanup failed:`, err);
    }
  }
}
