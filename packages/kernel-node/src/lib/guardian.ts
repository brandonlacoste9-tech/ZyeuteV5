// TypeScript bridge to Colony OS Guardian system
// Integrates with Python safety rules and audit logging

import { db } from './db.js';

export enum SafetyLevel {
  SAFE = 'safe',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface TaskViolation {
  rule: string;
  message: string;
  level: SafetyLevel;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  event_type: string;
  actor: string;
  details: Record<string, any>;
  hash?: string;
}

export class SafetyRule {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async check(task: any): Promise<{ passed: boolean; violation?: TaskViolation }> {
    // Base implementation - override in subclasses
    return { passed: true };
  }
}

export class ProhibitedPatternRule extends SafetyRule {
  private patterns: RegExp[];

  constructor(patterns: string[]) {
    super('prohibited_pattern');
    this.patterns = patterns.map(p => new RegExp(p, 'i'));
  }

  async check(task: any): Promise<{ passed: boolean; violation?: TaskViolation }> {
    const description = task.description || task.command || '';
    const payload = typeof task.payload === 'string' ? task.payload : JSON.stringify(task.payload);

    for (const pattern of this.patterns) {
      if (pattern.test(description) || pattern.test(payload)) {
        return {
          passed: false,
          violation: {
            rule: this.name,
            message: `Task contains prohibited pattern: ${pattern.source}`,
            level: SafetyLevel.CRITICAL
          }
        };
      }
    }
    return { passed: true };
  }
}

export class ResourceLimitRule extends SafetyRule {
  constructor(
    private maxTokens: number,
    private maxTimeout: number
  ) {
    super('resource_limit');
  }

  async check(task: any): Promise<{ passed: boolean; violation?: TaskViolation }> {
    const constraints = task.constraints || {};
    const timeout = task.timeout_seconds || 0;

    if (constraints.max_tokens && constraints.max_tokens > this.maxTokens) {
      return {
        passed: false,
        violation: {
          rule: this.name,
          message: `Task exceeds token limit (${constraints.max_tokens} > ${this.maxTokens})`,
          level: SafetyLevel.WARNING
        }
      };
    }

    if (timeout > this.maxTimeout) {
      return {
        passed: false,
        violation: {
          rule: this.name,
          message: `Task timeout ${timeout}s exceeds limit ${this.maxTimeout}s`,
          level: SafetyLevel.WARNING
        }
      };
    }

    return { passed: true };
  }
}

export class SovereigntyRule extends SafetyRule {
  constructor() {
    super('sovereignty_enforcement');
  }

  async check(task: any): Promise<{ passed: boolean; violation?: TaskViolation }> {
    // Check if task is trying to use public APIs instead of sovereign infrastructure
    const payload = typeof task.payload === 'string' ? task.payload : JSON.stringify(task.payload);
    const publicApiPatterns = [
      /openai\.com/i,
      /anthropic\.com/i,
      /api\.openai/i,
      /claude\.ai/i,
      /public.*api/i
    ];

    for (const pattern of publicApiPatterns) {
      if (pattern.test(payload)) {
        return {
          passed: false,
          violation: {
            rule: this.name,
            message: 'Task attempts to use public APIs instead of sovereign infrastructure',
            level: SafetyLevel.CRITICAL
          }
        };
      }
    }

    return { passed: true };
  }
}

export class AuditLog {
  private scope: string;

  constructor(scope = 'guardian_audit') {
    this.scope = scope;
  }

  async logEvent(
    eventType: string,
    actor: string,
    details: Record<string, any>
  ): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      event_type: eventType,
      actor,
      details,
      hash: this.generateHash({ eventType, actor, details, timestamp: new Date().toISOString() })
    };

    // TODO: Fix database queries
    // await db.from('audit_log').insert({
    //   task_id: details.task_id,
    //   agent_id: actor,
    //   audit_result: JSON.stringify(details),
    //   timestamp: entry.timestamp,
    //   authorization: 'unique-spirit-482300-s4'
    // });

    return entry;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateHash(data: any): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
}

export class Guardian {
  private rules: SafetyRule[] = [];
  private auditLog: AuditLog;

  constructor() {
    this.auditLog = new AuditLog();
    this.initializeRules();
  }

  private initializeRules() {
    // Initialize with sovereign AI safety rules
    this.addRule(new SovereigntyRule());
    this.addRule(new ProhibitedPatternRule([
      'hack',
      'exploit',
      'vulnerability',
      'breach',
      'unauthorized'
    ]));
    this.addRule(new ResourceLimitRule(10000, 300)); // 10k tokens, 5min timeout
  }

  addRule(rule: SafetyRule) {
    this.rules.push(rule);
  }

  async checkTask(task: any): Promise<{
    approved: boolean;
    violations: TaskViolation[];
    auditEntry?: AuditEntry;
  }> {
    const violations: TaskViolation[] = [];

    // Run all safety rules
    for (const rule of this.rules) {
      const result = await rule.check(task);
      if (!result.passed && result.violation) {
        violations.push(result.violation);
      }
    }

    const approved = violations.length === 0;

    // Log the audit
    const auditEntry = await this.auditLog.logEvent(
      'task_audit',
      'qa_firewall_guardian',
      {
        task_id: task.id,
        approved,
        violations: violations.map(v => ({ rule: v.rule, message: v.message, level: v.level })),
        rule_count: this.rules.length,
        sovereignty_enforced: true
      }
    );

    return {
      approved,
      violations,
      auditEntry
    };
  }

  async getAuditTrail(limit = 100): Promise<AuditEntry[]> {
    // TODO: Fix database queries
    // const { data } = await db
    //   .from('audit_log')
    //   .select('*')
    //   .order('timestamp', { ascending: false })
    //   .limit(limit);

    // return data?.map((row: any) => ({
    //   id: row.id,
    //   timestamp: row.timestamp,
    //   event_type: row.event_type || 'unknown',
    //   actor: row.agent_id,
    //   details: typeof row.audit_result === 'string' ? JSON.parse(row.audit_result) : row.audit_result,
    //   hash: row.id // Simplified hash for now
    // })) || [];

    // Return mock data for now
    return [];
  }
}

// Export singleton instance
export const guardian = new Guardian();