/**
 * Smart AI Router
 * Credit-aware AI routing that uses Vertex AI free credits first,
 * then falls back to DeepSeek when credits are exhausted
 */

import { analyzeImageWithGemini } from "./vertex-service.js";
import { analyzeImageWithDeepSeek } from "./deepseek-vision.js";
import { creditManager } from "./credit-manager.js";
import { synapseBridge } from "../colony/synapse-bridge.js";
import type { ImageAnalysisResult } from "./vertex-service.js";

export async function analyzeVideoThumbnail(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ImageAnalysisResult & { _service_used?: string }> {
  // 1. Determine which service to use
  const activeService = await creditManager.getActiveService();
  
  console.log(`🎯 [SmartRouter] Using ${activeService} for video thumbnail analysis`);

  try {
    if (activeService === "vertex") {
      // Use Vertex AI (free credits)
      const result = await analyzeImageWithGemini(imageBase64, mimeType);
      
      // Track usage (estimate: ~$0.001 per analysis)
      creditManager.trackUsage("vertex", 0.001);
      
      // Report to Colony OS
      await synapseBridge.publishEvent("ai.usage", {
        service: "vertex",
        task: "video_metadata",
        cost: 0.001,
        timestamp: new Date().toISOString()
      }).catch(err => console.warn("Failed to report usage to Colony OS:", err));
      
      // Add service indicator for testing/debugging
      return {
        ...result,
        _service_used: "vertex"
      };
    } else {
      // Use DeepSeek (fallback)
      const result = await analyzeImageWithDeepSeek(imageBase64, mimeType);
      
      creditManager.trackUsage("deepseek", 0.0001);
      
      await synapseBridge.publishEvent("ai.usage", {
        service: "deepseek",
        task: "video_metadata",
        cost: 0.0001,
        timestamp: new Date().toISOString()
      }).catch(err => console.warn("Failed to report usage to Colony OS:", err));
      
      // Add service indicator for testing/debugging
      return {
        ...result,
        _service_used: "deepseek"
      };
    }
  } catch (error: any) {
    // Fallback chain: If Vertex fails, try DeepSeek
    if (activeService === "vertex") {
      console.warn("⚠️ [SmartRouter] Vertex AI failed, falling back to DeepSeek");
      try {
        const result = await analyzeImageWithDeepSeek(imageBase64, mimeType);
        creditManager.trackUsage("deepseek", 0.0001);
        
        await synapseBridge.publishEvent("ai.usage", {
          service: "deepseek",
          task: "video_metadata_fallback",
          cost: 0.0001,
          timestamp: new Date().toISOString()
        }).catch(err => console.warn("Failed to report usage to Colony OS:", err));
        
        // Add service indicator for testing/debugging
        return {
          ...result,
          _service_used: "deepseek"
        };
      } catch (deepseekError) {
        console.error("❌ [SmartRouter] Both AI services failed");
        throw deepseekError;
      }
    }
    throw error;
  }
}
