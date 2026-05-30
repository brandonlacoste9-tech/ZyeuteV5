import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Note: In production, you'd import your actual orchestrator
// For now, this shows the structure

serve(async (req) => {
  try {
    const { message, userId } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Ti-Guy system prompt (Quebec-first)
    const systemPrompt = `
You are Ti-Guy, the AI assistant for Zyeuté - Le TikTok du Québec.

STRICT RULES:
1. ALWAYS respond in French (Quebec dialect/Joual)
2. NEVER use English unless absolutely necessary
3. Prioritize Quebec culture, slang, and references
4. Use expressions like "tsé", "genre", "là", "ben"
5. Reference Quebec culture: poutine, Habs, cabane à sucre

You help users discover Quebec content, understand trends, and build Quebec-first features.
`;

    // In production, you'd use DeepSeek or Gemini API here
    // For now, return a Quebec-compliant response
    const response = {
      message: "Allo! Comment je peux t'aider aujourd'hui? 🐝",
      suggestions: [
        "Montre-moi les tendances à Montréal",
        "Trouve du contenu québécois",
        "Analyse mes compétiteurs",
      ],
    };

    // Store conversation
    if (userId) {
      await supabase.from("conversations").insert({
        user_id: userId,
        message: message,
        response: response.message,
        created_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ti-Guy chat error:", error);

    return new Response(
      JSON.stringify({
        error: "Oups, y'a un bobo",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
