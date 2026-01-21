/**
 * Zyeuté Prompt Evolution Engine - "L'Évolution de Ti-Guy"
 * * Layer 3.2: Closes the feedback loop by learning from high-momentum anomalies.
 */

import { sql } from "drizzle-orm";
import { Router, Request, Response } from "express";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface EvolutionConfig {
  /** Minimum ratio of Hive_Reality / Ti-Guy_Score to flag as anomaly */
  anomalyThreshold: number;

  /** Minimum engagement to consider (filters noise) */
  minEngagement: number;

  /** How many anomalies to analyze per evolution cycle */
  batchSize: number;

  /** Gravity factor for time decay */
  gravity: number;

  /** Engagement weights */
  weights: {
    fires: number;
    shares: number;
    piasse: number;
    comments: number;
  };
}

export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  anomalyThreshold: 1.5, // Hive reality is 50%+ higher than prediction
  minEngagement: 10, // At least 10 weighted engagement points
  batchSize: 50,
  gravity: 1.8,
  weights: {
    fires: 1,
    shares: 3,
    piasse: 5,
    comments: 1,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface MomentumAnomaly {
  postId: string;
  userId: string;
  username: string;
  content: string;
  caption?: string;
  hashtags: string[];
  region?: string;

  // Scores
  quebecScore: number; // Ti-Guy's initial assessment
  momentumScore: number; // Hive reality (calculated)
  anomalyRatio: number; // momentum / quebec_score

  // Engagement breakdown
  fires: number;
  shares: number;
  piasse: number;
  comments: number;
  weightedEngagement: number;

  // Temporal
  ageHours: number;
  createdAt: Date;
}

export interface PatternAnalysis {
  // Linguistic patterns
  joualMarkers: string[];
  joualDensity: number; // markers per 100 chars
  averageWordLength: number;
  sentenceStyle: "short" | "medium" | "long";
  questionCount: number;
  exclamationCount: number;

  // Content patterns
  topHashtags: { tag: string; count: number }[];
  topRegions: { region: string; count: number }[];
  contentLengthAvg: number;
  hasMedia: boolean;

  // Temporal patterns
  peakPostingHours: number[];
  avgAgeAtPeak: number;

  // Cultural signals
  cultureSignals: string[];
  emergingTerms: string[]; // New joual not in our dictionary
}

export interface EvolutionRecommendation {
  type:
    | "add_joual_term"
    | "adjust_weight"
    | "add_hashtag_bonus"
    | "region_boost"
    | "prompt_update";
  confidence: number; // 0-1
  description: string;
  implementation: string; // Code or config change
  evidence: string[]; // Post IDs that support this
}

export interface EvolutionReport {
  generatedAt: Date;
  anomaliesAnalyzed: number;
  patterns: PatternAnalysis;
  recommendations: EvolutionRecommendation[];
  promptUpdates: {
    cultureScorerAdditions: string[];
    weightAdjustments: Record<string, number>;
    newHeuristics: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ANOMALY DETECTOR
// ═══════════════════════════════════════════════════════════════════════════

export class AnomalyDetector {
  private config: EvolutionConfig;

  constructor(config: Partial<EvolutionConfig> = {}) {
    this.config = { ...DEFAULT_EVOLUTION_CONFIG, ...config };
  }

  /**
   * Find posts where Hive reality significantly exceeds Ti-Guy's prediction
   */
  async findAnomalies(db: any): Promise<MomentumAnomaly[]> {
    const { anomalyThreshold, minEngagement, batchSize, weights, gravity } =
      this.config;

    // SQL to find high-momentum anomalies
    // Adjusting table names and column names to match shared/schema.ts
    const result = await db.execute(sql`
      WITH momentum_calc AS (
        SELECT 
          p.id,
          p.user_id,
          p.content,
          p.caption,
          p.hashtags,
          p.region,
          p.quebec_score,
          COALESCE(p.reactions_count, 0) as fires,
          COALESCE(p.shares_count, 0) as shares,
          COALESCE(p.piasse_count, 0) as piasse,
          COALESCE(p.comments_count, 0) as comments,
          p.created_at,
          u.username,
          
          -- Weighted engagement
          (
            COALESCE(p.reactions_count, 0) * ${weights.fires} +
            COALESCE(p.shares_count, 0) * ${weights.shares} +
            COALESCE(p.piasse_count, 0) * ${weights.piasse} +
            COALESCE(p.comments_count, 0) * ${weights.comments}
          ) as weighted_engagement,
          
          -- Age in hours
          EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 as age_hours,
          
          -- Momentum score (matches implementation)
          ((p.quebec_score + 1) * (LN(COALESCE(p.reactions_count, 0) * ${weights.fires} + COALESCE(p.shares_count, 0) * ${weights.shares} + COALESCE(p.piasse_count, 0) * ${weights.piasse} + COALESCE(p.comments_count, 0) * ${weights.comments} + 1) + 1))
          / 
          POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 + 2, ${gravity})
          as momentum_score
          
        FROM publications p
        JOIN user_profiles u ON p.user_id = u.id
        WHERE p.quebec_score IS NOT NULL
          AND p.quebec_score > 0
          AND p.created_at > NOW() - INTERVAL '30 days'
          AND (p.est_masque = false OR p.est_masque IS NULL)
      )
      SELECT *,
        (momentum_score / NULLIF(quebec_score, 0)) as anomaly_ratio
      FROM momentum_calc
      WHERE weighted_engagement >= ${minEngagement}
        AND (momentum_score / NULLIF(quebec_score, 0)) >= ${anomalyThreshold}
      ORDER BY anomaly_ratio DESC
      LIMIT ${batchSize}
    `);

    return result.rows.map((row: any) => ({
      postId: row.id,
      userId: row.user_id,
      username: row.username,
      content: row.content || "",
      caption: row.caption,
      hashtags: row.hashtags || [],
      region: row.region,
      quebecScore: parseFloat(row.quebec_score) || 0,
      momentumScore: parseFloat(row.momentum_score) || 0,
      anomalyRatio: parseFloat(row.anomaly_ratio) || 0,
      fires: parseInt(row.fires) || 0,
      shares: parseInt(row.shares) || 0,
      piasse: parseInt(row.piasse) || 0,
      comments: parseInt(row.comments) || 0,
      weightedEngagement: parseFloat(row.weighted_engagement) || 0,
      ageHours: parseFloat(row.age_hours) || 0,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Find "Evergreen" anomalies - old posts still getting engagement
   */
  async findEvergreenAnomalies(
    db: any,
    minAgeHours: number = 48,
  ): Promise<MomentumAnomaly[]> {
    const anomalies = await this.findAnomalies(db);
    return anomalies.filter((a) => a.ageHours >= minAgeHours);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PATTERN EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════

export class PatternExtractor {
  // Known joual markers
  private static readonly KNOWN_JOUAL = new Set([
    "toé",
    "moé",
    "icitte",
    "asteure",
    "chu",
    "j'vas",
    "faque",
    "pis",
    "tabarnac",
    "tabarnak",
    "câlisse",
    "crisse",
    "ostie",
    "maudit",
    "ciboire",
    "y fait frette",
    "c'est malade",
    "c'est fou",
    "fait que",
    "genre",
    "tsé",
    "ben",
    "pantoute",
    "char",
    "dépanneur",
    "tuque",
    "pogner",
    "gosser",
    "niaiseux",
    "quétaine",
    "piasse",
    "cenne",
    "les boys",
    "la gang",
  ]);

  /**
   * Analyze patterns across anomaly set
   */
  analyze(anomalies: MomentumAnomaly[]): PatternAnalysis {
    if (anomalies.length === 0) {
      return this.emptyAnalysis();
    }

    // Aggregate all text
    const allText = anomalies
      .map((a) => `${a.content} ${a.caption || ""}`)
      .join(" ")
      .toLowerCase();

    // Find joual markers
    const foundJoual = this.findJoualMarkers(allText);
    const knownFound = foundJoual.filter((m) =>
      PatternExtractor.KNOWN_JOUAL.has(m),
    );
    const newFound = foundJoual.filter(
      (m) => !PatternExtractor.KNOWN_JOUAL.has(m),
    );

    // Hashtag frequency
    const hashtagCounts = new Map<string, number>();
    anomalies.forEach((a) => {
      (a.hashtags || []).forEach((tag) => {
        const normalized = tag.toLowerCase().replace("#", "");
        hashtagCounts.set(normalized, (hashtagCounts.get(normalized) || 0) + 1);
      });
    });

    const topHashtags = Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Region frequency
    const regionCounts = new Map<string, number>();
    anomalies.forEach((a) => {
      if (a.region) {
        regionCounts.set(a.region, (regionCounts.get(a.region) || 0) + 1);
      }
    });

    const topRegions = Array.from(regionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([region, count]) => ({ region, count }));

    // Content length
    const contentLengths = anomalies.map((a) => a.content.length);
    const contentLengthAvg =
      contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length;

    // Sentence style
    const avgWords = allText.split(/\s+/).length / anomalies.length;
    const sentenceStyle =
      avgWords < 15 ? "short" : avgWords < 30 ? "medium" : "long";

    // Questions and exclamations
    const questionCount = (allText.match(/\?/g) || []).length;
    const exclamationCount = (allText.match(/!/g) || []).length;

    // Posting hours
    const hourCounts = new Map<number, number>();
    anomalies.forEach((a) => {
      const hour = a.createdAt.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const peakPostingHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    // Average age at peak momentum
    const avgAgeAtPeak =
      anomalies.reduce((sum, a) => sum + a.ageHours, 0) / anomalies.length;

    // Culture signals
    const cultureSignals: string[] = [];
    if (foundJoual.length > anomalies.length * 0.5) {
      cultureSignals.push("HIGH_JOUAL_DENSITY");
    }
    if (
      topRegions.some((r) =>
        ["montreal", "québec", "quebec"].includes(r.region.toLowerCase()),
      )
    ) {
      cultureSignals.push("MAJOR_CITY_CONCENTRATION");
    }
    if (exclamationCount > anomalies.length * 2) {
      cultureSignals.push("HIGH_ENTHUSIASM");
    }
    if (questionCount > anomalies.length) {
      cultureSignals.push("CONVERSATIONAL_STYLE");
    }

    return {
      joualMarkers: knownFound,
      joualDensity: (foundJoual.length / Math.max(allText.length, 1)) * 100,
      averageWordLength: this.averageWordLength(allText),
      sentenceStyle,
      questionCount,
      exclamationCount,
      topHashtags,
      topRegions,
      contentLengthAvg: Math.round(contentLengthAvg),
      hasMedia: true,
      peakPostingHours,
      avgAgeAtPeak: Math.round(avgAgeAtPeak * 10) / 10,
      cultureSignals,
      emergingTerms: newFound,
    };
  }

  private findJoualMarkers(text: string): string[] {
    const found: string[] = [];
    const words = text.toLowerCase().split(/\s+/);

    // Check known markers
    PatternExtractor.KNOWN_JOUAL.forEach((marker) => {
      if (text.includes(marker)) {
        found.push(marker);
      }
    });

    // Detect potential new joual
    const potentialNewJoual = words.filter((word) => {
      if (word.endsWith("tte") || word.endsWith("oune")) return true;
      if (
        word.includes("'") &&
        !word.startsWith("l'") &&
        !word.startsWith("d'")
      )
        return true;
      if (word.startsWith("tch")) return true;
      return false;
    });

    return [...found, ...potentialNewJoual];
  }

  private averageWordLength(text: string): number {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return 0;
    return words.reduce((sum, w) => sum + w.length, 0) / words.length;
  }

  private emptyAnalysis(): PatternAnalysis {
    return {
      joualMarkers: [],
      joualDensity: 0,
      averageWordLength: 0,
      sentenceStyle: "medium",
      questionCount: 0,
      exclamationCount: 0,
      topHashtags: [],
      topRegions: [],
      contentLengthAvg: 0,
      hasMedia: false,
      peakPostingHours: [],
      avgAgeAtPeak: 0,
      cultureSignals: [],
      emergingTerms: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT EVOLVER
// ═══════════════════════════════════════════════════════════════════════════

export class PromptEvolver {
  generateRecommendations(
    patterns: PatternAnalysis,
    anomalies: MomentumAnomaly[],
  ): EvolutionRecommendation[] {
    const recommendations: EvolutionRecommendation[] = [];

    // 1. New joual terms to add
    if (patterns.emergingTerms.length > 0) {
      const frequentNew = this.findFrequentTerms(
        patterns.emergingTerms,
        anomalies,
      );
      frequentNew.forEach((term) => {
        recommendations.push({
          type: "add_joual_term",
          confidence: Math.min(0.9, 0.3 + term.frequency * 0.1),
          description: `Add "${term.term}" to joual marker dictionary`,
          implementation: `JOUAL_MARKERS.push('${term.term}');`,
          evidence: term.postIds.slice(0, 3),
        });
      });
    }

    // 2. Hashtag bonuses
    const underweightedHashtags = patterns.topHashtags.filter((h) => {
      return h.count >= anomalies.length * 0.3;
    });

    underweightedHashtags.forEach((h) => {
      recommendations.push({
        type: "add_hashtag_bonus",
        confidence: Math.min(0.85, 0.4 + (h.count / anomalies.length) * 0.5),
        description: `Add culture bonus for #${h.tag} (appeared in ${h.count}/${anomalies.length} anomalies)`,
        implementation: `QUEBEC_HASHTAGS.push('#${h.tag}');`,
        evidence: anomalies
          .filter((a) => a.hashtags?.includes(h.tag))
          .map((a) => a.postId)
          .slice(0, 3),
      });
    });

    // 3. Region boosts
    patterns.topRegions.forEach((r) => {
      if (r.count >= anomalies.length * 0.2) {
        recommendations.push({
          type: "region_boost",
          confidence: 0.7,
          description: `Increase culture bonus for region: ${r.region}`,
          implementation: `if (region === '${r.region}') cultureBonus += 2;`,
          evidence: anomalies
            .filter((a) => a.region === r.region)
            .map((a) => a.postId)
            .slice(0, 3),
        });
      }
    });

    // 4. Weight adjustments
    const avgEngagement = anomalies.reduce(
      (sum, a) => ({
        fires: sum.fires + a.fires,
        shares: sum.shares + a.shares,
        piasse: sum.piasse + a.piasse,
        comments: sum.comments + a.comments,
      }),
      { fires: 0, shares: 0, piasse: 0, comments: 0 },
    );

    const total =
      avgEngagement.fires +
      avgEngagement.shares +
      avgEngagement.piasse +
      avgEngagement.comments;

    if (total > 0) {
      const shareRatio = avgEngagement.shares / total;
      if (shareRatio > 0.3) {
        recommendations.push({
          type: "adjust_weight",
          confidence: 0.6,
          description: `Shares are ${Math.round(shareRatio * 100)}% of engagement in anomalies`,
          implementation: `weights.shares = ${Math.round(3 * (1 + shareRatio))}; // was 3`,
          evidence: anomalies
            .sort((a, b) => b.shares - a.shares)
            .slice(0, 3)
            .map((a) => a.postId),
        });
      }
    }

    // 5. Prompt updates
    if (patterns.cultureSignals.includes("HIGH_ENTHUSIASM")) {
      recommendations.push({
        type: "prompt_update",
        confidence: 0.75,
        description: "High-performing content uses enthusiastic tone",
        implementation: `// Add to Ti-Guy prompt: "Content with enthusiastic, excited tone tends to resonate"`,
        evidence: [],
      });
    }

    if (patterns.cultureSignals.includes("CONVERSATIONAL_STYLE")) {
      recommendations.push({
        type: "prompt_update",
        confidence: 0.7,
        description: "Conversational style performs well",
        implementation: `// Add to Ti-Guy prompt: "Content that asks questions performs well"`,
        evidence: [],
      });
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private findFrequentTerms(
    terms: string[],
    anomalies: MomentumAnomaly[],
  ): { term: string; frequency: number; postIds: string[] }[] {
    const termCounts = new Map<string, { count: number; postIds: string[] }>();

    anomalies.forEach((a) => {
      const text = `${a.content} ${a.caption || ""}`.toLowerCase();
      terms.forEach((term) => {
        if (text.includes(term)) {
          const existing = termCounts.get(term) || { count: 0, postIds: [] };
          existing.count++;
          existing.postIds.push(a.postId);
          termCounts.set(term, existing);
        }
      });
    });

    return Array.from(termCounts.entries())
      .filter(([_, data]) => data.count >= 3)
      .map(([term, data]) => ({
        term,
        frequency: data.count / anomalies.length,
        postIds: data.postIds,
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  generateReport(
    anomalies: MomentumAnomaly[],
    patterns: PatternAnalysis,
    recommendations: EvolutionRecommendation[],
  ): EvolutionReport {
    const cultureScorerAdditions = recommendations
      .filter((r) => r.type === "add_joual_term" && r.confidence >= 0.6)
      .map((r) => r.implementation.match(/'([^']+)'/)?.[1] || "")
      .filter(Boolean);

    const weightAdjustments: Record<string, number> = {};
    recommendations
      .filter((r) => r.type === "adjust_weight" && r.confidence >= 0.5)
      .forEach((r) => {
        const match = r.implementation.match(/weights\.(\w+)\s*=\s*(\d+)/);
        if (match) {
          weightAdjustments[match[1]] = parseInt(match[2]);
        }
      });

    const newHeuristics = recommendations
      .filter((r) => r.type === "prompt_update")
      .map((r) => r.description);

    return {
      generatedAt: new Date(),
      anomaliesAnalyzed: anomalies.length,
      patterns,
      recommendations,
      promptUpdates: {
        cultureScorerAdditions,
        weightAdjustments,
        newHeuristics,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class PromptEvolutionEngine {
  private detector: AnomalyDetector;
  private extractor: PatternExtractor;
  private evolver: PromptEvolver;
  private config: EvolutionConfig;

  constructor(config: Partial<EvolutionConfig> = {}) {
    this.config = { ...DEFAULT_EVOLUTION_CONFIG, ...config };
    this.detector = new AnomalyDetector(this.config);
    this.extractor = new PatternExtractor();
    this.evolver = new PromptEvolver();
  }

  async evolve(db: any): Promise<EvolutionReport> {
    const anomalies = await this.detector.findAnomalies(db);

    if (anomalies.length === 0) {
      return this.emptyReport();
    }

    const patterns = this.extractor.analyze(anomalies);
    const recommendations = this.evolver.generateRecommendations(
      patterns,
      anomalies,
    );
    const report = this.evolver.generateReport(
      anomalies,
      patterns,
      recommendations,
    );

    return report;
  }

  async diagnose(db: any): Promise<{
    anomalies: MomentumAnomaly[];
    evergreens: MomentumAnomaly[];
    quickStats: {
      totalAnomalies: number;
      avgAnomalyRatio: number;
      topPerformer: MomentumAnomaly | null;
      regionDistribution: Record<string, number>;
    };
  }> {
    const anomalies = await this.detector.findAnomalies(db);
    const evergreens = await this.detector.findEvergreenAnomalies(db);

    const avgAnomalyRatio =
      anomalies.length > 0
        ? anomalies.reduce((sum, a) => sum + a.anomalyRatio, 0) /
          anomalies.length
        : 0;

    const regionDistribution: Record<string, number> = {};
    anomalies.forEach((a) => {
      if (a.region) {
        regionDistribution[a.region] = (regionDistribution[a.region] || 0) + 1;
      }
    });

    return {
      anomalies,
      evergreens,
      quickStats: {
        totalAnomalies: anomalies.length,
        avgAnomalyRatio: Math.round(avgAnomalyRatio * 100) / 100,
        topPerformer: anomalies[0] || null,
        regionDistribution,
      },
    };
  }

  private emptyReport(): EvolutionReport {
    return {
      generatedAt: new Date(),
      anomaliesAnalyzed: 0,
      patterns: {
        joualMarkers: [],
        joualDensity: 0,
        averageWordLength: 0,
        sentenceStyle: "medium",
        questionCount: 0,
        exclamationCount: 0,
        topHashtags: [],
        topRegions: [],
        contentLengthAvg: 0,
        hasMedia: false,
        peakPostingHours: [],
        avgAgeAtPeak: 0,
        cultureSignals: [],
        emergingTerms: [],
      },
      recommendations: [],
      promptUpdates: {
        cultureScorerAdditions: [],
        weightAdjustments: {},
        newHeuristics: [],
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPRESS ROUTES
// ═══════════════════════════════════════════════════════════════════════════

export function createEvolutionRouter(db: any): Router {
  const router = Router();
  const engine = new PromptEvolutionEngine();

  router.get("/diagnose", async (req: Request, res: Response) => {
    try {
      const diagnostic = await engine.diagnose(db);
      res.json({
        success: true,
        ...diagnostic,
      });
    } catch (error) {
      console.error("[Evolution] Diagnose error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  router.get("/evolve", async (req: Request, res: Response) => {
    try {
      const report = await engine.evolve(db);
      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("[Evolution] Evolve error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  router.get("/anomalies", async (req: Request, res: Response) => {
    try {
      const detector = new AnomalyDetector();
      const anomalies = await detector.findAnomalies(db);
      res.json({
        success: true,
        count: anomalies.length,
        anomalies,
      });
    } catch (error) {
      console.error("[Evolution] Anomalies error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  return router;
}

export default PromptEvolutionEngine;
