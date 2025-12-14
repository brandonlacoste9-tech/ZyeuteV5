/**
 * Tracing Framework for Monitoring and Debugging
 * 
 * This module provides utilities for tracing service calls, agent operations,
 * and debugging complex workflows in the Zyeuté application.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface TraceEvent {
  id: string;
  timestamp: number;
  level: LogLevel;
  service: string;
  operation: string;
  duration?: number;
  metadata?: Record<string, any>;
  error?: string;
  parentId?: string;
}

export interface TraceSpan {
  id: string;
  service: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  events: TraceEvent[];
  metadata: Record<string, any>;
  parentId?: string;
  childSpans: TraceSpan[];
}

/**
 * Tracer class for distributed tracing
 */
export class Tracer {
  private spans: Map<string, TraceSpan> = new Map();
  private activeSpans: Map<string, string> = new Map(); // context -> spanId
  private events: TraceEvent[] = [];
  private enabled: boolean = true;

  constructor(private serviceName: string = 'zyeute') {}

  /**
   * Generate unique trace ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Start a new trace span
   */
  startSpan(operation: string, metadata?: Record<string, any>, parentId?: string): string {
    if (!this.enabled) return '';

    const id = this.generateId();
    const span: TraceSpan = {
      id,
      service: this.serviceName,
      operation,
      startTime: performance.now(),
      events: [],
      metadata: metadata || {},
      parentId,
      childSpans: [],
    };

    this.spans.set(id, span);

    // If this is a child span, add it to parent's children
    if (parentId && this.spans.has(parentId)) {
      this.spans.get(parentId)!.childSpans.push(span);
    }

    return id;
  }

  /**
   * End a trace span
   */
  endSpan(spanId: string, metadata?: Record<string, any>): void {
    if (!this.enabled || !spanId) return;

    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;
    
    if (metadata) {
      span.metadata = { ...span.metadata, ...metadata };
    }
  }

  /**
   * Add event to a span
   */
  addEvent(
    spanId: string,
    level: LogLevel,
    operation: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled || !spanId) return;

    const span = this.spans.get(spanId);
    if (!span) return;

    const event: TraceEvent = {
      id: this.generateId(),
      timestamp: performance.now(),
      level,
      service: this.serviceName,
      operation,
      metadata,
      parentId: spanId,
    };

    span.events.push(event);
    this.events.push(event);
  }

  /**
   * Log error in span
   */
  addError(spanId: string, error: Error | string, metadata?: Record<string, any>): void {
    if (!this.enabled || !spanId) return;

    const span = this.spans.get(spanId);
    if (!span) return;

    const errorMessage = error instanceof Error ? error.message : error;
    const event: TraceEvent = {
      id: this.generateId(),
      timestamp: performance.now(),
      level: 'error',
      service: this.serviceName,
      operation: span.operation,
      error: errorMessage,
      metadata,
      parentId: spanId,
    };

    span.events.push(event);
    this.events.push(event);
  }

  /**
   * Get span by ID
   */
  getSpan(spanId: string): TraceSpan | undefined {
    return this.spans.get(spanId);
  }

  /**
   * Get all spans
   */
  getAllSpans(): TraceSpan[] {
    return Array.from(this.spans.values());
  }

  /**
   * Get root spans (spans without parents)
   */
  getRootSpans(): TraceSpan[] {
    return Array.from(this.spans.values()).filter(span => !span.parentId);
  }

  /**
   * Get all events
   */
  getAllEvents(): TraceEvent[] {
    return this.events;
  }

  /**
   * Clear all traces
   */
  clear(): void {
    this.spans.clear();
    this.activeSpans.clear();
    this.events = [];
  }

  /**
   * Enable/disable tracing
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Export traces as JSON
   */
  export() {
    return {
      service: this.serviceName,
      spans: this.getAllSpans(),
      events: this.events,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get trace statistics
   */
  getStats() {
    const spans = this.getAllSpans();
    const completedSpans = spans.filter(s => s.duration !== undefined);
    
    const durations = completedSpans.map(s => s.duration!);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = durations.length > 0 ? totalDuration / durations.length : 0;
    
    const errors = this.events.filter(e => e.level === 'error');
    
    return {
      totalSpans: spans.length,
      completedSpans: completedSpans.length,
      avgDuration: parseFloat(avgDuration.toFixed(2)),
      totalDuration: parseFloat(totalDuration.toFixed(2)),
      totalEvents: this.events.length,
      errorCount: errors.length,
      errorRate: spans.length > 0 ? errors.length / spans.length : 0,
    };
  }
}

/**
 * Global tracer instance
 */
export const globalTracer = new Tracer('zyeute');

/**
 * Decorator for tracing function calls
 */
export function trace(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const spanId = globalTracer.startSpan(operationName, { args });
      
      try {
        const result = await originalMethod.apply(this, args);
        globalTracer.endSpan(spanId, { success: true });
        return result;
      } catch (error) {
        globalTracer.addError(spanId, error as Error);
        globalTracer.endSpan(spanId, { success: false });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Wrapper function for tracing async operations
 */
export async function traceAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const spanId = globalTracer.startSpan(operation, metadata);
  
  try {
    const result = await fn();
    globalTracer.endSpan(spanId, { success: true });
    return result;
  } catch (error) {
    globalTracer.addError(spanId, error as Error);
    globalTracer.endSpan(spanId, { success: false });
    throw error;
  }
}

/**
 * Wrapper function for tracing sync operations
 */
export function traceSync<T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const spanId = globalTracer.startSpan(operation, metadata);
  
  try {
    const result = fn();
    globalTracer.endSpan(spanId, { success: true });
    return result;
  } catch (error) {
    globalTracer.addError(spanId, error as Error);
    globalTracer.endSpan(spanId, { success: false });
    throw error;
  }
}

/**
 * Logger with trace integration
 */
export class TraceLogger {
  constructor(
    private service: string,
    private tracer: Tracer = globalTracer
  ) {}

  private log(level: LogLevel, operation: string, message: string, metadata?: Record<string, any>): void {
    const spanId = this.tracer.startSpan(operation, {
      level,
      message,
      ...metadata,
    });
    
    this.tracer.addEvent(spanId, level, operation, { message, ...metadata });
    this.tracer.endSpan(spanId);

    // Also log to console in development
    if (import.meta.env?.DEV) {
      const prefix = `[${this.service}] [${level.toUpperCase()}]`;
      console[level === 'debug' ? 'log' : level](`${prefix} ${operation}:`, message, metadata || '');
    }
  }

  debug(operation: string, message: string, metadata?: Record<string, any>): void {
    this.log('debug', operation, message, metadata);
  }

  info(operation: string, message: string, metadata?: Record<string, any>): void {
    this.log('info', operation, message, metadata);
  }

  warn(operation: string, message: string, metadata?: Record<string, any>): void {
    this.log('warn', operation, message, metadata);
  }

  error(operation: string, message: string, metadata?: Record<string, any>): void {
    this.log('error', operation, message, metadata);
  }
}

/**
 * Create a logger for a service
 */
export function createLogger(service: string): TraceLogger {
  return new TraceLogger(service);
}
