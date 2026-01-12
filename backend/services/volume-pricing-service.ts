import { storage } from "../storage.js";
import { logger } from "../utils/logger.js";

const pricingLogger = logger.withContext("VolumePricing");

/**
 * VOLUME-BASED PRICING TIERS
 * As more people upload, costs decrease for everyone (economies of scale)
 */
const PRICING_TIERS = [
  { minUploads: 0, maxUploads: 100, discountPercent: 0, tier: 1 }, // 0% discount (startup)
  { minUploads: 101, maxUploads: 1000, discountPercent: 10, tier: 2 }, // 10% discount (growth)
  { minUploads: 1001, maxUploads: 10000, discountPercent: 20, tier: 3 }, // 20% discount (scale)
  { minUploads: 10001, maxUploads: 100000, discountPercent: 30, tier: 4 }, // 30% discount (viral)
  { minUploads: 100001, maxUploads: Infinity, discountPercent: 40, tier: 5 }, // 40% discount (dominant)
];

// Base costs (per unit)
const BASE_COSTS = {
  video: 0.1, // $0.10 per 5s video (FAL.ai Kling)
  image: 0.03, // $0.03 per image (Vertex AI Imagen)
  regenerate: 0.1, // Same as video
};

export class VolumePricingService {
  /**
   * Get current pricing tier based on monthly upload volume
   */
  async getCurrentTier(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const uploadCount = await storage.getPostCount({
      startDate: startOfMonth,
      where: { aiGenerated: true },
    });

    const tier =
      PRICING_TIERS.find(
        (t) => uploadCount >= t.minUploads && uploadCount <= t.maxUploads,
      ) || PRICING_TIERS[0];

    pricingLogger.info(
      `Current tier: ${tier.tier} (${uploadCount} uploads this month, ${tier.discountPercent}% discount)`,
    );

    return tier.tier;
  }

  /**
   * Calculate cost with volume discount applied
   */
  async calculateCost(operation: "video" | "image" | "regenerate"): Promise<{
    baseCost: number;
    finalCost: number;
    discountPercent: number;
    tier: number;
  }> {
    const tier = await this.getCurrentTier();
    const tierData = PRICING_TIERS[tier - 1];
    const baseCost = BASE_COSTS[operation];

    const discountAmount = baseCost * (tierData.discountPercent / 100);
    const finalCost = baseCost - discountAmount;

    return {
      baseCost,
      finalCost: Math.round(finalCost * 100) / 100, // Round to 2 decimals
      discountPercent: tierData.discountPercent,
      tier: tierData.tier,
    };
  }

  /**
   * Track cost for an AI generation
   */
  async trackCost(params: {
    userId: string;
    postId: string;
    service: "fal" | "vertex" | "groq";
    operation: "video" | "image" | "regenerate";
  }): Promise<void> {
    const pricing = await this.calculateCost(params.operation);

    await storage.createAIGenerationCost({
      userId: params.userId,
      postId: params.postId,
      service: params.service,
      operation: params.operation,
      baseCost: pricing.baseCost,
      finalCost: pricing.finalCost,
      volumeTier: pricing.tier,
      discountPercent: pricing.discountPercent,
    });

    pricingLogger.info(
      `Tracked ${params.operation} cost: $${pricing.finalCost} (tier ${pricing.tier}, ${pricing.discountPercent}% off)`,
    );
  }

  /**
   * Get monthly cost summary
   */
  async getMonthlyCostSummary(): Promise<{
    totalCost: number;
    totalSavings: number;
    uploadCount: number;
    currentTier: number;
    nextTierThreshold: number;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const costs = await storage.getAIGenerationCosts({
      startDate: startOfMonth,
    });

    const totalCost = costs.reduce((sum: number, c: any) => sum + Number(c.finalCost), 0);
    const totalSavings = costs.reduce(
      (sum: number, c: any) => sum + (Number(c.baseCost) - Number(c.finalCost)),
      0,
    );
    const uploadCount = costs.length;
    const currentTier = await this.getCurrentTier();
    const nextTier = PRICING_TIERS.find((t) => t.tier === currentTier + 1);
    const nextTierThreshold = nextTier?.minUploads || 0;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      uploadCount,
      currentTier,
      nextTierThreshold,
    };
  }
}

export const volumePricingService = new VolumePricingService();
