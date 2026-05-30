/**
 * useTrends Hook
 * Fetch and manage Quebec trending content
 */

"use client";

import { useState, useEffect } from "react";

interface Trend {
  title: string;
  description?: string;
  cultural_score: number;
  hashtags?: string[];
  engagement?: string;
  platform?: string;
}

interface UseTrendsOptions {
  platform?: "google" | "tiktok" | "instagram" | "youtube";
  region?: "montreal" | "quebec-city" | "all";
  minCulturalScore?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useTrends(options: UseTrendsOptions = {}) {
  const {
    platform = "tiktok",
    region = "montreal",
    minCulturalScore = 0.7,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
  } = options;

  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, region }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch trends");
      }

      const data = await response.json();

      if (data.success) {
        const filteredTrends = data.trends.filter(
          (t: Trend) => t.cultural_score >= minCulturalScore,
        );
        setTrends(filteredTrends);
      } else {
        setError(data.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();

    if (autoRefresh) {
      const interval = setInterval(fetchTrends, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [platform, region, minCulturalScore, autoRefresh, refreshInterval]);

  return {
    trends,
    loading,
    error,
    refresh: fetchTrends,
    loadingText: "Ça charge...",
  };
}
