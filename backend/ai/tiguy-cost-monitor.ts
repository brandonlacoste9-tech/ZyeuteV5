/**
 * TI-GUY Cost Monitor
 * Tracks Dialogflow API usage and warns at $800 cap
 */

import { sendCostAlert } from "../services/alert-service";

import { SessionsClient } from "@google-cloud/dialogflow-cx";

interface CostMetrics {
  dailyQueries: number;
  dailyCost: number;
  monthlyQueries: number;
  monthlyCost: number;
  lastReset: Date;
}

// Cost estimates (Dialogflow CX pricing as of 2024)
const COST_PER_QUERY = 0.007; // $0.007 per request (approximate)
const WARNING_THRESHOLD = 800; // $800 cap
const CRITICAL_THRESHOLD = 1000; // $1000 hard stop

class TIGuyCostMonitor {
  private metrics: CostMetrics = {
    dailyQueries: 0,
    dailyCost: 0,
    monthlyQueries: 0,
    monthlyCost: 0,
    lastReset: new Date(),
  };

  private alertsSent: Set<string> = new Set();

  constructor() {
    // Reset daily counters at midnight
    this.scheduleDailyReset();
  }

  private scheduleDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.resetDailyCounters();
      this.scheduleDailyReset();
    }, msUntilMidnight);
  }

  private resetDailyCounters() {
    console.log("[TI-GUY Cost] Daily counters reset");
    this.metrics.dailyQueries = 0;
    this.metrics.dailyCost = 0;
    this.alertsSent.clear();
  }

  /**
   * Record a query and check spending
   */
  recordQuery(): { allowed: boolean; warning?: string } {
    // Check hard cap
    if (this.metrics.monthlyCost >= CRITICAL_THRESHOLD) {
      console.error(
        `[TI-GUY Cost] HARD CAP REACHED: $${this.metrics.monthlyCost.toFixed(2)}`,
      );
      return {
        allowed: false,
        warning:
          "TI-GUY désactivé: limite de dépenses atteinte. Contacte l'admin.",
      };
    }

    // Update metrics
    this.metrics.dailyQueries++;
    this.metrics.dailyCost += COST_PER_QUERY;
    this.metrics.monthlyQueries++;
    this.metrics.monthlyCost += COST_PER_QUERY;

    // Check warning threshold
    if (
      this.metrics.monthlyCost >= WARNING_THRESHOLD &&
      !this.alertsSent.has("warning")
    ) {
      this.alertsSent.add("warning");
      this.sendAlert("warning");

      return {
        allowed: true,
        warning: `⚠️ ALERTE: TI-GUY a atteint $${this.metrics.monthlyCost.toFixed(2)} / $${WARNING_THRESHOLD} (${((this.metrics.monthlyCost / WARNING_THRESHOLD) * 100).toFixed(1)}%)`,
      };
    }

    // Check 90% threshold
    const ninetyPercent = WARNING_THRESHOLD * 0.9;
    if (
      this.metrics.monthlyCost >= ninetyPercent &&
      !this.alertsSent.has("ninety")
    ) {
      this.alertsSent.add("ninety");
      this.sendAlert("ninety");
    }

    return { allowed: true };
  }

  /**
   * Send alert to admin
   */
  private async sendAlert(level: "ninety" | "warning" | "critical") {
    const messages = {
      ninety: `TI-GUY at 90% of budget: $${this.metrics.monthlyCost.toFixed(2)}`,
      warning: `🚨 TI-GUY WARNING: $800 cap reached! Current: $${this.metrics.monthlyCost.toFixed(2)}`,
      critical: `🛑 TI-GUY CRITICAL: Hard cap reached! Service disabled.`,
    };

    console.error(`[TI-GUY Cost Alert] ${messages[level]}`);

    let threshold = 0.9;
    if (level === "warning") threshold = 1.0;
    if (level === "critical") threshold = 1.25;

    // Send Slack/email notification
    await sendCostAlert(this.metrics.monthlyCost, WARNING_THRESHOLD, threshold);
  }

  /**
   * Get current spending report
   */
  getReport() {
    return {
      ...this.metrics,
      percentOfCap: (this.metrics.monthlyCost / WARNING_THRESHOLD) * 100,
      remainingBudget: WARNING_THRESHOLD - this.metrics.monthlyCost,
      queriesUntilWarning: Math.floor(
        (WARNING_THRESHOLD - this.metrics.monthlyCost) / COST_PER_QUERY,
      ),
    };
  }

  /**
   * Reset monthly counters (call on 1st of month)
   */
  resetMonthlyCounters() {
    this.metrics.monthlyQueries = 0;
    this.metrics.monthlyCost = 0;
    this.metrics.lastReset = new Date();
    this.alertsSent.clear();
    console.log("[TI-GUY Cost] Monthly counters reset");
  }
}

// Singleton instance
export const costMonitor = new TIGuyCostMonitor();

/**
 * Middleware to check cost before Dialogflow query
 */
export function checkCostLimit(): { allowed: boolean; warning?: string } {
  return costMonitor.recordQuery();
}

/**
 * Get spending dashboard data
 */
export function getSpendingDashboard() {
  const report = costMonitor.getReport();

  return {
    currentSpending: report.monthlyCost.toFixed(2),
    cap: WARNING_THRESHOLD,
    percentUsed: report.percentOfCap.toFixed(1),
    remaining: report.remainingBudget.toFixed(2),
    queriesThisMonth: report.monthlyQueries,
    queriesToday: report.dailyQueries,
    estimatedQueriesLeft: report.queriesUntilWarning,
    status:
      report.monthlyCost >= WARNING_THRESHOLD
        ? "warning"
        : report.percentOfCap >= 90
          ? "caution"
          : "healthy",
  };
}
