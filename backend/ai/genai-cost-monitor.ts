/**
 * Google GenAI Cost Monitor
 * Tracks Vertex AI / Gemini API usage alongside Dialogflow
 */

import { sendCostAlert } from "../services/alert-service";

// Cost estimates (Vertex AI pricing as of 2024)
const GENAI_COSTS = {
  // Gemini Pro
  "gemini-pro": {
    inputPer1K: 0.0005,   // $0.50 per 1M input tokens
    outputPer1K: 0.0015,  // $1.50 per 1M output tokens
  },
  // Gemini Pro Vision (multimodal)
  "gemini-pro-vision": {
    inputPer1K: 0.0005,
    outputPer1K: 0.0015,
  },
  // Gemini Ultra
  "gemini-ultra": {
    inputPer1K: 0.001,    // $1.00 per 1M input tokens
    outputPer1K: 0.002,   // $2.00 per 1M output tokens
  },
  // Embeddings
  "embedding": {
    per1K: 0.0001,        // $0.10 per 1K tokens
  },
};

// Combined cap with Dialogflow
const TOTAL_GOOGLE_AI_CAP = 1300; // Your total credits
const WARNING_THRESHOLD = 800;    // Shared warning with Dialogflow
const CRITICAL_THRESHOLD = 1200;  // Stop before hitting $1300

interface GenAIUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
}

class GenAICostMonitor {
  private usage: GenAIUsage[] = [];
  private dailyCost = 0;
  private monthlyCost = 0;
  private alertsSent: Set<string> = new Set();

  constructor() {
    this.scheduleDailyReset();
  }

  private scheduleDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    setTimeout(() => {
      this.resetDailyCounters();
      this.scheduleDailyReset();
    }, tomorrow.getTime() - now.getTime());
  }

  private resetDailyCounters() {
    this.dailyCost = 0;
    console.log("[GenAI Cost] Daily counters reset");
  }

  /**
   * Record a GenAI API call
   */
  recordUsage(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): { allowed: boolean; cost: number; warning?: string } {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    
    // Check combined cap with Dialogflow
    const dialogflowCost = this.getDialogflowCost();
    const totalCost = this.monthlyCost + dialogflowCost;

    if (totalCost >= CRITICAL_THRESHOLD) {
      return {
        allowed: false,
        cost: 0,
        warning: "Limite Google AI atteinte. Service temporairement indisponible.",
      };
    }

    // Record usage
    this.usage.push({
      model,
      inputTokens,
      outputTokens,
      cost,
      timestamp: new Date(),
    });

    this.dailyCost += cost;
    this.monthlyCost += cost;

    // Check warning thresholds
    const newTotal = this.monthlyCost + dialogflowCost;
    
    if (newTotal >= WARNING_THRESHOLD && !this.alertsSent.has("warning")) {
      this.alertsSent.add("warning");
      this.sendAlert("warning", newTotal);
      
      return {
        allowed: true,
        cost,
        warning: `⚠️ ALERTE GOOGLE AI: $${newTotal.toFixed(2)} / $${WARNING_THRESHOLD} utilisés`,
      };
    }

    // 90% warning
    const ninetyPercent = WARNING_THRESHOLD * 0.9;
    if (newTotal >= ninetyPercent && !this.alertsSent.has("ninety")) {
      this.alertsSent.add("ninety");
      this.sendAlert("ninety", newTotal);
    }

    return { allowed: true, cost };
  }

  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = GENAI_COSTS[model as keyof typeof GENAI_COSTS];
    
    if (!pricing) {
      // Unknown model - estimate with Gemini Pro rates
      return (inputTokens / 1000) * 0.0005 + (outputTokens / 1000) * 0.0015;
    }

    if ("per1K" in pricing) {
      // Embedding model
      return (inputTokens / 1000) * pricing.per1K;
    }

    // Standard input/output pricing
    const inputCost = (inputTokens / 1000) * pricing.inputPer1K;
    const outputCost = (outputTokens / 1000) * pricing.outputPer1K;
    return inputCost + outputCost;
  }

  private getDialogflowCost(): number {
    // Import from Dialogflow monitor
    try {
      const { costMonitor } = require("./tiguy-cost-monitor");
      return costMonitor.getReport().monthlyCost;
    } catch {
      return 0;
    }
  }

  private async sendAlert(level: string, totalCost: number) {
    const messages: Record<string, string> = {
      ninety: `Google AI at 90%: $${totalCost.toFixed(2)} / $${WARNING_THRESHOLD}`,
      warning: `🚨 GOOGLE AI WARNING: $800 cap reached! Total: $${totalCost.toFixed(2)}`,
      critical: `🛑 GOOGLE AI CRITICAL: Hard cap reached!`,
    };

    console.error(`[GenAI Cost Alert] ${messages[level]}`);
    
    // Send to monitoring/alerting service
    await sendCostAlert(
      level as "ninety" | "warning" | "critical",
      "Google GenAI (Vertex/Gemini)",
      this.monthlyCost,
      WARNING_THRESHOLD,
      {
        byModel: this.getCombinedReport().genAI.byModel,
        dialogflowCost: this.getDialogflowCost(),
        totalCombined: totalCost,
      }
    );
  }

  /**
   * Get combined spending report (Dialogflow + GenAI)
   */
  getCombinedReport() {
    const dialogflowCost = this.getDialogflowCost();
    const genAICost = this.monthlyCost;
    const totalCost = dialogflowCost + genAICost;

    // Breakdown by model
    const byModel: Record<string, { calls: number; cost: number }> = {};
    for (const usage of this.usage) {
      if (!byModel[usage.model]) {
        byModel[usage.model] = { calls: 0, cost: 0 };
      }
      byModel[usage.model].calls++;
      byModel[usage.model].cost += usage.cost;
    }

    return {
      // Combined totals
      totalSpending: totalCost.toFixed(2),
      totalCap: TOTAL_GOOGLE_AI_CAP,
      percentUsed: ((totalCost / TOTAL_GOOGLE_AI_CAP) * 100).toFixed(1),
      remaining: (TOTAL_GOOGLE_AI_CAP - totalCost).toFixed(2),
      
      // Breakdown
      dialogflow: {
        cost: dialogflowCost.toFixed(2),
        percentOfTotal: ((dialogflowCost / totalCost) * 100).toFixed(1),
      },
      genAI: {
        cost: genAICost.toFixed(2),
        percentOfTotal: ((genAICost / totalCost) * 100).toFixed(1),
        byModel,
      },
      
      // Status
      status: totalCost >= WARNING_THRESHOLD 
        ? "warning" 
        : totalCost >= WARNING_THRESHOLD * 0.9
        ? "caution"
        : "healthy",
    };
  }
}

// Singleton
export const genAICostMonitor = new GenAICostMonitor();

/**
 * Wrapper for GenAI API calls with cost tracking
 */
export async function trackGenAIUsage<T>(
  model: string,
  inputTokens: number,
  outputTokens: number,
  apiCall: () => Promise<T>
): Promise<{ result: T | null; cost: number; warning?: string }> {
  const check = genAICostMonitor.recordUsage(model, inputTokens, outputTokens);
  
  if (!check.allowed) {
    return { result: null, cost: 0, warning: check.warning };
  }

  try {
    const result = await apiCall();
    return { result, cost: check.cost, warning: check.warning };
  } catch (err) {
    throw err;
  }
}

/**
 * Get full Google AI spending dashboard
 */
export function getFullGoogleAIDashboard() {
  return genAICostMonitor.getCombinedReport();
}
