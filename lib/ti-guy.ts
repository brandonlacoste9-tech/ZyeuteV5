/**
 * Ti-Guy Helper Utilities
 * Common functions for working with Quebec content
 */

/**
 * Calculate Quebec cultural score for text content
 */
export function calculateCulturalScore(text: string): number {
  let score = 0.0;
  const lowerText = text.toLowerCase();

  // Joual markers (+0.3)
  const joualMarkers = [
    "toé",
    "moé",
    "icitte",
    "là-bas",
    "tsé",
    "pantoute",
    "tantôt",
    "tabarnak",
    "calisse",
  ];
  if (joualMarkers.some((marker) => lowerText.includes(marker))) {
    score += 0.3;
  }

  // Quebec locations (+0.2)
  if (
    lowerText.includes("montréal") ||
    lowerText.includes("montreal") ||
    lowerText.includes("mtl")
  ) {
    score += 0.2;
  } else if (lowerText.includes("québec") || lowerText.includes("quebec")) {
    score += 0.15;
  }

  // Cultural references (+0.05 each, max 0.3)
  const culturalRefs = [
    "poutine",
    "tourtière",
    "habs",
    "canadiens",
    "hockey",
    "cabane à sucre",
    "dep",
  ];
  const refCount = culturalRefs.filter((ref) => lowerText.includes(ref)).length;
  score += Math.min(refCount * 0.05, 0.3);

  // Penalty for English-only
  const hasFrench = /[àâäéèêëïîôùûüÿæœç]/i.test(text);
  if (
    !hasFrench &&
    !lowerText.includes("quebec") &&
    !lowerText.includes("québec")
  ) {
    score -= 0.5;
  }

  return Math.max(0.0, Math.min(1.0, score));
}

/**
 * Check if text is Quebec-compliant (score >= 0.3)
 */
export function isQuebecCompliant(text: string): boolean {
  return calculateCulturalScore(text) >= 0.3;
}

/**
 * Get Quebec-friendly greeting based on time of day
 */
export function getQuebecGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bon matin!";
  if (hour < 18) return "Bon après-midi!";
  return "Bonsoir!";
}

/**
 * Format number in Quebec style (space separator)
 */
export function formatQuebecNumber(num: number): string {
  return num.toLocaleString("fr-CA");
}

/**
 * Validate Quebec postal code format
 */
export function isQuebecPostalCode(code: string): boolean {
  const quebecPattern = /^[GHJ]\d[A-Z]\s?\d[A-Z]\d$/i;
  return quebecPattern.test(code);
}

/**
 * Get Quebec region from postal code
 */
export function getQuebecRegion(postalCode: string): string | null {
  const firstChar = postalCode.charAt(0).toUpperCase();
  const regionMap: Record<string, string> = {
    H: "Montréal",
    G: "Québec",
    J: "Montérégie/Estrie/Outaouais",
  };
  return regionMap[firstChar] || null;
}

/**
 * Common Quebec slang/expressions
 */
export const QUEBEC_EXPRESSIONS = {
  greeting: {
    morning: "Bon matin!",
    afternoon: "Bon après-midi!",
    evening: "Bonsoir!",
    casual: "Salut!",
    friendly: "Allo!",
  },
  actions: {
    submit: "Envoyer",
    urgent_submit: "Grouille-toi",
    delete: "Sacrer ça aux vidanges",
    remove: "Sacrer dehors",
    cancel: "Annuler",
    save: "Sauvegarder",
    loading: "Ça charge...",
    error: "Oups, y'a un bobo",
    add_friend: "Ajouter aux chums",
    yes: "Oui",
    no: "Non",
  },
  phrases: {
    see_more: "Voir plus",
    learn_more: "En savoir plus",
    refresh: "Rafraîchir",
    back: "Retour",
    close: "Fermer",
    open: "Ouvrir",
    share: "Partager",
  },
} as const;

/**
 * Get Joual translation for English term
 */
export function getJoualTranslation(english: string): string | null {
  const translations: Record<string, string> = {
    loading: "Ça charge...",
    submit: "Envoyer",
    send: "Grouille-toi",
    delete: "Sacrer ça aux vidanges",
    remove: "Sacrer dehors",
    "add friend": "Ajouter aux chums",
    friend: "chum",
    error: "Oups, y'a un bobo",
    cancel: "Annuler",
    save: "Sauvegarder",
  };
  return translations[english.toLowerCase()] || null;
}
