import { NextRequest, NextResponse } from "next/server";
import { searchTrendsTool } from "@/backend/ai/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TrendsRequest {
  platform?: "google" | "tiktok" | "instagram" | "youtube";
  region?: "montreal" | "quebec-city" | "all";
}

export async function POST(request: NextRequest) {
  try {
    const body: TrendsRequest = await request.json();
    const platform = body.platform || "google";
    const region = body.region || "all";
    const result = await searchTrendsTool.execute({ platform, region });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    const authenticTrends = result.trends.filter(
      (trend) => trend.cultural_score >= 0.7,
    );
    return NextResponse.json({
      success: true,
      platform,
      region,
      trends: authenticTrends,
      total_found: result.trends.length,
      authentic_count: authenticTrends.length,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error("Trends API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Quebec trends" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const result = await searchTrendsTool.execute({
    platform: "tiktok",
    region: "montreal",
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result);
}
