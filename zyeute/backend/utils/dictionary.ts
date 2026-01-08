/**
 * Zyeuté Local Dictionary Utility
 * Core "Joual" mapping and safety filtering for local word lookups.
 * Costs $0 and works offline.
 */

export interface DictionaryEntry {
  word: string;
  definition: string;
  partOfSpeech: string;
  synonyms: string[];
  quebecVariant?: string;
  safetyFlag?: "hateful" | "sexual" | "violent" | "safe";
}

// Local Joual Mapping (Quebec-specific context)
const JOUAL_MAP: Record<string, Partial<DictionaryEntry>> = {
  chum: {
    definition: "Un ami proche, un copain ou un petit ami.",
    partOfSpeech: "nom masculin",
    synonyms: ["ami", "copain", "pote", "conjoint"],
    quebecVariant: "Terme standard au Québec pour un compagnon.",
  },
  blonde: {
    definition:
      "Une petite amie ou une conjointe (peu importe la couleur de ses cheveux).",
    partOfSpeech: "nom féminin",
    synonyms: ["copine", "conjointe", "amoureuse"],
    quebecVariant:
      "Utilisé universellement au Québec au lieu de 'petite amie'.",
  },
  gosser: {
    definition:
      "Fatiguer quelqu'un, ennuyer ou travailler maladroitement sur un objet.",
    partOfSpeech: "verbe",
    synonyms: ["énerver", "agacer", "fatiguer", "bricoler"],
    quebecVariant: "Vient du vieux français 'gosser' (tailler le bois).",
  },
  pantoute: {
    definition: "Pas du tout.",
    partOfSpeech: "adverbe",
    synonyms: ["absolument pas", "aucunement"],
    quebecVariant: "Contraction de 'pas du tout'.",
  },
  magané: {
    definition: "Abîmé, fatigué, en mauvais état physique ou matériel.",
    partOfSpeech: "adjectif",
    synonyms: ["usé", "endommagé", "épuisé"],
    quebecVariant:
      "Très fréquent pour décrire un objet brisé ou une gueule de bois.",
  },
  tuque: {
    definition: "Bonnet de laine porté en hiver.",
    partOfSpeech: "nom féminin",
    synonyms: ["bonnet", "calotte"],
    quebecVariant: "Origine canadienne-française.",
  },
  breuvage: {
    definition: "Une boisson (souvent froide).",
    partOfSpeech: "nom masculin",
    synonyms: ["boisson", "rafraîchissement"],
    quebecVariant:
      "Utilisé au Québec là où la France dirait simplement 'boisson'.",
  },
  char: {
    definition: "Une voiture, une automobile.",
    partOfSpeech: "nom masculin",
    synonyms: ["voiture", "auto", "véhicule"],
    quebecVariant: "Vient du vieux français pour chariot. 'Parké son char'.",
  },
  poutine: {
    definition:
      "Plat national du Québec composé de frites, de fromage en grain et de sauce brune.",
    partOfSpeech: "nom féminin",
    synonyms: ["délice", "mets national"],
    quebecVariant: "Né dans le Centre-du-Québec dans les années 50.",
  },
  calisse: {
    definition:
      "Sacre québécois utilisé pour exprimer la colère ou la surprise.",
    partOfSpeech: "interjection",
    synonyms: ["zut", "merde"],
    quebecVariant: "Vient du mot liturgique 'calice'.",
    safetyFlag: "safe", // Per policy, sacres are permitted unless used for harassment
  },
  tabarnak: {
    definition: "Le plus puissant des sacres québécois.",
    partOfSpeech: "interjection",
    synonyms: ["merde", "incroyable"],
    quebecVariant: "Vient du mot 'tabernacle'.",
    safetyFlag: "safe",
  },
};

// Local Safety Blacklist (Examples)
const SAFETY_BLACKLIST: Record<string, DictionaryEntry["safetyFlag"]> = {
  nègre: "hateful",
  faggot: "hateful",
  suicide: "violent",
  meurtre: "violent",
  porn: "sexual",
};

/**
 * Performs a local-first dictionary lookup.
 */
export async function lookupWord(
  word: string,
): Promise<DictionaryEntry | null> {
  const normalized = word.toLowerCase().trim();

  // 1. Safety Check First
  const safetyStatus = SAFETY_BLACKLIST[normalized] || "safe";

  // 2. Check Joual Local Map
  if (JOUAL_MAP[normalized]) {
    const entry = JOUAL_MAP[normalized];
    return {
      word: word,
      definition: entry.definition || "Définition locale indisponible.",
      partOfSpeech: entry.partOfSpeech || "n/a",
      synonyms: entry.synonyms || [],
      quebecVariant: entry.quebecVariant,
      safetyFlag: safetyStatus,
    };
  }

  // 3. Fallback for common words (Static for $0 cost)
  // In a real app, this could call a $0 API like dictionaryapi.dev for English,
  // but for Zyeute, we prioritize the local Joual experience.

  if (safetyStatus !== "safe") {
    return {
      word: word,
      definition: "Ce mot est restreint par nos règles de sécurité.",
      partOfSpeech: "filtré",
      synonyms: [],
      safetyFlag: safetyStatus,
    };
  }

  return null;
}
