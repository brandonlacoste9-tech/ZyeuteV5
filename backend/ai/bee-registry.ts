/**
 * AI Hive - Bee Registry
 * Central registry of all bees
 */

import type {
  BeeDefinition,
  BeeCapability,
  BeeCore,
} from "../../shared/types/ai";

export const BEE_REGISTRY: Record<string, BeeDefinition> = {
  // ======== Ti-Guy Chat (Worker) ========
  "ti-guy-chat": {
    id: "ti-guy-chat",
    name: "Ti-Guy Chat",
    core: "worker",
    capabilities: ["chat"],
    description: "Handles user chat interactions in Quebec joual",
    model: "deepseek",
  },

  // ======== Studio Bees (Workers) ========
  "studio-caption": {
    id: "studio-caption",
    name: "Studio Caption Generator",
    core: "worker",
    capabilities: ["caption"],
    description: "Generates captions for media content",
    model: "deepseek",
  },

  "studio-image": {
    id: "studio-image",
    name: "Studio Image Generator",
    core: "worker",
    capabilities: ["image"],
    description: "Generates images using FAL/Flux",
    model: "flux",
  },

  "studio-video": {
    id: "studio-video",
    name: "Studio Video Generator",
    core: "worker",
    capabilities: ["video"],
    description: "Generates videos using HunyuanVideo",
    model: "hunyuan_video",
  },

  "post-composer": {
    id: "post-composer",
    name: "Post Composer",
    core: "worker",
    capabilities: ["compose"],
    description: "Composes complete posts with media + caption",
    model: "deepseek",
  },

  // ======== Guardian Bees ========
  moderation: {
    id: "moderation",
    name: "Content Moderation",
    core: "guardian",
    capabilities: ["moderation"],
    description: "Review text/media for safety",
    model: "deepseek",
  },

  "media-budget": {
    id: "media-budget",
    name: "Media Budget Tracker",
    core: "guardian",
    capabilities: ["budget"],
    description: "Tracks and enforces media generation costs",
    model: "mistral",
  },

  // ======== Architect Bees ========
  "analytics-summarizer": {
    id: "analytics-summarizer",
    name: "Analytics Summarizer",
    core: "architect",
    capabilities: ["analytics"],
    description: "Summarizes platform metrics",
    model: "deepseek",
  },

  "issue-rewrite": {
    id: "issue-rewrite",
    name: "Issue Rewrite",
    core: "architect",
    capabilities: ["chat"], // Fallback capability or specific 'rewrite' if added
    description: "Rewrites and clarifies issue descriptions",
    model: "deepseek",
  },

  "dream-expansion": {
    id: "dream-expansion",
    name: "Dream Expansion",
    core: "architect",
    capabilities: ["chat"], // Fallback
    description: "Expands vague ideas into full specs",
    model: "deepseek",
  },

  // ======== Python Colony Bees (Existing) ========
  "finance-bee": {
    id: "finance-bee",
    name: "Finance Bee",
    core: "worker",
    capabilities: ["analytics", "budget"],
    description: "Financial analysis and reporting",
    model: "deepseek",
    endpoint: "colony_tasks",
  },

  "health-bee": {
    id: "health-bee",
    name: "Health Bee",
    core: "guardian",
    capabilities: ["analytics"],
    description: "System health monitoring",
    model: "deepseek",
    endpoint: "colony_tasks",
  },

  "security-bee": {
    id: "security-bee",
    name: "Security Bee",
    core: "guardian",
    capabilities: ["moderation"],
    description: "Security and threat monitoring",
    model: "deepseek",
    endpoint: "colony_tasks",
  },

  // ======== Ti-Guy Enhanced Capabilities ========
  "browser-control": {
    id: "browser-control",
    name: "Browser Control Bee",
    core: "worker",
    capabilities: ["browser", "automation", "research"],
    description:
      "Web browser automation - navigate, search, extract, screenshot",
    model: "playwright",
  },

  "image-generator": {
    id: "image-generator",
    name: "Image Generator Bee",
    core: "worker",
    capabilities: ["image", "creative"],
    description: "AI image generation with Quebec cultural awareness",
    model: "flux",
  },

  "web-researcher": {
    id: "web-researcher",
    name: "Web Researcher Bee",
    core: "architect",
    capabilities: ["research", "browser"],
    description:
      "Deep web research with trend analysis and competitor monitoring",
    model: "deepseek",
  },

  "content-creator": {
    id: "content-creator",
    name: "Content Creator Bee",
    core: "worker",
    capabilities: ["creative", "caption", "image"],
    description: "Full content creation pipeline - text, images, and posts",
    model: "deepseek",
  },

  // ======== Video & Media Bees ========
  "video-generator": {
    id: "video-generator",
    name: "Video Generator Bee",
    core: "worker",
    capabilities: ["video", "creative"],
    description: "AI video generation - text-to-video and image-to-video",
    model: "kling",
  },

  "voice-bee": {
    id: "voice-bee",
    name: "Voice Bee",
    core: "worker",
    capabilities: ["voice", "audio"],
    description: "Text-to-speech and speech-to-text with Quebec accent",
    model: "elevenlabs",
  },

  // ======== Quebec Specialist Bees ========
  "hockey-bee": {
    id: "hockey-bee",
    name: "Hockey Bee",
    core: "worker",
    capabilities: ["sports", "info"],
    description: "Canadiens de Montréal expert - stats, games, facts",
    model: "api",
  },

  "weather-bee": {
    id: "weather-bee",
    name: "Weather Bee",
    core: "worker",
    capabilities: ["weather", "info"],
    description: "Quebec weather information and forecasts",
    model: "api",
  },

  "food-bee": {
    id: "food-bee",
    name: "Food Bee",
    core: "worker",
    capabilities: ["food", "recommendations"],
    description: "Quebec food and restaurant recommendations",
    model: "local",
  },

  "culture-bee": {
    id: "culture-bee",
    name: "Culture Bee",
    core: "architect",
    capabilities: ["culture", "info", "entertainment"],
    description: "Quebec festivals, music, expressions, and culture",
    model: "local",
  },
};

/**
 * Get bee definition by ID
 */
export function getBeeById(id: string): BeeDefinition | undefined {
  return BEE_REGISTRY[id];
}

/**
 * Get all bees with a specific capability
 */
export function getBeesByCapability(
  capability: BeeCapability,
): BeeDefinition[] {
  return Object.values(BEE_REGISTRY).filter((bee) =>
    bee.capabilities.includes(capability),
  );
}

/**
 * Get all bees of a specific core type
 */
export function getBeesByCore(core: BeeCore): BeeDefinition[] {
  return Object.values(BEE_REGISTRY).filter((bee) => bee.core === core);
}
