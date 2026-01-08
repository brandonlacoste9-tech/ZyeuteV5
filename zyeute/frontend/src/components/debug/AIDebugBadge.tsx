/**
 * AI Debug Badge
 * Shows which AI model is being used (dev mode only)
 */

import React from "react";
import { useSettings } from "@/hooks/useSettings";

interface AIDebugBadgeProps {
  metadata?: {
    intendedModel?: string;
    actualModel?: string;
    circuitBreakerIntervened?: boolean;
    primaryProvider?: string;
    providers?: string[];
    consensus?: number;
  };
  className?: string;
}

export const AIDebugBadge: React.FC<AIDebugBadgeProps> = ({ metadata, className = "" }) => {
  const { settings } = useSettings();
  const isDevMode = settings?.devMode || process.env.NODE_ENV === "development";

  if (!isDevMode || !metadata) {
    return null;
  }

  const model = metadata.actualModel || metadata.primaryProvider || metadata.intendedModel || "unknown";
  const intervened = metadata.circuitBreakerIntervened;

  // Map model names to display names
  const modelDisplayNames: Record<string, string> = {
    "gemini-1.5-pro": "Gemini Pro",
    "gemini-2.0-flash": "Gemini Flash",
    "gemini-2.0-flash-exp": "Gemini Flash Exp",
    "gemini-3-pro": "Gemini 3 Pro",
    "deepseek-r1": "DeepSeek R1",
    "deepseek-chat": "DeepSeek",
    "copilot": "Copilot",
    "vertex": "Vertex AI",
    "deepseek": "DeepSeek",
  };

  const displayName = modelDisplayNames[model] || model;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono border ${
        intervened
          ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
          : "bg-green-500/20 border-green-500/50 text-green-400"
      } ${className}`}
      title={
        intervened
          ? `Circuit Breaker intervened: ${metadata.intendedModel} → ${model}`
          : `Using ${model}`
      }
    >
      {intervened ? (
        <>
          <span>⚡</span>
          <span>{displayName}</span>
          <span className="text-yellow-300">(fallback)</span>
        </>
      ) : (
        <>
          <span>🤖</span>
          <span>{displayName}</span>
        </>
      )}
      {metadata.consensus && (
        <span className="text-xs opacity-75">
          ({Math.round(metadata.consensus * 100)}% consensus)
        </span>
      )}
    </div>
  );
};
