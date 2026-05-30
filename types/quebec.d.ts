/**
 * Quebec-Specific Type Definitions
 */

export interface QuebecTrend {
  title: string;
  description?: string;
  cultural_score: number;
  hashtags?: string[];
  engagement?: string;
  platform?: "google" | "tiktok" | "instagram" | "youtube";
  language?: "french" | "joual" | "english" | "mixed";
  location?: string;
  timestamp?: string;
}

export interface CompetitorAnalysis {
  url: string;
  follower_count?: string;
  engagement_rate?: string;
  posting_frequency?: string;
  primary_language?: "french" | "joual" | "english";
  language_distribution?: {
    french: number;
    english: number;
    joual: number;
  };
  cultural_score: number;
  recent_posts?: Array<{
    title: string;
    engagement: string;
    language: string;
    quebec_elements: string[];
  }>;
  quebec_authenticity?: {
    uses_joual: boolean;
    quebec_locations: string[];
    cultural_references: string[];
    recommended_hashtags: string[];
  };
}

export interface DesignValidation {
  compliant: boolean;
  suggestions: string[];
  quebec_colors: Record<
    string,
    {
      hex: string;
      usage: string;
    }
  >;
  component_type?: "button" | "alert" | "form" | "card" | "navigation";
  example_fix?: string;
}

export interface QuebecRegion {
  name: "montreal" | "quebec-city" | "gatineau" | "sherbrooke" | "all";
  keywords: string[];
  weight: number;
}

export interface CulturalScore {
  overall: number;
  language_score: number;
  location_score: number;
  cultural_references_score: number;
  penalties: number;
}

type JoualExpression = {
  english: string;
  joual: string;
  context: string;
};

type QuebecColor = "quebec-blue" | "snow-white" | "alert-red" | "hydro-yellow";

export interface TiGuyConfig {
  systemPrompt: string;
  tools: Array<{
    name: string;
    description: string;
    parameters: any;
    execute: (...args: any[]) => Promise<any>;
  }>;
  model: string;
  temperature: number;
  maxTokens: number;
}

declare global {
  interface Window {
    quebecConfig?: {
      locale: "fr-CA";
      culturalScoreThreshold: number;
      defaultRegion: QuebecRegion["name"];
    };
  }
}
