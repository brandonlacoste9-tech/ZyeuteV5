/**
 * Governance & Policy Engine - "The Queen's Decree"
 * Hard constraints and safety guardrails that ML models cannot override
 * Ensures AI evolution remains aligned with human/business goals
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger.js";
import { synapseBridge } from "./synapse-bridge.js";
import { mlopsPipelines } from "./mlops-pipelines.js";
import { learningSystem } from "./learning-system.js";
import type { ModelPerformance } from "./learning-system.js";
import type { PipelineRun } from "./mlops-pipelines.js";

export interface Policy {
  id: string;
  name: string;
  description: string;
  type: "performance" | "safety" | "compliance" | "ethical" | "resource";
  rule: PolicyRule;
  severity: "critical" | "high" | "medium" | "low";
  enabled: boolean;
}

export interface PolicyRule {
  condition: string; // e.g., "cpu_usage > 0.8" or "confidence < 0.9"
  action: "block" | "warn" | "require_approval" | "rollback";
  message?: string;
}

export interface ComplianceCheck {
  id: string;
  policyId: string;
  entityType: "model" | "pipeline" | "deployment" | "feature";
  entityId: string;
  status: "pass" | "fail" | "warning";
  details: Record<string, any>;
  timestamp: string;
  approvedBy?: string; // Human or automated process
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string; // Bee ID, user ID, or "automated"
  decision: "approved" | "rejected" | "blocked";
  reason: string;
  policies: string[]; // Policy IDs that were checked
  timestamp: string;
  immutable: boolean; // Cannot be modified
}

/**
 * Governance Engine - The Queen's Decree
 * Enforces policies and ensures compliance
 */
export class GovernanceEngine extends EventEmitter {
  private policies: Map<string, Policy> = new Map();
  private complianceChecks: Map<string, ComplianceCheck[]> = new Map(); // entityId -> checks
  private auditLogs: AuditLog[] = [];
  private maxAuditLogs = 10000;

  constructor() {
    super();
    this.setupDefaultPolicies();
    this.setupPolicyEnforcement();
  }

  /**
   * Setup default policies
   */
  private setupDefaultPolicies(): void {
    // Performance Policies
    this.addPolicy({
      id: "perf-cpu-limit",
      name: "CPU Usage Limit",
      description: "Models must not exceed 80% CPU usage",
      type: "performance",
      rule: {
        condition: "cpu_usage > 0.8",
        action: "block",
        message: "CPU usage exceeds safe threshold",
      },
      severity: "high",
      enabled: true,
    });

    this.addPolicy({
      id: "perf-latency-limit",
      name: "Latency Limit",
      description: "Model latency must be under 2 seconds",
      type: "performance",
      rule: {
        condition: "latency > 2000",
        action: "block",
        message: "Latency exceeds acceptable threshold",
      },
      severity: "high",
      enabled: true,
    });

    // Safety Policies
    this.addPolicy({
      id: "safety-confidence-min",
      name: "Minimum Confidence",
      description: "Model confidence must be above 90% for critical decisions",
      type: "safety",
      rule: {
        condition: "confidence < 0.9 AND critical_decision == true",
        action: "block",
        message: "Confidence too low for critical decision",
      },
      severity: "critical",
      enabled: true,
    });

    this.addPolicy({
      id: "safety-content-moderation",
      name: "Content Moderation Required",
      description: "All user-generated content must be moderated",
      type: "safety",
      rule: {
        condition: "content_moderated == false",
        action: "block",
        message: "Content must be moderated before deployment",
      },
      severity: "critical",
      enabled: true,
    });

    // Compliance Policies
    this.addPolicy({
      id: "compliance-data-privacy",
      name: "Data Privacy Compliance",
      description: "Must comply with GDPR/CCPA data privacy regulations",
      type: "compliance",
      rule: {
        condition: "data_privacy_compliant == false",
        action: "block",
        message: "Data privacy compliance required",
      },
      severity: "critical",
      enabled: true,
    });

    // Ethical Policies
    this.addPolicy({
      id: "ethical-bias-detection",
      name: "Bias Detection",
      description: "Models must pass bias detection tests",
      type: "ethical",
      rule: {
        condition: "bias_score > 0.1",
        action: "require_approval",
        message: "Potential bias detected, requires human review",
      },
      severity: "high",
      enabled: true,
    });

    // Resource Policies
    this.addPolicy({
      id: "resource-cost-limit",
      name: "Cost Limit",
      description: "Model training cost must not exceed budget",
      type: "resource",
      rule: {
        condition: "training_cost > budget_limit",
        action: "require_approval",
        message: "Training cost exceeds budget, requires approval",
      },
      severity: "medium",
      enabled: true,
    });
  }

  /**
   * Add a policy
   */
  addPolicy(policy: Policy): void {
    this.policies.set(policy.id, policy);
    logger.info(
      `[Governance] Policy added: ${policy.name} (${policy.severity})`,
    );
    this.emit("policy.added", policy);
  }

  /**
   * Remove a policy
   */
  removePolicy(policyId: string): void {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = false;
      logger.info(`[Governance] Policy disabled: ${policy.name}`);
      this.emit("policy.removed", policy);
    }
  }

  /**
   * Check compliance for a model
   */
  async checkModelCompliance(
    beeId: string,
    modelVersion: string,
    metrics: ModelPerformance["metrics"],
  ): Promise<{
    compliant: boolean;
    checks: ComplianceCheck[];
    blocked: boolean;
    requiresApproval: boolean;
  }> {
    const checks: ComplianceCheck[] = [];
    let blocked = false;
    let requiresApproval = false;

    // Check all enabled policies
    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      const check = await this.evaluatePolicy(policy, {
        entityType: "model",
        entityId: `${beeId}-${modelVersion}`,
        metrics,
      });

      checks.push(check);

      if (check.status === "fail") {
        if (policy.rule.action === "block") {
          blocked = true;
        } else if (policy.rule.action === "require_approval") {
          requiresApproval = true;
        }
      }
    }

    // Store compliance checks
    const entityId = `${beeId}-${modelVersion}`;
    if (!this.complianceChecks.has(entityId)) {
      this.complianceChecks.set(entityId, []);
    }
    this.complianceChecks.get(entityId)!.push(...checks);

    // Log audit
    this.logAudit({
      action: "compliance_check",
      entityType: "model",
      entityId,
      actor: "governance_engine",
      decision: blocked
        ? "blocked"
        : requiresApproval
          ? "requires_approval"
          : "approved",
      reason: blocked
        ? "Policy violation detected"
        : requiresApproval
          ? "Approval required"
          : "All policies passed",
      policies: checks.map((c) => c.policyId),
    });

    return {
      compliant: !blocked && !requiresApproval,
      checks,
      blocked,
      requiresApproval,
    };
  }

  /**
   * Check compliance for a pipeline
   */
  async checkPipelineCompliance(
    pipelineRun: PipelineRun,
    parameters: Record<string, any>,
  ): Promise<{
    compliant: boolean;
    checks: ComplianceCheck[];
    blocked: boolean;
  }> {
    const checks: ComplianceCheck[] = [];
    let blocked = false;

    // Check resource policies
    for (const policy of this.policies.values()) {
      if (!policy.enabled || policy.type !== "resource") continue;

      const check = await this.evaluatePolicy(policy, {
        entityType: "pipeline",
        entityId: pipelineRun.id,
        parameters,
      });

      checks.push(check);

      if (check.status === "fail" && policy.rule.action === "block") {
        blocked = true;
      }
    }

    // Log audit
    this.logAudit({
      action: "pipeline_compliance_check",
      entityType: "pipeline",
      entityId: pipelineRun.id,
      actor: "governance_engine",
      decision: blocked ? "blocked" : "approved",
      reason: blocked ? "Resource policy violation" : "Compliant",
      policies: checks.map((c) => c.policyId),
    });

    return {
      compliant: !blocked,
      checks,
      blocked,
    };
  }

  /**
   * Evaluate a policy against an entity
   */
  private async evaluatePolicy(
    policy: Policy,
    context: {
      entityType: string;
      entityId: string;
      metrics?: Record<string, any>;
      parameters?: Record<string, any>;
    },
  ): Promise<ComplianceCheck> {
    const { entityType, entityId, metrics = {}, parameters = {} } = context;

    // Evaluate condition (simplified - would use proper expression evaluator)
    const passed = this.evaluateCondition(policy.rule.condition, {
      ...metrics,
      ...parameters,
    });

    const check: ComplianceCheck = {
      id: `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      policyId: policy.id,
      entityType: entityType as any,
      entityId,
      status: passed
        ? "pass"
        : policy.severity === "critical"
          ? "fail"
          : "warning",
      details: {
        condition: policy.rule.condition,
        evaluated: passed,
        severity: policy.severity,
        action: policy.rule.action,
      },
      timestamp: new Date().toISOString(),
    };

    return check;
  }

  /**
   * Evaluate condition (simplified - would use proper expression evaluator)
   */
  private evaluateCondition(
    condition: string,
    context: Record<string, any>,
  ): boolean {
    // Simple condition evaluation
    // In production, would use a proper expression evaluator

    try {
      // Replace variables with values
      let expr = condition;
      for (const [key, value] of Object.entries(context)) {
        expr = expr.replace(new RegExp(`\\b${key}\\b`, "g"), String(value));
      }

      // Evaluate simple comparisons
      if (expr.includes(">")) {
        const [left, right] = expr.split(">").map((s) => parseFloat(s.trim()));
        return !isNaN(left) && !isNaN(right) && left > right;
      }
      if (expr.includes("<")) {
        const [left, right] = expr.split("<").map((s) => parseFloat(s.trim()));
        return !isNaN(left) && !isNaN(right) && left < right;
      }
      if (expr.includes("==")) {
        const [left, right] = expr.split("==").map((s) => s.trim());
        return left === right;
      }
      if (expr.includes("!=")) {
        const [left, right] = expr.split("!=").map((s) => s.trim());
        return left !== right;
      }

      return true; // Default to pass if can't evaluate
    } catch (error) {
      logger.warn(`[Governance] Could not evaluate condition: ${condition}`);
      return false; // Fail safe
    }
  }

  /**
   * Approve deployment (human override)
   */
  async approveDeployment(
    entityId: string,
    entityType: "model" | "pipeline",
    approvedBy: string,
    reason: string,
  ): Promise<void> {
    this.logAudit({
      action: "deployment_approved",
      entityType,
      entityId,
      actor: approvedBy,
      decision: "approved",
      reason,
      policies: [],
    });

    // Notify Colony OS
    await synapseBridge.publishEvent("governance.approval", {
      entityType,
      entityId,
      approvedBy,
      reason,
      timestamp: new Date().toISOString(),
    });

    this.emit("deployment.approved", { entityType, entityId, approvedBy });
    logger.info(
      `[Governance] Deployment approved: ${entityId} by ${approvedBy}`,
    );
  }

  /**
   * Log audit event (immutable)
   */
  private logAudit(
    log: Omit<AuditLog, "id" | "timestamp" | "immutable">,
  ): void {
    const auditLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...log,
      timestamp: new Date().toISOString(),
      immutable: true,
    };

    this.auditLogs.push(auditLog);

    // Keep only last N logs
    if (this.auditLogs.length > this.maxAuditLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxAuditLogs);
    }

    this.emit("audit.logged", auditLog);
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filters?: {
    entityType?: string;
    entityId?: string;
    actor?: string;
    decision?: string;
    startTime?: string;
    endTime?: string;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.entityType) {
        logs = logs.filter((l) => l.entityType === filters.entityType);
      }
      if (filters.entityId) {
        logs = logs.filter((l) => l.entityId === filters.entityId);
      }
      if (filters.actor) {
        logs = logs.filter((l) => l.actor === filters.actor);
      }
      if (filters.decision) {
        logs = logs.filter((l) => l.decision === filters.decision);
      }
      if (filters.startTime) {
        logs = logs.filter((l) => l.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        logs = logs.filter((l) => l.timestamp <= filters.endTime!);
      }
    }

    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  /**
   * Get all policies
   */
  getAllPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get compliance checks for entity
   */
  getComplianceChecks(entityId: string): ComplianceCheck[] {
    return this.complianceChecks.get(entityId) || [];
  }

  /**
   * Setup policy enforcement hooks
   */
  private setupPolicyEnforcement(): void {
    // Enforce policies on model evaluation
    learningSystem.on(
      "model.evaluated",
      async (performance: ModelPerformance) => {
        const compliance = await this.checkModelCompliance(
          performance.beeId,
          performance.modelVersion,
          performance.metrics,
        );

        if (compliance.blocked) {
          logger.warn(
            `[Governance] Model deployment blocked: ${performance.beeId} v${performance.modelVersion}`,
          );
          this.emit("model.blocked", { performance, compliance });
        } else if (compliance.requiresApproval) {
          logger.info(
            `[Governance] Model requires approval: ${performance.beeId} v${performance.modelVersion}`,
          );
          this.emit("model.requires_approval", { performance, compliance });
        }
      },
    );

    // Enforce policies on pipeline deployment
    mlopsPipelines.on("pipeline.completed", async (run: PipelineRun) => {
      const compliance = await this.checkPipelineCompliance(run, {});

      if (compliance.blocked) {
        logger.warn(`[Governance] Pipeline deployment blocked: ${run.id}`);
        this.emit("pipeline.blocked", { run, compliance });
      }
    });
  }
}

export const governanceEngine = new GovernanceEngine();
