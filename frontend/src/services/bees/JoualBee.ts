/**
 * 🗣️ JoualBee - Quebec French Language Specialist
 *
 * The cultural heart of Zyeuté's AI! JoualBee:
 * - Understands and generates authentic Joual (Quebec French slang)
 * - Handles regional variations (Montreal vs Quebec City vs regions)
 * - Provides culturally-aware content moderation
 * - Generates Quebec-style captions and hashtags
 *
 * This is Day 10 target from the strategic roadmap.
 */

import { BeeType, BeeAgent, SwarmResponse } from "@/zyeute-colony-bridge/types";

// ═══════════════════════════════════════════════════════════════
// JOUAL DICTIONARY - Core vocabulary patterns
// ═══════════════════════════════════════════════════════════════

export const JOUAL_EXPRESSIONS = {
  // Greetings
  greetings: {
    formal: ["Bonjour", "Bonsoir"],
    casual: ["Salut", "Allo", "Heille", "Yo"],
    joual: ["Heille toé!", "Ça roule?", "Pis, quoi de neuf?"],
  },

  // Affirmations
  affirmations: {
    standard: ["Oui", "D'accord", "Bien sûr"],
    joual: [
      "Ouin",
      "Ouais",
      "Tiguidou",
      "C'est ça",
      "En plein ça",
      "Exact",
      "Correct",
    ],
  },

  // Negations
  negations: {
    standard: ["Non", "Pas du tout"],
    joual: ["Pantoute", "Pas une miette", "Nenon", "Ben non"],
  },

  // Exclamations
  exclamations: {
    mild: ["Voyons!", "Ben là!", "Coudonc!", "Heille!", "Wo!"],
    intense: ["Tabarnak!", "Criss!", "Esti!", "Câlisse!", "Maudit!"],
    positive: ["Malade!", "Sick!", "Nice!", "Solide!", "Débile!"],
  },

  // Intensifiers
  intensifiers: [
    "en esti",
    "en tabarnak",
    "en criss",
    "solide",
    "raide",
    "ben",
    "full",
  ],

  // Common phrases
  phrases: {
    "ça marche": "That works / OK",
    "ça fit": "That fits / That works",
    "lâche pas": "Don't give up",
    "c'est tiguidou": "It's all good",
    "c'est correct": "It's fine",
    "j'capote": "I'm freaking out (excited)",
    "c'est malade": "It's awesome",
    "check ça": "Check this out",
    "arrête donc": "Come on / Stop it",
  },
};

// ═══════════════════════════════════════════════════════════════
// REGIONAL VARIATIONS
// ═══════════════════════════════════════════════════════════════

export type QuebecRegion =
  | "montreal"
  | "quebec_city"
  | "gaspesie"
  | "saguenay"
  | "outaouais"
  | "estrie";

export const REGIONAL_EXPRESSIONS: Record<QuebecRegion, string[]> = {
  montreal: [
    "514",
    "MTL",
    "le Plateau",
    "le Mile End",
    "Hochelaga",
    "Villeray",
    "Rosemont",
  ],
  quebec_city: [
    "418",
    "QC",
    "Vieux-Québec",
    "Limoilou",
    "Saint-Roch",
    "Château Frontenac",
  ],
  gaspesie: ["la Gaspésie", "Percé", "Carleton", "le Rocher", "la mer"],
  saguenay: ["le Sag", "Chicoutimi", "le Lac", "le fjord"],
  outaouais: ["Gatineau", "Hull", "la frontière"],
  estrie: ["les Cantons", "Sherbrooke", "Magog", "le Lac Memphrémagog"],
};

// ═══════════════════════════════════════════════════════════════
// PATTERN MATCHERS
// ═══════════════════════════════════════════════════════════════

interface JoualMatch {
  matched: boolean;
  category: string;
  intensity: "mild" | "moderate" | "strong";
  suggestion?: string;
}

/**
 * Detects if text contains Joual expressions and categorizes them
 */
export function detectJoual(text: string): JoualMatch {
  const lower = text.toLowerCase();

  // Check for intense sacres (Quebec swear words)
  const intensePatterns = /tabarnak|câlisse|criss|esti|maudit/i;
  if (intensePatterns.test(lower)) {
    return {
      matched: true,
      category: "sacre",
      intensity: "strong",
      suggestion:
        "Authentic Joual detected - culturally appropriate for Quebec audience",
    };
  }

  // Check for common Joual expressions
  const joualPatterns = /tiguidou|pantoute|coudonc|heille|ouin|icitte|toé|moé/i;
  if (joualPatterns.test(lower)) {
    return {
      matched: true,
      category: "expression",
      intensity: "moderate",
      suggestion: "Classic Joual expression - très québécois!",
    };
  }

  // Check for mild Quebec French markers
  const mildPatterns = /ben là|voyons|correct|ça fit|lâche pas/i;
  if (mildPatterns.test(lower)) {
    return {
      matched: true,
      category: "casual",
      intensity: "mild",
      suggestion: "Quebec French detected",
    };
  }

  return {
    matched: false,
    category: "standard",
    intensity: "mild",
  };
}

/**
 * Detects region from text content
 */
export function detectRegion(text: string): QuebecRegion | null {
  const lower = text.toLowerCase();

  for (const [region, markers] of Object.entries(REGIONAL_EXPRESSIONS)) {
    for (const marker of markers) {
      if (lower.includes(marker.toLowerCase())) {
        return region as QuebecRegion;
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// CONTENT GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generates a Joual-style response based on context
 */
export function generateJoualResponse(
  intent: "greeting" | "approval" | "excitement" | "encouragement" | "question",
  intensity: "mild" | "moderate" | "strong" = "moderate",
): string {
  const responses: Record<string, Record<string, string[]>> = {
    greeting: {
      mild: ["Salut!", "Allo!", "Bonjour!"],
      moderate: ["Heille!", "Ça roule?", "Yo!"],
      strong: ["Heille toé!", "Ça gaze en tabarnak!"],
    },
    approval: {
      mild: ["C'est correct!", "Ça marche!"],
      moderate: ["Tiguidou!", "Nice!", "Solide!"],
      strong: ["Malade en criss!", "Sick en tabarnak!"],
    },
    excitement: {
      mild: ["Oh wow!", "Super!"],
      moderate: ["J'capote!", "C'est malade!", "Débile!"],
      strong: ["Esti que c'est bon!", "Tabarnak c'est sick!"],
    },
    encouragement: {
      mild: ["Continue!", "C'est bon!"],
      moderate: ["Lâche pas!", "T'es capable!"],
      strong: ["Lâche pas la patate!", "Go go go!"],
    },
    question: {
      mild: ["Comment ça va?", "Ça va?"],
      moderate: ["Pis, ça roule?", "Coudonc, quoi de neuf?"],
      strong: ["Heille, ça va tu ben?"],
    },
  };

  const options = responses[intent]?.[intensity] || responses.approval.moderate;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Converts standard French to Joual style
 */
export function joualify(text: string): string {
  let result = text;

  // Common conversions
  const conversions: [RegExp, string][] = [
    [/\bje suis\b/gi, "j'suis"],
    [/\btu es\b/gi, "t'es"],
    [/\bil est\b/gi, "y'est"],
    [/\belle est\b/gi, "a'l'est"],
    [/\btoi\b/gi, "toé"],
    [/\bmoi\b/gi, "moé"],
    [/\bici\b/gi, "icitte"],
    [/\blà\b/gi, "là-là"],
    [/\bd'accord\b/gi, "correct"],
    [/\btrès bien\b/gi, "ben correct"],
    [/\bc'est bien\b/gi, "c'est tiguidou"],
    [/\bpas du tout\b/gi, "pantoute"],
    [/\bqu'est-ce que\b/gi, "kessé"],
    [/\bil y a\b/gi, "y'a"],
    [/\bregarde\b/gi, "check"],
  ];

  for (const [pattern, replacement] of conversions) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// HASHTAG GENERATION
// ═══════════════════════════════════════════════════════════════

export const QUEBEC_HASHTAGS = {
  general: ["#Quebec", "#QC", "#Québécois", "#FierDIci", "#QuebecLife"],
  montreal: ["#MTL", "#514", "#Montreal", "#MontrealLife", "#LePlateau"],
  quebec_city: ["#QC", "#418", "#QuebecCity", "#VieuxQuebec"],
  food: ["#Poutine", "#BouflfeQC", "#FoodieQC", "#RestaurantMTL"],
  culture: ["#CultureQC", "#ArtsQC", "#FestivalQC", "#MusiqueQC"],
  sports: ["#GoHabsGo", "#Canadiens", "#HockeyQC", "#AllouettesMTL"],
  nature: ["#NatureQC", "#PleinAirQC", "#LaurentidesMTL", "#MontTremblant"],
  seasonal: {
    winter: ["#HiverQC", "#Tempête", "#FretteEnEsti"],
    spring: ["#PrintempsQC", "#CaboisesSuck", "#LesSucres"],
    summer: ["#ÉtéQC", "#Terrasse", "#FestivalSeason", "#CônesOranges"],
    fall: ["#AutomneQC", "#CouleursAutomne", "#Pommes"],
  },
};

/**
 * Generates relevant Quebec hashtags for content
 */
export function generateHashtags(
  content: string,
  region?: QuebecRegion,
  count: number = 5,
): string[] {
  const hashtags: string[] = [];
  const lower = content.toLowerCase();

  // Always include general Quebec hashtag
  hashtags.push(
    QUEBEC_HASHTAGS.general[
      Math.floor(Math.random() * QUEBEC_HASHTAGS.general.length)
    ],
  );

  // Add region-specific
  if (
    region === "montreal" ||
    lower.includes("montreal") ||
    lower.includes("mtl")
  ) {
    hashtags.push(...QUEBEC_HASHTAGS.montreal.slice(0, 2));
  } else if (region === "quebec_city" || lower.includes("quebec city")) {
    hashtags.push(...QUEBEC_HASHTAGS.quebec_city.slice(0, 2));
  }

  // Add content-specific
  if (
    lower.includes("poutine") ||
    lower.includes("restaurant") ||
    lower.includes("manger")
  ) {
    hashtags.push(...QUEBEC_HASHTAGS.food.slice(0, 2));
  }
  if (
    lower.includes("hockey") ||
    lower.includes("habs") ||
    lower.includes("canadiens")
  ) {
    hashtags.push(...QUEBEC_HASHTAGS.sports.slice(0, 2));
  }
  if (
    lower.includes("festival") ||
    lower.includes("musique") ||
    lower.includes("concert")
  ) {
    hashtags.push(...QUEBEC_HASHTAGS.culture.slice(0, 2));
  }

  // Dedupe and limit
  return [...new Set(hashtags)].slice(0, count);
}

// ═══════════════════════════════════════════════════════════════
// MAIN BEE HANDLER
// ═══════════════════════════════════════════════════════════════

export interface JoualBeeInput {
  text: string;
  task: "detect" | "translate" | "generate" | "hashtags" | "moderate";
  region?: QuebecRegion;
  intensity?: "mild" | "moderate" | "strong";
}

export interface JoualBeeOutput {
  success: boolean;
  result: string | string[] | JoualMatch;
  confidence: number;
  metadata?: {
    region?: QuebecRegion | null;
    joualDetected?: boolean;
    hashtagCount?: number;
  };
}

/**
 * Main JoualBee handler - routes to appropriate processing
 */
export async function handleJoualBee(
  input: JoualBeeInput,
): Promise<JoualBeeOutput> {
  const { text, task, region, intensity = "moderate" } = input;

  switch (task) {
    case "detect": {
      const detection = detectJoual(text);
      return {
        success: true,
        result: detection,
        confidence: detection.matched ? 0.9 : 0.7,
        metadata: { joualDetected: detection.matched },
      };
    }

    case "translate": {
      const translated = joualify(text);
      return {
        success: true,
        result: translated,
        confidence: 0.85,
        metadata: { region: detectRegion(text) },
      };
    }

    case "generate": {
      const response = generateJoualResponse("approval", intensity);
      return {
        success: true,
        result: response,
        confidence: 0.8,
      };
    }

    case "hashtags": {
      const hashtags = generateHashtags(text, region);
      return {
        success: true,
        result: hashtags,
        confidence: 0.85,
        metadata: {
          hashtagCount: hashtags.length,
          region: region || detectRegion(text),
        },
      };
    }

    case "moderate": {
      const joualCheck = detectJoual(text);
      // In Quebec context, sacres are culturally acceptable but flagged for awareness
      return {
        success: true,
        result:
          joualCheck.intensity === "strong"
            ? "Content contains strong Joual - appropriate for Quebec audience"
            : "Content is safe",
        confidence: 0.95,
        metadata: { joualDetected: joualCheck.matched },
      };
    }

    default:
      return {
        success: false,
        result: "Unknown task type",
        confidence: 0,
      };
  }
}

// ═══════════════════════════════════════════════════════════════
// SWARM INTEGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * JoualBee agent for swarm responses
 */
export function createJoualBeeAgent(): BeeAgent {
  return {
    id: `joual-bee-${Date.now()}`,
    type: "joual",
    name: "JoualBee",
    status: "idle",
    specialty: "Quebec French Language & Culture",
  };
}

/**
 * Process a swarm task through JoualBee
 */
export async function processJoualTask(
  command: string,
  context?: Record<string, unknown>,
): Promise<SwarmResponse> {
  // Determine task type from command
  let task: JoualBeeInput["task"] = "generate";
  const lower = command.toLowerCase();

  if (
    lower.includes("tradui") ||
    lower.includes("translate") ||
    lower.includes("joual")
  ) {
    task = "translate";
  } else if (lower.includes("hashtag") || lower.includes("#")) {
    task = "hashtags";
  } else if (lower.includes("detect") || lower.includes("analyse")) {
    task = "detect";
  } else if (lower.includes("modér") || lower.includes("safe")) {
    task = "moderate";
  }

  const result = await handleJoualBee({
    text: command,
    task,
    region: context?.region as QuebecRegion | undefined,
  });

  return {
    bee: createJoualBeeAgent(),
    content:
      typeof result.result === "string"
        ? result.result
        : JSON.stringify(result.result),
    confidence: result.confidence,
    metadata: result.metadata,
  };
}

export default {
  detectJoual,
  detectRegion,
  generateJoualResponse,
  joualify,
  generateHashtags,
  handleJoualBee,
  processJoualTask,
  createJoualBeeAgent,
  JOUAL_EXPRESSIONS,
  REGIONAL_EXPRESSIONS,
  QUEBEC_HASHTAGS,
};
