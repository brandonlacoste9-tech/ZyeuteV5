/**
 * AI Hive - Bee Registry
 * Central registry of all bees
 */

import type { BeeDefinition, BeeCapability, BeeCore } from "./types";

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

  // ======== BugBot (Guardian) ========
  bugbot: {
    id: "bugbot",
    name: "BugBot",
    core: "guardian",
    capabilities: ["analytics", "moderation"],
    description: "Automated bug detection and reporting",
    model: "deepseek",
  },

  // ======== Windows Automation Bee (Worker) ========
  "windows-automation": {
    id: "windows-automation",
    name: "Windows Automation Bee",
    core: "worker",
    capabilities: ["gui_automation", "system_control", "app_management"],
    description: "GUI automation for Windows applications using Windows-Use",
    model: "gemini",
    pythonServiceUrl: process.env.WINDOWS_USE_BRIDGE_URL || "http://localhost:8001",
  },

  // ======== DevTools Monitor Bee (Guardian) ========
  "devtools-monitor": {
    id: "devtools-monitor",
    name: "DevTools Monitor Bee",
    core: "guardian",
    capabilities: ["performance_monitoring", "network_analysis", "console_inspection"],
    description: "Performance monitoring via Chrome DevTools MCP",
    model: "deepseek",
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
