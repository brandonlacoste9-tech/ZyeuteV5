import {
  getSwarmBridge,
  MediaAnalysis,
  FilterApplication,
  UserContext,
} from "./swarm-bridge";
import { logger } from "../utils/logger";

// Configuration
const DAILY_BUDGET_LIMIT = 26.67; // $800 / 30 days
const TOTAL_BUDGET_LIMIT = 800.0;

export interface ColonyMetrics {
  totalSpend: number;
  dailySpend: number;
  remainingBudget: number;
  tasksProcessed: number;
}

export interface OrchestrationDecision {
  action: "premium_enhance" | "standard_filter" | "css_preview";
  reason: string;
  estimatedCost: number;
}

class ColonyOSEngine {
  private static instance: ColonyOSEngine;
  private dailySpend: number = 0;
  private totalSpend: number = 0;
  private tasksProcessed: number = 0;
  private lastReset: Date = new Date();

  private constructor() {
    // Load persisted state if we had a DB (mocking strictly for file-based bootstrap)
    this.resetDailyIfNeeded();
  }

  public static getInstance(): ColonyOSEngine {
    if (!ColonyOSEngine.instance) {
      ColonyOSEngine.instance = new ColonyOSEngine();
    }
    return ColonyOSEngine.instance;
  }

  /**
   * Orchestrates the request based on analysis and budget
   */
  async orchestrateMediaRequest(
    imageUrl: string,
    context: UserContext,
  ): Promise<{
    decision: OrchestrationDecision;
    analysis: MediaAnalysis;
    result?: FilterApplication;
  }> {
    this.resetDailyIfNeeded();

    // 1. Analyze Media (Low Cost: ~$0.005)
    const swarm = getSwarmBridge();
    const analysis = await swarm.analyzeMedia(imageUrl, context);

    // Track analysis cost
    this.trackCost(analysis.cost);

    // 2. Make Decision
    const decision = this.makeDecision(analysis);
    logger.info(
      `[ColonyEngine] Decision for ${context.userId}: ${decision.action} (${decision.reason})`,
    );

    let result: FilterApplication | undefined;

    // 3. Execute Decision
    if (decision.action === "premium_enhance") {
      // Check specific budget for this heavy operation
      if (this.canAfford(0.05)) {
        // Reserve buffer
        result = await swarm.applyLuxuryFilter(
          imageUrl,
          analysis.suggestedFilter,
        );
        this.trackCost(result.processingCost);
      } else {
        // Downgrade if we hit limit mid-process
        logger.warn(
          "[ColonyEngine] Budget hit during execution, downgrading to CSS.",
        );
        decision.action = "css_preview";
        decision.reason = "Budget limit hit during execution";
      }
    }

    this.tasksProcessed++;
    return { decision, analysis, result };
  }

  private makeDecision(analysis: MediaAnalysis): OrchestrationDecision {
    // Hard budget stop
    if (this.dailySpend >= DAILY_BUDGET_LIMIT) {
      return {
        action: "css_preview",
        reason: "Daily budget limit reached",
        estimatedCost: 0,
      };
    }

    // Confidence Logic
    // High confidence + High Luxury = Worth the cost
    if (analysis.quebecVibes > 80 && analysis.luxuryFactor > 60) {
      return {
        action: "premium_enhance",
        reason: "High confidence luxury candidate",
        estimatedCost: 0.025,
      };
    }

    // Medium confidence or low luxury
    if (analysis.quebecVibes > 50) {
      return {
        action: "standard_filter", // Maybe lighter Fal model or just CSS
        reason: "Standard Quebec vibes",
        estimatedCost: 0.01, // Assuming lighter model or skipped
      };
    }

    return {
      action: "css_preview",
      reason: "Low confidence match",
      estimatedCost: 0,
    };
  }

  public trackCost(amount: number) {
    this.dailySpend += amount;
    this.totalSpend += amount;

    if (this.dailySpend >= DAILY_BUDGET_LIMIT * 0.8) {
      logger.warn(
        `[ColonyEngine] ⚠️ Daily budget at 80%: $${this.dailySpend.toFixed(2)} / $${DAILY_BUDGET_LIMIT}`,
      );
    }
  }

  private canAfford(amount: number): boolean {
    return (
      this.dailySpend + amount <= DAILY_BUDGET_LIMIT &&
      this.totalSpend + amount <= TOTAL_BUDGET_LIMIT
    );
  }

  private resetDailyIfNeeded() {
    const now = new Date();
    if (now.getDate() !== this.lastReset.getDate()) {
      logger.info(
        `[ColonyEngine] 🔄 Resetting daily budget. Yesterday's spend: $${this.dailySpend.toFixed(2)}`,
      );
      this.dailySpend = 0;
      this.lastReset = now;
    }
  }

  public getDashboard(): ColonyMetrics {
    return {
      totalSpend: parseFloat(this.totalSpend.toFixed(4)),
      dailySpend: parseFloat(this.dailySpend.toFixed(4)),
      remainingBudget: parseFloat(
        (TOTAL_BUDGET_LIMIT - this.totalSpend).toFixed(4),
      ),
      tasksProcessed: this.tasksProcessed,
    };
  }
}

export const getColonyEngine = () => ColonyOSEngine.getInstance();
