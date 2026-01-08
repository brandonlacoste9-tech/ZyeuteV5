/**
 * BugBot - Automated Bug Detection and Reporting Bee
 * Monitors system health, detects bugs, and reports them automatically
 * Part of the Colony OS ecosystem
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger.js";
import { synapseBridge } from "./synapse-bridge.js";
import { beeSystem } from "./bee-system.js";
import { beeCommunication } from "./bee-communication.js";
import { learningSystem } from "./learning-system.js";
import { governanceEngine } from "./governance-engine.js";
import { bugBotObservability } from "./bugbot-observability.js";
import { bugBotSecurity } from "./bugbot-security.js";
import { bugBotRateLimiter } from "./bugbot-rate-limiter.js";
import type { BeeTask } from "./bee-system.js";

export interface BugReport {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: "error" | "performance" | "security" | "data" | "integration";
  title: string;
  description: string;
  location: string; // File/function/endpoint
  stackTrace?: string;
  context: Record<string, any>;
  detectedAt: string;
  status: "new" | "investigating" | "fixing" | "fixed" | "ignored";
  assignedTo?: string; // Bee ID or user ID
  fixedAt?: string;
  relatedBugs?: string[]; // Other bug IDs
}

export interface BugPattern {
  id: string;
  pattern: string; // Regex or pattern matcher
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  autoFix?: string; // Suggested fix
  learnedFrom?: string; // Bug ID that taught us this pattern
}

/**
 * BugBot - The Bug Detection Bee
 * Automatically detects, reports, and learns from bugs
 */
export class BugBot extends EventEmitter {
  private bugReports: Map<string, BugReport> = new Map();
  private bugPatterns: Map<string, BugPattern> = new Map();
  private errorHistory: Array<{ error: string; timestamp: string; location: string }> = [];
  private maxHistorySize = 1000;

  constructor() {
    super();
    this.initializeBugBot();
    this.setupErrorMonitoring();
    this.setupPatternLearning();
  }

  /**
   * Initialize BugBot and register with bee system
   */
  private async initializeBugBot(): Promise<void> {
    // Register as a guardian bee
    await beeSystem.registerBee("bugbot", ["analytics", "moderation"]);

    // Load learned patterns
    const patterns = await learningSystem.retrieve("bugbot", "bug_patterns", {
      scope: "colony",
    });
    if (patterns) {
      this.bugPatterns = new Map(patterns);
      logger.info(`[BugBot] Loaded ${this.bugPatterns.size} learned bug patterns`);
    }

    // Share knowledge with other bees
    await beeCommunication.shareKnowledge(
      "bugbot",
      "bug_detection_active",
      { active: true, patterns: this.bugPatterns.size },
      { scope: "colony" }
    );

    logger.info("🐛 [BugBot] Initialized and ready to hunt bugs");
  }

  /**
   * Setup error monitoring hooks
   */
  private setupErrorMonitoring(): void {
    // Monitor unhandled errors
    process.on("uncaughtException", (error: Error) => {
      this.detectBug({
        type: "error",
        severity: "critical",
        title: "Uncaught Exception",
        description: error.message,
        location: error.stack?.split("\n")[1] || "unknown",
        stackTrace: error.stack,
        context: { name: error.name },
      });
    });

    process.on("unhandledRejection", (reason: any) => {
      this.detectBug({
        type: "error",
        severity: "high",
        title: "Unhandled Promise Rejection",
        description: reason?.message || String(reason),
        location: "promise",
        context: { reason: String(reason) },
      });
    });

    // Listen for errors from other bees
    beeSystem.on("task.failed", (task: BeeTask) => {
      this.detectBug({
        type: "error",
        severity: task.priority === "urgent" ? "high" : "medium",
        title: `Task Failed: ${task.capability}`,
        description: task.error || "Unknown error",
        location: `bee:${task.beeId}`,
        context: {
          taskId: task.id,
          beeId: task.beeId,
          capability: task.capability,
        },
      });
    });

    // Monitor governance violations
    governanceEngine.on("model.blocked", ({ performance, compliance }) => {
      this.detectBug({
        type: "security",
        severity: "high",
        title: "Model Deployment Blocked",
        description: "Governance policy violation detected",
        location: `model:${performance.beeId}`,
        context: {
          beeId: performance.beeId,
          modelVersion: performance.modelVersion,
          checks: compliance.checks,
        },
      });
    });
  }

  /**
   * Detect and report a bug
   */
  async detectBug(bug: Omit<BugReport, "id" | "detectedAt" | "status">): Promise<BugReport> {
    // Check rate limits
    const rateCheck = bugBotRateLimiter.canDetectBug();
    if (!rateCheck.allowed) {
      logger.warn(`[BugBot] Rate limited: ${rateCheck.reason}`);
      throw new Error(`Rate limit exceeded: ${rateCheck.reason}`);
    }

    // Record bug detection for rate limiting
    bugBotRateLimiter.recordBugDetection();
    const bugReport: BugReport = {
      id: `bug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...bug,
      detectedAt: new Date().toISOString(),
      status: "new",
    };

    // Check if this matches a known pattern
    const matchingPattern = this.matchPattern(bugReport);
    if (matchingPattern) {
      bugReport.relatedBugs = [matchingPattern.learnedFrom || ""].filter(Boolean);
      logger.info(`[BugBot] Matched known pattern: ${matchingPattern.id}`);
    }

    // Redact sensitive information before storing
    const redactedBug = bugBotSecurity.redactBugReport(bugReport);

    // Store bug report (redacted)
    this.bugReports.set(bugReport.id, redactedBug);

    // Add to error history
    this.errorHistory.push({
      error: bugReport.description,
      timestamp: bugReport.detectedAt,
      location: bugReport.location,
    });
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }

    // Learn from this bug
    await this.learnFromBug(bugReport);

    // Record duplicate if pattern matched
    if (matchingPattern) {
      bugBotObservability.recordDuplicate(bugReport.id, matchingPattern.id);
    }

    // Notify Colony OS
    await synapseBridge.publishEvent("bug.detected", {
      bugId: bugReport.id,
      severity: bugReport.severity,
      type: bugReport.type,
      title: bugReport.title,
      timestamp: bugReport.detectedAt,
    });

    // Alert other bees if critical
    if (bugReport.severity === "critical") {
      await beeCommunication.broadcast(
        "bugbot",
        `🚨 Critical bug detected: ${bugReport.title}`,
        { bugId: bugReport.id, location: bugReport.location },
        { scope: "colony", priority: "urgent" }
      );
    }

    this.emit("bug.detected", bugReport);
    logger.warn(`🐛 [BugBot] Bug detected: ${bugReport.title} (${bugReport.severity})`);

    return bugReport;
  }

  /**
   * Match bug against known patterns
   */
  private matchPattern(bug: BugReport): BugPattern | null {
    for (const pattern of this.bugPatterns.values()) {
      try {
        const regex = new RegExp(pattern.pattern, "i");
        if (
          regex.test(bug.description) ||
          regex.test(bug.location) ||
          regex.test(bug.title)
        ) {
          return pattern;
        }
      } catch (error) {
        // Invalid regex, skip
        continue;
      }
    }
    return null;
  }

  /**
   * Learn from bugs to create patterns
   */
  private async learnFromBug(bug: BugReport): Promise<void> {
    // Extract key patterns from the bug
    const patterns: string[] = [];

    // Extract error type patterns
    if (bug.description.includes("Cannot read property")) {
      patterns.push("Cannot read property");
    }
    if (bug.description.includes("is not defined")) {
      patterns.push("is not defined");
    }
    if (bug.description.includes("timeout")) {
      patterns.push("timeout");
    }
    if (bug.description.includes("connection")) {
      patterns.push("connection");
    }

    // Create pattern if we see similar bugs
    const similarBugs = Array.from(this.bugReports.values()).filter(
      (b) =>
        b.type === bug.type &&
        b.location === bug.location &&
        b.id !== bug.id &&
        this.calculateSimilarity(b.description, bug.description) > 0.7
    );

    if (similarBugs.length >= 2) {
      // We've seen this bug before - create a pattern
      const pattern: BugPattern = {
        id: `pattern-${Date.now()}`,
        pattern: this.extractPattern(bug.description),
        severity: bug.severity,
        description: `Auto-learned from ${similarBugs.length + 1} similar bugs`,
        learnedFrom: bug.id,
      };

      this.bugPatterns.set(pattern.id, pattern);

      // Record pattern creation
      bugBotObservability.recordPatternCreation(pattern.id);

      // Share pattern with Colony OS
      await learningSystem.learn(
        "bugbot",
        "pattern",
        `bug_pattern_${pattern.id}`,
        pattern,
        {
          performance: 0.8, // Confidence based on frequency
          tags: ["auto_learned", bug.type],
        }
      );

      logger.info(`[BugBot] Learned new pattern: ${pattern.id}`);
    }
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance for similarity calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Extract pattern from error message
   */
  private extractPattern(error: string): string {
    // Extract common patterns
    const commonPatterns = [
      /Cannot read property '(\w+)'/,
      /(\w+) is not defined/,
      /(\w+) is not a function/,
      /timeout of (\d+)ms exceeded/,
      /connection (?:refused|reset|timed out)/,
    ];

    for (const pattern of commonPatterns) {
      const match = error.match(pattern);
      if (match) {
        return pattern.source;
      }
    }

    // Fallback: use first few words
    return error.split(" ").slice(0, 5).join(" ").replace(/[^\w\s]/g, "");
  }

  /**
   * Get bug report
   */
  getBug(bugId: string): BugReport | undefined {
    return this.bugReports.get(bugId);
  }

  /**
   * Get all bugs
   */
  getAllBugs(filters?: {
    severity?: string;
    type?: string;
    status?: string;
  }): BugReport[] {
    let bugs = Array.from(this.bugReports.values());

    if (filters) {
      if (filters.severity) {
        bugs = bugs.filter((b) => b.severity === filters.severity);
      }
      if (filters.type) {
        bugs = bugs.filter((b) => b.type === filters.type);
      }
      if (filters.status) {
        bugs = bugs.filter((b) => b.status === filters.status);
      }
    }

    return bugs.sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
  }

  /**
   * Mark bug as fixed
   */
  async markBugFixed(bugId: string, fixedBy: string): Promise<void> {
    const bug = this.bugReports.get(bugId);
    if (!bug) {
      throw new Error(`Bug ${bugId} not found`);
    }

    bug.status = "fixed";
    bug.fixedAt = new Date().toISOString();
    bug.assignedTo = fixedBy;

    // Learn from the fix
    await learningSystem.learn(
      "bugbot",
      "strategy",
      `bug_fix_${bugId}`,
      {
        bugId,
        fix: "manual",
        fixedBy,
      },
      {
        performance: 1.0, // Successful fix
        tags: [bug.type, bug.severity],
      }
    );

    // Notify Colony OS
    await synapseBridge.publishEvent("bug.fixed", {
      bugId,
      fixedBy,
      timestamp: bug.fixedAt,
    });

    this.emit("bug.fixed", bug);
    logger.info(`[BugBot] Bug fixed: ${bugId} by ${fixedBy}`);
  }

  /**
   * Get bug statistics
   */
  getBugStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    criticalOpen: number;
  } {
    const bugs = Array.from(this.bugReports.values());

    return {
      total: bugs.length,
      bySeverity: bugs.reduce((acc, b) => {
        acc[b.severity] = (acc[b.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: bugs.reduce((acc, b) => {
        acc[b.type] = (acc[b.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: bugs.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      criticalOpen: bugs.filter(
        (b) => b.severity === "critical" && b.status !== "fixed"
      ).length,
    };
  }

  /**
   * Setup pattern learning from Colony OS
   */
  private setupPatternLearning(): void {
    // Listen for bug patterns from other hives
    synapseBridge.on("colony.bug.pattern", (pattern: BugPattern) => {
      this.bugPatterns.set(pattern.id, pattern);
      logger.info(`[BugBot] Learned pattern from Colony OS: ${pattern.id}`);
    });
  }
}

export const bugBot = new BugBot();
