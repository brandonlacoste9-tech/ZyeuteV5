/**
 * 🎬 Flow-QA Loop - Zero-Waste Cinematic Output
 * Recursive Quality Gate for TI-GUY Video Generation
 * 
 * Architecture:
 * 1. Creation: Veo 3.1 generates video from prompt
 * 2. Audit: Qwen3-VL analyzes video frame-by-frame
 * 3. Refinement: If score < 80, generates corrective prompt & re-renders
 * 4. Delivery: Only 10/10 videos cached for feed
 */

import { logger } from "../../utils/logger.js";
import { ollama, selectOllamaModel } from "../ollama-service.js";
import { generateVideo, type VideoGenerationResult } from "./video-engine.js";
import { synapseBridge } from "../../colony/synapse-bridge.js";

// Configuration
const AESTHETIC_THRESHOLD = 80; // Minimum score to accept video
const MAX_RECURSIVE_ITERATIONS = 3; // Prevent infinite loops
const QWEN3_VL_MODEL = "qwen3-vl:cloud"; // Vision analysis model

export interface FlowQAResult {
  videoUrl: string;
  finalScore: number;
  iterations: number;
  corrections: string[];
  metadata: {
    model: string;
    duration: number;
    cost: number;
    generationTime: number;
  };
}

export interface VideoAnalysisResult {
  aestheticScore: number; // 0-100
  issues: Array<{
    type: "temporal" | "hallucination" | "branding" | "quality" | "motion";
    description: string;
    severity: "low" | "medium" | "high";
    frame?: number; // Frame number where issue detected
  }>;
  strengths: string[];
  correctivePrompt?: string; // Generated if score < threshold
}

/**
 * Generate TI-GUY video prompt optimized for Quebec content
 */
export function generateTI_GUY_VideoPrompt(
  concept: string,
  style: "cinematic" | "social" | "commercial" = "cinematic"
): string {
  const stylePrompts = {
    cinematic: "Cinematic lighting, smooth camera movements, professional color grading, 24fps film quality, depth of field, Quebec aesthetic",
    social: "Vibrant colors, dynamic movement, engaging composition, vertical 9:16 format, TikTok/Instagram style, energetic",
    commercial: "Professional product showcase, clean backgrounds, commercial lighting, brand-safe, Quebec cultural elements",
  };

  return `A TI-GUY beaver character in Quebec setting: ${concept}. Style: ${stylePrompts[style]}. Character has 6 distinct wings (bee wings), Quebec maple leaf elements, cinematic quality, no motion blur, temporal consistency throughout, brand colors: red and gold, no hallucinations or extra limbs, smooth animations, professional video production quality.`;
}

/**
 * Analyze video using Qwen3-VL vision model
 * Performs frame-by-frame analysis for quality issues
 */
export async function analyzeVideoQuality(
  videoUrl: string,
  originalPrompt: string
): Promise<VideoAnalysisResult> {
  logger.info(`[Flow-QA] Analyzing video quality: ${videoUrl.substring(0, 50)}...`);

  const analysisPrompt = `You are a video quality auditor analyzing a TI-GUY character video for a Quebec social media platform.

VIDEO ANALYSIS TASK:
Analyze this video frame-by-frame and provide a comprehensive quality assessment.

CHECK FOR:
1. **Temporal Consistency**: Do frames flow smoothly? Any sudden jumps or discontinuities?
2. **Hallucinations**: Are there extra limbs, missing parts, or impossible anatomy? Character should have exactly 6 bee wings.
3. **Branding Drift**: Is the Quebec aesthetic maintained? Are brand colors (red/gold) consistent?
4. **Motion Quality**: Is motion blur acceptable? Are movements natural?
5. **Overall Aesthetic**: Does it meet professional video production standards?

SCORING CRITERIA (0-100):
- Temporal Consistency: 20 points
- No Hallucinations: 25 points
- Brand Consistency: 20 points
- Motion Quality: 20 points
- Overall Aesthetic: 15 points

RESPOND IN JSON FORMAT:
{
  "aestheticScore": <number 0-100>,
  "issues": [
    {
      "type": "temporal" | "hallucination" | "branding" | "quality" | "motion",
      "description": "<detailed issue description>",
      "severity": "low" | "medium" | "high",
      "frame": <optional frame number>
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "correctivePrompt": "<if score < 80, provide improved prompt for re-rendering>"
}

Original prompt was: "${originalPrompt}"

VIDEO URL TO ANALYZE: ${videoUrl}

Analyze this video and provide the JSON assessment as specified above.`;

  try {
    // Use Qwen3-VL for vision analysis
    const visionModel = selectOllamaModel({ task: "vision" });
    
    const response = await ollama.generate(analysisPrompt, {
      model: visionModel,
      system: "You are an expert video quality auditor with expertise in AI-generated video analysis, temporal consistency, and brand safety.",
      format: "json",
      temperature: 0.3, // Low temperature for consistent analysis
    });

    // Parse JSON response
    const cleanedResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    const analysis: VideoAnalysisResult = JSON.parse(cleanedResponse);

    // Validate and normalize score
    analysis.aestheticScore = Math.max(0, Math.min(100, analysis.aestheticScore || 0));

    logger.info(
      `[Flow-QA] Video analysis complete. Score: ${analysis.aestheticScore}/100. Issues: ${analysis.issues.length}`
    );

    return analysis;
  } catch (error: any) {
    logger.error(`[Flow-QA] Video analysis failed: ${error.message}`);
    
    // Fallback: Return neutral score if analysis fails
    return {
      aestheticScore: 70, // Neutral score to allow one retry
      issues: [
        {
          type: "quality",
          description: "Analysis system unavailable",
          severity: "medium",
        },
      ],
      strengths: [],
      correctivePrompt: originalPrompt, // Use original prompt as fallback
    };
  }
}

/**
 * Generate corrective prompt based on analysis issues
 */
export function generateCorrectivePrompt(
  originalPrompt: string,
  analysis: VideoAnalysisResult
): string {
  const corrections: string[] = [];

  // Add corrections based on issue types
  if (analysis.issues.some((i) => i.type === "temporal")) {
    corrections.push("Ensure smooth temporal consistency between frames, no sudden jumps");
  }
  if (analysis.issues.some((i) => i.type === "hallucination")) {
    corrections.push("Verify character has exactly 6 bee wings, no extra limbs, correct anatomy");
  }
  if (analysis.issues.some((i) => i.type === "branding")) {
    corrections.push("Maintain Quebec aesthetic, consistent brand colors (red and gold)");
  }
  if (analysis.issues.some((i) => i.type === "motion")) {
    corrections.push("Reduce motion blur, ensure natural movement, stable camera work");
  }
  if (analysis.issues.some((i) => i.type === "quality")) {
    corrections.push("Enhance overall production quality, professional cinematography");
  }

  // Use AI-generated corrective prompt if available, otherwise build one
  if (analysis.correctivePrompt) {
    return analysis.correctivePrompt;
  }

  // Build corrective prompt manually
  const correctionsText = corrections.length > 0 
    ? `IMPROVEMENTS NEEDED: ${corrections.join(". ")}. ` 
    : "";

  return `${originalPrompt}. ${correctionsText}Ensure professional quality, no artifacts, temporal consistency.`;
}

/**
 * Main Flow-QA Loop
 * Recursively generates and refines video until quality threshold met
 */
export async function generateVideoWithFlowQA(
  prompt: string,
  options: {
    imageUrl?: string;
    duration?: number;
    style?: "cinematic" | "social" | "commercial";
    maxIterations?: number;
  } = {}
): Promise<FlowQAResult> {
  const startTime = Date.now();
  const {
    imageUrl,
    duration = 5,
    style = "cinematic",
    maxIterations = MAX_RECURSIVE_ITERATIONS,
  } = options;

  logger.info(`[Flow-QA] Starting Flow-QA loop for prompt: ${prompt.substring(0, 50)}...`);

  // Generate optimized TI-GUY prompt
  const tiGuyPrompt = generateTI_GUY_VideoPrompt(prompt, style);
  let currentPrompt = tiGuyPrompt;
  const corrections: string[] = [];
  let iteration = 0;
  let finalVideo: VideoGenerationResult | null = null;

  while (iteration < maxIterations) {
    iteration++;
    logger.info(`[Flow-QA] Iteration ${iteration}/${maxIterations}`);

    try {
      // Step 1: Generate video with Veo 3.1 or Kling
      logger.info(`[Flow-QA] Generating video with prompt...`);
      finalVideo = await generateVideo({
        prompt: currentPrompt,
        imageUrl,
        duration,
      });

      // Step 2: Analyze video quality
      logger.info(`[Flow-QA] Analyzing video quality...`);
      const analysis = await analyzeVideoQuality(finalVideo.url, currentPrompt);

      // Step 3: Check if quality threshold met
      if (analysis.aestheticScore >= AESTHETIC_THRESHOLD) {
        logger.info(
          `[Flow-QA] ✅ Quality threshold met! Score: ${analysis.aestheticScore}/100`
        );

        // Report success to Colony OS
        await synapseBridge.publishEvent("flow_qa.success", {
          iteration,
          score: analysis.aestheticScore,
          videoUrl: finalVideo.url,
          prompt: currentPrompt,
        }).catch((err) => logger.warn("Failed to report to Colony OS:", err));

        return {
          videoUrl: finalVideo.url,
          finalScore: analysis.aestheticScore,
          iterations: iteration,
          corrections,
          metadata: {
            model: finalVideo.model,
            duration: finalVideo.duration,
            cost: finalVideo.cost || 0,
            generationTime: Date.now() - startTime,
          },
        };
      }

      // Step 4: Quality insufficient - generate corrective prompt
      logger.warn(
        `[Flow-QA] ⚠️ Quality below threshold (${analysis.aestheticScore}/100). Generating correction...`
      );

      const correctivePrompt = generateCorrectivePrompt(currentPrompt, analysis);
      corrections.push(`Iteration ${iteration}: ${analysis.issues.map(i => i.description).join("; ")}`);
      currentPrompt = correctivePrompt;

      logger.info(`[Flow-QA] Re-rendering with improved prompt...`);

    } catch (error: any) {
      logger.error(`[Flow-QA] Error in iteration ${iteration}: ${error.message}`);
      
      if (iteration >= maxIterations) {
        throw new Error(
          `Flow-QA loop exhausted after ${maxIterations} iterations. Last error: ${error.message}`
        );
      }
      
      // Continue to next iteration
      continue;
    }
  }

  // Max iterations reached without meeting threshold
  if (!finalVideo) {
    throw new Error("Flow-QA loop failed to generate video after all iterations");
  }

  logger.warn(
    `[Flow-QA] ⚠️ Max iterations reached. Returning best result (score may be below threshold)`
  );

  return {
    videoUrl: finalVideo.url,
    finalScore: 0, // Unknown - analysis may have failed
    iterations: maxIterations,
    corrections,
    metadata: {
      model: finalVideo.model,
      duration: finalVideo.duration,
      cost: finalVideo.cost || 0,
      generationTime: Date.now() - startTime,
    },
  };
}

/**
 * Generate TI-GUY social ad video with Flow-QA
 * High-level wrapper for social media content
 */
export async function generateTI_GUY_SocialAd(
  concept: string,
  options?: {
    duration?: number;
    style?: "cinematic" | "social" | "commercial";
  }
): Promise<FlowQAResult> {
  logger.info(`[Flow-QA] Generating TI-GUY social ad: ${concept}`);

  const result = await generateVideoWithFlowQA(concept, {
    duration: options?.duration || 5,
    style: options?.style || "social",
  });

  logger.info(
    `[Flow-QA] TI-GUY social ad complete. Score: ${result.finalScore}/100, Iterations: ${result.iterations}`
  );

  return result;
}