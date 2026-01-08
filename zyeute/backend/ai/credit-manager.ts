/**
 * Credit Manager
 * Tracks Vertex AI credit usage and determines active service (Vertex vs DeepSeek)
 * Integrates with Colony OS Synapse Bridge for credit status queries
 */

import { synapseBridge } from "../colony/synapse-bridge.js";

interface CreditStatus {
  vertexCreditsRemaining: number;
  vertexCreditsUsed: number;
  cutoffThreshold: number;
  activeService: "vertex" | "deepseek";
  lastCheck: Date;
}

class CreditManager {
  private creditStatus: CreditStatus | null = null;
  private creditCacheTTL = 60000; // 1 minute cache
  private cutoffThreshold: number;
  private testOverride: "vertex" | "deepseek" | null = null;

  constructor() {
    this.cutoffThreshold = parseInt(process.env.VERTEX_CREDIT_CUTOFF || "100"); // $1 in cents
  }

  /**
   * Set test override to force a specific service (for testing)
   * @param service - "vertex" | "deepseek" | null to clear override
   */
  setTestOverride(service: "vertex" | "deepseek" | null): void {
    this.testOverride = service;
    // Clear cache to force re-evaluation
    this.creditStatus = null;
  }

  async getActiveService(): Promise<"vertex" | "deepseek"> {
    // 1. Check test override first (highest priority - for testing)
    if (this.testOverride) {
      return this.testOverride;
    }

    // 2. Check env var override (for script-based testing)
    if (process.env.MOCK_CREDIT_STATUS === "low") {
      return "deepseek";
    }
    if (process.env.MOCK_CREDIT_STATUS === "high") {
      return "vertex";
    }

    // 3. Check cache first
    if (
      this.creditStatus &&
      Date.now() - this.creditStatus.lastCheck.getTime() < this.creditCacheTTL
    ) {
      return this.creditStatus.activeService;
    }

    // Query Colony OS for credit status
    try {
      if (synapseBridge.isConnected()) {
        const status = await synapseBridge.requestIntelligence(
          "get_vertex_credit_status"
        );
        this.creditStatus = {
          vertexCreditsRemaining: status.remaining || Infinity,
          vertexCreditsUsed: status.used || 0,
          cutoffThreshold: this.cutoffThreshold,
          activeService:
            status.remaining > this.cutoffThreshold ? "vertex" : "deepseek",
          lastCheck: new Date(),
        };
      } else {
        // If Colony OS unavailable, assume Vertex credits available (use free credits)
        this.creditStatus = {
          vertexCreditsRemaining: Infinity,
          vertexCreditsUsed: 0,
          cutoffThreshold: this.cutoffThreshold,
          activeService: "vertex",
          lastCheck: new Date(),
        };
      }
    } catch (error) {
      console.warn(
        "⚠️ [CreditManager] Could not check credit status, defaulting to Vertex AI"
      );
      // Default to Vertex AI if check fails (use free credits)
      this.creditStatus = {
        vertexCreditsRemaining: Infinity,
        vertexCreditsUsed: 0,
        cutoffThreshold: this.cutoffThreshold,
        activeService: "vertex",
        lastCheck: new Date(),
      };
    }

    return this.creditStatus.activeService;
  }

  trackUsage(service: "vertex" | "deepseek", cost: number): void {
    if (service === "vertex" && this.creditStatus) {
      this.creditStatus.vertexCreditsUsed += cost;
      this.creditStatus.vertexCreditsRemaining -= cost;

      // Report to Colony OS
      synapseBridge
        .publishEvent("ai.usage", {
          service: "vertex",
          cost,
          remaining: this.creditStatus.vertexCreditsRemaining,
        })
        .catch((err) =>
          console.warn("Failed to report usage to Colony OS:", err)
        );
    }
  }

  getStatus(): CreditStatus | null {
    return this.creditStatus;
  }
}

export const creditManager = new CreditManager();
