/**
 * 🧠 THE BRAIN - Ti-Guy Orchestrator
 * Integrates Browser-Use (Hands) + UI/UX System (Soul) for Zyeuté
 * Uses Gemini/DeepSeek for cost-effective AI
 */

import { z } from "zod";

// ============================================================================
// 🎨 THE SOUL - Design System Enforcer
// ============================================================================

interface JoualRule {
  english: string;
  joual: string;
  context: string;
}

const JOUAL_TRANSLATIONS: JoualRule[] = [
  { english: "loading", joual: "Ça charge...", context: "Loading states" },
  { english: "submit", joual: "Envoyer", context: "Form submission" },
  { english: "send", joual: "Grouille-toi", context: "Urgent submission" },
  {
    english: "delete",
    joual: "Sacrer ça aux vidanges",
    context: "Destructive action",
  },
  { english: "remove", joual: "Sacrer dehors", context: "Destructive action" },
  {
    english: "add friend",
    joual: "Ajouter aux chums",
    context: "Social connection",
  },
  { english: "friend", joual: "chum", context: "Social reference" },
  { english: "error", joual: "Oups, y'a un bobo", context: "Error message" },
  { english: "cancel", joual: "Annuler", context: "Cancel action" },
  { english: "save", joual: "Sauvegarder", context: "Save action" },
  { english: "yes", joual: "Oui", context: "Confirmation" },
  { english: "no", joual: "Non", context: "Denial" },
];

const QUEBEC_COLORS = {
  "quebec-blue": { hex: "#003399", usage: "Primary buttons, main CTAs" },
  "snow-white": { hex: "#F8F9FA", usage: "Backgrounds, cards" },
  "alert-red": { hex: "#DC3545", usage: "Destructive actions, errors" },
  "hydro-yellow": { hex: "#FFCC00", usage: "Highlights, notifications" },
};

class DesignSystemValidator {
  validateUI(componentCode: string): {
    compliant: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    const codeLower = componentCode.toLowerCase();

    // Check for English UI text
    for (const rule of JOUAL_TRANSLATIONS) {
      if (codeLower.includes(rule.english)) {
        suggestions.push(
          `❌ Replace "${rule.english}" with "${rule.joual}" (${rule.context})`,
        );
      }
    }

    // Check for non-Quebec colors
    if (
      codeLower.includes("bg-blue-500") &&
      !codeLower.includes("bg-zyeute-blue")
    ) {
      suggestions.push("❌ Use bg-zyeute-blue instead of generic blue");
    }

    return {
      compliant: suggestions.length === 0,
      suggestions,
    };
  }

  getColorGuidance(): typeof QUEBEC_COLORS {
    return QUEBEC_COLORS;
  }
}

// ============================================================================
// 🤲 THE HANDS - Browser Automation Tools
// ============================================================================

const BROWSER_SERVICE_URL =
  process.env.BROWSER_SERVICE_URL || "http://localhost:8000";

export const searchTrendsTool = {
  name: "search_trends",
  description:
    "Uses browser automation to find trending topics in Quebec. Returns culturally-relevant content with cultural scores.",
  parameters: z.object({
    platform: z
      .enum(["google", "tiktok", "instagram", "youtube"])
      .default("google"),
    region: z.enum(["montreal", "quebec-city", "all"]).optional(),
  }),
  execute: async ({ platform, region = "all" }) => {
    console.log(
      `🕵️ Searching Quebec trends on ${platform} (region: ${region})`,
    );
    try {
      const response = await fetch(
        `${BROWSER_SERVICE_URL}/api/v1/research/trends`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, region }),
        },
      );
      if (!response.ok) {
        throw new Error(`Browser service error: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        success: true,
        platform,
        region,
        trends: data.trends || [],
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error("❌ Trend discovery failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const analyzeCompetitorTool = {
  name: "analyze_competitor",
  description:
    "Analyzes a competitor's social media with Quebec cultural context. Returns follower count, engagement, language, and cultural authenticity score.",
  parameters: z.object({
    url: z.string().url(),
    metrics: z
      .array(z.enum(["followers", "engagement", "language", "cultural_score"]))
      .optional(),
  }),
  execute: async ({
    url,
    metrics = ["followers", "engagement", "language", "cultural_score"],
  }) => {
    console.log(`📊 Analyzing competitor: ${url}`);
    try {
      const response = await fetch(
        `${BROWSER_SERVICE_URL}/api/v1/research/competitor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, metrics }),
        },
      );
      if (!response.ok) {
        throw new Error(`Browser service error: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        success: true,
        url,
        analysis: data.analysis || {},
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error("❌ Competitor analysis failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const validateDesignTool = {
  name: "validate_design",
  description:
    "Validates UI code against Zyeuté design system (Quebec Blue branding + Joual localization). Returns compliance status and suggestions.",
  parameters: z.object({
    component_code: z.string(),
    component_type: z
      .enum(["button", "alert", "form", "card", "navigation"])
      .optional(),
  }),
  execute: async ({ component_code, component_type }) => {
    console.log(
      `🎨 Validating design: ${component_type || "unknown component"}`,
    );
    const validator = new DesignSystemValidator();
    const validation = validator.validateUI(component_code);
    const colors = validator.getColorGuidance();
    return {
      compliant: validation.compliant,
      suggestions: validation.suggestions,
      component_type,
      quebec_colors: colors,
      example_fix:
        validation.suggestions.length > 0
          ? `// Replace English text with Joual equivalents\n${validation.suggestions[0]}`
          : "✅ Code is compliant with Quebec design system",
    };
  },
};

// ============================================================================
// 🧠 TI-GUY SYSTEM PROMPT
// ============================================================================

export const TIGUY_SYSTEM_PROMPT = `
You are Ti-Guy, the AI architect for Zyeuté - Le TikTok du Québec.

🇨🇦 YOUR MISSION:
Build Quebec's premier social network that celebrates Quebec culture, language, and digital sovereignty.

🎯 STRICT RULES - ALWAYS FOLLOW:

1. 🎨 DESIGN SYSTEM (The Soul):
   BEFORE writing ANY frontend code, you MUST call "validate_design" tool.
   
   NEVER use English UI text - ALWAYS use Joual/Quebec French:
   ❌ "Loading..." → ✅ "Ça charge..."
   ❌ "Submit" → ✅ "Envoyer" or "Grouille-toi"
   ❌ "Delete" → ✅ "Sacrer ça aux vidanges"
   ❌ "Add Friend" → ✅ "Ajouter aux chums"
   ❌ "Error" → ✅ "Oups, y'a un bobo"
   
   ALWAYS use Quebec Blue (#003399 / bg-zyeute-blue) for primary actions.
   
   Color hierarchy:
   * Primary: Quebec Blue (bg-zyeute-blue) - #003399
   * Background: Snow White (bg-zyeute-snow) - #F8F9FA
   * Destructive: Alert Red (bg-zyeute-alert) - #DC3545
   * Highlight: Hydro Yellow (bg-zyeute-hydro) - #FFCC00

2. 🤲 RESEARCH (The Hands):
   When you need Quebec market data, use "search_trends" tool.
   When analyzing competitors, use "analyze_competitor" tool.
   
   Focus on: Montreal, Quebec City, Gatineau, Sherbrooke
   Culture: Poutine, Hockey (Habs), Quebec Music, Joual slang

3. 🛠️ TECH STACK:
   - Frontend: Next.js 14+ with App Router
   - Styling: Tailwind CSS (use zyeute- prefixed colors)
   - Backend: Supabase (PostgreSQL + Edge Functions)
   - AI: DeepSeek V3 (cost-effective) or Gemini 2.0 Flash (free tier)

4. 🐝 QUEBEC-FIRST DEVELOPMENT:
   - Default language: French (Quebec dialect/Joual)
   - Think Quebec culture, not Silicon Valley
   - Privacy: Quebec data sovereignty
   - Community: "les chums", not "users"

5. 🧪 VALIDATION WORKFLOW:
   Step 1: Write UI code
   Step 2: Call validate_design tool
   Step 3: If compliant: false, fix issues
   Step 4: Re‑validate until compliant: true
   Step 5: Only then proceed

AVAILABLE TOOLS:
- search_trends: Find what's trending in Quebec right now
- analyze_competitor: Study Quebec social platforms
- validate_design: Ensure Quebec Blue + Joual compliance

EXAMPLES:

Example 1: Creating a button
Ti‑Guy: "I'll create a submit button"
[calls validate_design with: <Button>Submit</Button>]
Result: ❌ Non‑compliant - "Submit" is English
Ti‑Guy: "I'll fix it"
[creates: <Button className="bg-zyeute-blue">Envoyer</Button>]
[calls validate_design again]
Result: ✅ Compliant!

Example 2: Discovering trends
User: "What's trending in Quebec today?"
Ti‑Guy: [calls search_trends with platform: "google", region: "all"]
Result: Returns top 5 Quebec trends with cultural scores
Ti‑Guy: Shares trends with user

Remember: You're building Quebec's digital sovereignty! 🐝⚡
`;

// ============================================================================
// 🚀 EXPORT CONFIGURATION
// ============================================================================

export const zyeuteBrainTools = [
  searchTrendsTool,
  analyzeCompetitorTool,
  validateDesignTool,
];

export const zyeuteBrainConfig = {
  systemPrompt: TIGUY_SYSTEM_PROMPT,
  tools: zyeuteBrainTools,
  model: process.env.AI_MODEL || "deepseek-chat", // DeepSeek V3 or "gemini-2.0-flash"
  temperature: 0.7,
  maxTokens: 4096,
};

// Initialize on import
console.log("✅ Zyeuté Trinity Brain initialized:");
console.log("   🧠 Brain: Ti‑Guy orchestrator ready");
console.log("   🤲 Hands: Browser tools loaded");
console.log("   🎨 Soul: Design validator ready");
console.log(`   🤖 AI Model: ${zyeuteBrainConfig.model}`);

export default zyeuteBrainConfig;
