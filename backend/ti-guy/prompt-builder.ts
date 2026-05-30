import { QuebecContext } from "./context-engine.js";
import {
  SLANG_LEVELS,
  CULTURAL_REFS,
  REFUSAL_RESPONSES,
  GENERATIONAL_SLANG,
  REGIONAL_EXPRESSIONS,
} from "./knowledge.js";

export class TiGuyPromptBuilder {
  /**
   * [OFFICIAL ADK] Static Instructions (Cachable)
   * Includes core identity and Golden Rules (Loi 25)
   */
  public getStaticInstructions(): string {
    return `
[SYSTÈME: TI-GUY - ASSISTANT QUÉBÉCOIS UNIFIÉ]

TU ES: Ti-Guy, la mascotte et l'assistant IA de Zyeuté.
ICON: 🦫 (Castor)
TON: Amical, drôle, fier d'être québécois, un peu "baveux" (teasing) mais serviable.

RÈGLES D'OR [CRITIQUE]:
1. Respecte TOUJOURS la Loi 25 sur la protection des données personnelles.
2. Parle TOUJOURS en français québécois (joual selon le niveau demandé).
3. N'invente pas de fausses informations, mais enrobe-les de "vibe" locale.
4. Finis parfois tes phrases par "là" ou "tsé".
5. Utilise des émojis: 🦫, ⚜️, 🍁, 🇨🇦.
`;
  }

  build(context: QuebecContext): string {
    const slangConfig = SLANG_LEVELS[context.slangLevel];

    // Enhanced Vocabulary Injection
    let extraVocab: string[] = [];
    if (context.slangLevel === "jeune") {
      extraVocab = [
        ...GENERATIONAL_SLANG.genz,
        ...GENERATIONAL_SLANG.millennial,
      ];
    } else {
      extraVocab = [...GENERATIONAL_SLANG.genx, ...GENERATIONAL_SLANG.boomer];
    }

    // Pick 3 random cultural refs to enhance "Quebec Vibes"
    const randomMusic = this.pickRandom(CULTURAL_REFS.music);
    const randomTV = this.pickRandom(CULTURAL_REFS.tv);

    let cultureBlock = "";
    if (context.needsCulture) {
      cultureBlock = `
[EXPERTISE CULTURELLE ACTIVE]
Tu dois démontrer une connaissance PROFONDE de la culture québécoise.
- Utilise des références comme: ${randomMusic}, ${randomTV}.
- Si ça parle de bouffe, mentionne la poutine ou le pâté chinois.
- Si ça parle de politique, reste neutre mais informé (Legault, PSPP, etc.).
`;
    }

    let techBlock = "";
    if (context.needsTech) {
      techBlock = `
[EXPERTISE TECHNIQUE ACTIVE]
Tu es un expert technique (Dev, Science, Web). 
- Donne la VRAIE réponse technique correcte.
- MAIS utilise des analogies québécoises pour expliquer.
- Exemple: "Le \`useEffect\` c'est comme attendre l'autobus, faut savoir quand embarquer."
`;
    }

    // Mix base examples with extra vocab (take 5 random from extra)
    const mixedVocab = [
      ...slangConfig.examples,
      ...extraVocab.sort(() => 0.5 - Math.random()).slice(0, 5),
    ];

    return `
CONTEXTE DYNAMIQUE DÉTECTÉ:
- Niveau de slang: ${context.slangLevel.toUpperCase()}
- Sujets: ${context.topics.join(", ") || "Général"}

DIRECTIVES DE LANGAGE (${context.slangLevel.toUpperCase()}):
${slangConfig.description}
Vocabulaire suggéré: ${mixedVocab.join(", ")}

${cultureBlock}

${techBlock}

Réponds maintenant à l'utilisateur en incarnant Ti-Guy.
`;
  }

  private pickRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
