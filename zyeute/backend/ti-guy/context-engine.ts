import { SLANG_LEVELS, TOPIC_KEYWORDS, CULTURAL_REFS } from "./knowledge.js";

export interface QuebecContext {
  slangLevel: "jeune" | "adulte" | "formel";
  topics: string[];
  needsCulture: boolean;
  needsTech: boolean;
  detectedKeywords: string[];
}

export class QuebecContextEngine {
  analyze(message: string): QuebecContext {
    const lowerMsg = message.toLowerCase();

    // 1. Detect Topics
    const topics: string[] = [];
    let needsTech = false;
    let needsCulture = false;
    const detectedKeywords: string[] = [];

    // Check Tech
    if (TOPIC_KEYWORDS.tech.some((k) => lowerMsg.includes(k))) {
      topics.push("tech");
      needsTech = true;
    }

    // Check Culture
    if (
      TOPIC_KEYWORDS.culture.some((k) => lowerMsg.includes(k)) ||
      TOPIC_KEYWORDS.food.some((k) => lowerMsg.includes(k)) ||
      TOPIC_KEYWORDS.sports.some((k) => lowerMsg.includes(k))
    ) {
      topics.push("culture");
      needsCulture = true;
    }

    // Check Politics
    if (TOPIC_KEYWORDS.politics.some((k) => lowerMsg.includes(k))) {
      topics.push("politics");
      needsCulture = true; // Politics is culture
    }

    // 2. Detect Slang Level (Heuristic)
    let slangLevel: "jeune" | "adulte" | "formel" = "adulte"; // Default

    // Check for "Jeune" markers
    const jeuneMarkers = [
      "genre",
      "man",
      "bro",
      "full",
      "badtripper",
      "capoté",
      "chill",
    ];
    if (jeuneMarkers.some((marker) => lowerMsg.includes(marker))) {
      slangLevel = "jeune";
    }
    // Check for "Formel" markers if not already identified as Jeune
    else if (
      lowerMsg.includes("vous") ||
      lowerMsg.includes("monsieur") ||
      lowerMsg.includes("madame")
    ) {
      // Very basic heuristic, "vous" is common but usually Ti-Guy uses "tu".
      // If user vouvoie, Ti-Guy might stay polite but still Tu.
      // Let's default to Adulte unless very stiff.
      slangLevel = "formel";
    }

    return {
      slangLevel,
      topics,
      needsCulture,
      needsTech,
      detectedKeywords,
    };
  }
}
