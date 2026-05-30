import { NextRequest, NextResponse } from "next/server";
import { validateDesignTool } from "@/backend/ai/orchestrator";

export const runtime = "nodejs";

interface ValidationRequest {
  component_code: string;
  component_type?: "button" | "alert" | "form" | "card" | "navigation";
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    if (!body.component_code) {
      return NextResponse.json(
        { error: "component_code is required" },
        { status: 400 },
      );
    }
    const validation = await validateDesignTool.execute({
      component_code: body.component_code,
      component_type: body.component_type,
    });
    return NextResponse.json({
      compliant: validation.compliant,
      suggestions: validation.suggestions,
      quebec_colors: validation.quebec_colors,
      component_type: validation.component_type,
    });
  } catch (error) {
    console.error("Validation API error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
