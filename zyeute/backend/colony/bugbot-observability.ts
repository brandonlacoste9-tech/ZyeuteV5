/**
 * BugBot Observability
 * Metrics, logging, and tracing for BugBot
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger.js";
import { bugBot } from "./bugbot.js";
import type { BugReport } from "./bugbot.js";

export interface BugBotMetrics {
  bugs_detected_total: number;
  bugs_by_severity: Record<string, number>;
  bugs_by_type: Record<string, number>;
  patterns_created_total: number;
  bug_resolution_time_seconds: number;
  duplicate_rate: number;
  false_positive_rate: number;
}

export interface BugBotLog {
  bugId: string;
  patternId?: string;
  severity: string;
  type: string;
  service: string;
  location: string;
  stack?: string;
  traceId?: string;
  timestamp: string;
  context: Record<string, any>;
}

/**
 * BugBot Observability Manager
 * Handles metrics, logging, and tracing
 */
export class BugBotObservability extends EventEmitter {
  private metrics: BugBotMetrics = {
    bugs_detected_total: 0,
    bugs_by_severity: {},
    bugs_by_type: {},
    patterns_created_total: 0,
    bug_resolution_time_seconds: 0,
    duplicate_rate: 0,
    false_positive_rate: 0,
  };

  private resolutionTimes: number[] = [];
  private duplicateCount = 0;
  private falsePositiveCount = 0;

  constructor() {
    super();
    this.setupMetricsCollection();
  }

  /**
   * Setup metrics collection from BugBot events
   */
  private setupMetricsCollection(): void {
    bugBot.on("bug.detected", (bug: BugReport) => {
      this.recordBugDetection(bug);
    });

    bugBot.on("bug.fixed", (bug: BugReport) => {
      this.recordBugFix(bug);
    });
  }

  /**
   * Record bug detection
   */
  private recordBugDetection(bug: BugReport): void {
    // Update metrics
    this.metrics.bugs_detected_total++;
    this.metrics.bugs_by_severity[bug.severity] =
      (this.metrics.bugs_by_severity[bug.severity] || 0) + 1;
    this.metrics.bugs_by_type[bug.type] = (this.metrics.bugs_by_type[bug.type] || 0) + 1;

    // Generate trace ID
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Structured log
    const logEntry: BugBotLog = {
      bugId: bug.id,
      severity: bug.severity,
      type: bug.type,
      service: "bugbot",
      location: bug.location,
      stack: bug.stackTrace,
      traceId,
      timestamp: bug.detectedAt,
      context: bug.context,
    };

    // Emit structured log
    logger.info(JSON.stringify({
      event: "bug.detected",
      ...logEntry,
    }));

    this.emit("bug.logged", logEntry);
  }

  /**
   * Record bug fix
   */
  private recordBugFix(bug: BugReport): void {
    if (bug.fixedAt && bug.detectedAt) {
      const resolutionTime =
        new Date(bug.fixedAt).getTime() - new Date(bug.detectedAt).getTime();
      const resolutionTimeSeconds = resolutionTime / 1000;

      this.resolutionTimes.push(resolutionTimeSeconds);

      // Calculate average resolution time
      const avgResolutionTime =
        this.resolutionTimes.reduce((a, b) => a + b, 0) / this.resolutionTimes.length;
      this.metrics.bug_resolution_time_seconds = avgResolutionTime;

      logger.info(JSON.stringify({
        event: "bug.fixed",
        bugId: bug.id,
        resolutionTimeSeconds,
        fixedBy: bug.assignedTo,
        timestamp: bug.fixedAt,
      }));
    }
  }

  /**
   * Record duplicate bug
   */
  recordDuplicate(bugId: string, patternId: string): void {
    this.duplicateCount++;
    this.metrics.duplicate_rate = this.duplicateCount / this.metrics.bugs_detected_total;

    logger.info(JSON.stringify({
      event: "bug.duplicate",
      bugId,
      patternId,
      duplicateRate: this.metrics.duplicate_rate,
    }));
  }

  /**
   * Record false positive
   */
  recordFalsePositive(bugId: string): void {
    this.falsePositiveCount++;
    this.metrics.false_positive_rate =
      this.falsePositiveCount / this.metrics.bugs_detected_total;

    logger.info(JSON.stringify({
      event: "bug.false_positive",
      bugId,
      falsePositiveRate: this.metrics.false_positive_rate,
    }));
  }

  /**
   * Record pattern creation
   */
  recordPatternCreation(patternId: string): void {
    this.metrics.patterns_created_total++;

    logger.info(JSON.stringify({
      event: "pattern.created",
      patternId,
      totalPatterns: this.metrics.patterns_created_total,
    }));
  }

  /**
   * Get current metrics
   */
  getMetrics(): BugBotMetrics {
    return { ...this.metrics };
  }

  /**
   * Export metrics for Prometheus/StatsD
   */
  exportMetrics(): string {
    const lines: string[] = [];

    lines.push(`# HELP bugbot_bugs_detected_total Total number of bugs detected`);
    lines.push(`# TYPE bugbot_bugs_detected_total counter`);
    lines.push(`bugbot_bugs_detected_total ${this.metrics.bugs_detected_total}`);

    lines.push(`# HELP bugbot_bugs_by_severity Bugs detected by severity`);
    lines.push(`# TYPE bugbot_bugs_by_severity gauge`);
    Object.entries(this.metrics.bugs_by_severity).forEach(([severity, count]) => {
      lines.push(`bugbot_bugs_by_severity{severity="${severity}"} ${count}`);
    });

    lines.push(`# HELP bugbot_bugs_by_type Bugs detected by type`);
    lines.push(`# TYPE bugbot_bugs_by_type gauge`);
    Object.entries(this.metrics.bugs_by_type).forEach(([type, count]) => {
      lines.push(`bugbot_bugs_by_type{type="${type}"} ${count}`);
    });

    lines.push(`# HELP bugbot_patterns_created_total Total patterns created`);
    lines.push(`# TYPE bugbot_patterns_created_total counter`);
    lines.push(`bugbot_patterns_created_total ${this.metrics.patterns_created_total}`);

    lines.push(`# HELP bugbot_bug_resolution_time_seconds Average bug resolution time`);
    lines.push(`# TYPE bugbot_bug_resolution_time_seconds gauge`);
    lines.push(`bugbot_bug_resolution_time_seconds ${this.metrics.bug_resolution_time_seconds}`);

    lines.push(`# HELP bugbot_duplicate_rate Rate of duplicate bugs`);
    lines.push(`# TYPE bugbot_duplicate_rate gauge`);
    lines.push(`bugbot_duplicate_rate ${this.metrics.duplicate_rate}`);

    lines.push(`# HELP bugbot_false_positive_rate Rate of false positives`);
    lines.push(`# TYPE bugbot_false_positive_rate gauge`);
    lines.push(`bugbot_false_positive_rate ${this.metrics.false_positive_rate}`);

    return lines.join("\n");
  }
}

export const bugBotObservability = new BugBotObservability();
