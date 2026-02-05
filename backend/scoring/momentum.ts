import Redis from "ioredis";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface ScoringConfig {
  decayHalfLife: number;
  weights: {
    recency: number;
    fires: number;
    velocity: number;
    comments: number;
    culture: number;
  };
  redisPrefix: string;
  velocityCacheTTL: number;
}

export const DEFAULT_CONFIG: ScoringConfig = {
  decayHalfLife: 12,
  weights: {
    recency: 20,
    fires: 3,
    velocity: 10,
    comments: 1,
    culture: 5,
  },
  redisPrefix: "zyeute:momentum:",
  velocityCacheTTL: 300,
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PostMetrics {
  id: string;
  fireCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: Date;
  hasJoualCaption?: boolean;
  hasQuebecLocation?: boolean;
  creatorRegion?: string;
  hashtags?: string[];
}

export interface MomentumScore {
  postId: string;
  rawScore: number;
  decayScore: number;
  velocityScore: number;
  cultureBonus: number;
  finalScore: number;
  calculatedAt: Date;
}

export interface VelocityData {
  postId: string;
  firesLastHour: number;
  firesLastDay: number;
  hourlyVelocity: number;
  trend: "rising" | "stable" | "falling";
}

// ═══════════════════════════════════════════════════════════════════════════
// DECAY ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class DecayEngine {
  private halfLifeHours: number;

  constructor(halfLifeHours: number = 12) {
    this.halfLifeHours = halfLifeHours;
  }

  getDecayMultiplier(createdAt: Date, now: Date = new Date()): number {
    const hoursElapsed =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed < 0) return 1.0;
    return Math.pow(0.5, hoursElapsed / this.halfLifeHours);
  }

  applyDecay(
    baseScore: number,
    createdAt: Date,
    now: Date = new Date(),
  ): number {
    return baseScore * this.getDecayMultiplier(createdAt, now);
  }

  getRecencyScore(createdAt: Date, now: Date = new Date()): number {
    const multiplier = this.getDecayMultiplier(createdAt, now);
    return Math.round(multiplier * 100);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENGAGEMENT CACHE (Redis)
// ═══════════════════════════════════════════════════════════════════════════

export class EngagementCache {
  private redis: Redis | null = null;
  private prefix: string;
  private cacheTTL: number;

  constructor(
    redisUrl?: string,
    prefix: string = "zyeute:momentum:",
    cacheTTL: number = 300,
  ) {
    this.prefix = prefix;
    this.cacheTTL = cacheTTL;

    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      let lastErrorLog = 0;
      this.redis.on("error", (err: Error) => {
        const now = Date.now();
        if (now - lastErrorLog > 30_000) {
          console.error("[EngagementCache] Redis error:", err.message);
          lastErrorLog = now;
        }
      });
    }
  }

  async connect(): Promise<boolean> {
    if (!this.redis) return false;
    try {
      await this.redis.connect();
      return true;
    } catch (error) {
      console.error("[EngagementCache] Redis connection failed:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async recordFire(postId: string): Promise<void> {
    if (!this.redis) return;
    const now = Date.now();
    const key = `${this.prefix}fires:${postId}`;
    try {
      await this.redis.zadd(
        key,
        now,
        `${now}-${Math.random().toString(36).slice(2, 8)}`,
      );
      const cutoff = now - 24 * 60 * 60 * 1000;
      await this.redis.zremrangebyscore(key, "-inf", cutoff);
      await this.redis.expire(key, 25 * 60 * 60);
    } catch (error) {
      console.error("[EngagementCache] Failed to record fire:", error);
    }
  }

  async getVelocity(postId: string): Promise<VelocityData> {
    const defaultData: VelocityData = {
      postId,
      firesLastHour: 0,
      firesLastDay: 0,
      hourlyVelocity: 0,
      trend: "stable",
    };
    if (!this.redis) return defaultData;
    const key = `${this.prefix}fires:${postId}`;
    const now = Date.now();
    try {
      const hourAgo = now - 60 * 60 * 1000;
      const firesLastHour = await this.redis.zcount(key, hourAgo, "+inf");
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const firesLastDay = await this.redis.zcount(key, dayAgo, "+inf");
      const hourlyVelocity = firesLastDay / 24;
      let trend: "rising" | "stable" | "falling" = "stable";
      if (hourlyVelocity > 0) {
        const ratio = firesLastHour / hourlyVelocity;
        if (ratio > 1.5) trend = "rising";
        else if (ratio < 0.5) trend = "falling";
      }
      return { postId, firesLastHour, firesLastDay, hourlyVelocity, trend };
    } catch (error) {
      console.error("[EngagementCache] Failed to get velocity:", error);
      return defaultData;
    }
  }

  async getCachedScore(postId: string): Promise<number | null> {
    if (!this.redis) return null;
    const key = `${this.prefix}score:${postId}`;
    try {
      const cached = await this.redis.get(key);
      return cached ? parseFloat(cached) : null;
    } catch (error) {
      return null;
    }
  }

  async setCachedScore(postId: string, score: number): Promise<void> {
    if (!this.redis) return;
    const key = `${this.prefix}score:${postId}`;
    try {
      await this.redis.setex(key, this.cacheTTL, score.toString());
    } catch (error) {
      console.error("[EngagementCache] Failed to cache score:", error);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CULTURE SCORER
// ═══════════════════════════════════════════════════════════════════════════

export class CultureScorer {
  private static readonly JOUAL_MARKERS = [
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
  ];
  private static readonly QUEBEC_LOCATIONS = [
    "montréal",
    "montreal",
    "québec",
    "quebec",
    "laval",
    "gatineau",
    "sherbrooke",
    "trois-rivières",
    "saguenay",
    "longueuil",
    "terrebonne",
    "plateau",
    "hochelaga",
    "villeray",
    "rosemont",
    "verdun",
    "lasalle",
    "mtl",
    "qc",
  ];
  private static readonly QUEBEC_HASHTAGS = [
    "#quebec",
    "#québec",
    "#mtl",
    "#montreal",
    "#zyeute",
    "#joual",
    "#tabarnac",
    "#quebecois",
    "#québécois",
    "#frenchy",
    "#bière",
    "#poutine",
    "#hiver",
  ];

  static calculateScore(post: PostMetrics): number {
    let score = 0;
    if (post.hasJoualCaption) score += 3;
    if (post.hasQuebecLocation) score += 2;
    if (post.creatorRegion) {
      const region = post.creatorRegion.toLowerCase();
      if (this.QUEBEC_LOCATIONS.some((loc) => region.includes(loc))) score += 2;
    }
    if (post.hashtags && post.hashtags.length > 0) {
      const hashtagsLower = post.hashtags.map((h) => h.toLowerCase());
      const quebecHashtags = hashtagsLower.filter((h) =>
        this.QUEBEC_HASHTAGS.some((qh) => h.includes(qh.replace("#", ""))),
      );
      score += Math.min(quebecHashtags.length, 3);
    }
    return Math.min(score, 10);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MOMENTUM BLENDER
// ═══════════════════════════════════════════════════════════════════════════

export class MomentumBlender {
  private decay: DecayEngine;
  private cache: EngagementCache;
  private config: ScoringConfig;

  constructor(config: Partial<ScoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.decay = new DecayEngine(this.config.decayHalfLife);
    // Strip surrounding quotes from REDIS_URL (Railway/env may have "rediss://...")
    const rawRedisUrl = process.env.REDIS_URL?.trim()?.replace(/^["']+|["']+$/g, "");
    const hasRedis =
      (rawRedisUrl && rawRedisUrl.length > 0) ||
      (process.env.REDIS_HOST && process.env.REDIS_HOST.trim());
    const redisUrl = hasRedis
      ? rawRedisUrl ||
        `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
      : undefined;
    this.cache = new EngagementCache(
      redisUrl,
      this.config.redisPrefix,
      this.config.velocityCacheTTL,
    );
  }

  async init(): Promise<void> {
    await this.cache.connect();
  }

  async shutdown(): Promise<void> {
    await this.cache.disconnect();
  }

  async recordFire(postId: string): Promise<void> {
    await this.cache.recordFire(postId);
  }

  async calculateScore(post: PostMetrics): Promise<MomentumScore> {
    const { weights } = this.config;
    const now = new Date();
    const decayScore = this.decay.getRecencyScore(post.createdAt, now);
    const rawScore =
      post.fireCount * weights.fires + post.commentCount * weights.comments;
    const velocity = await this.cache.getVelocity(post.id);
    const velocityScore =
      Math.log1p(velocity.hourlyVelocity) * weights.velocity;
    const cultureBonus = CultureScorer.calculateScore(post) * weights.culture;
    const finalScore =
      decayScore * weights.recency + rawScore + velocityScore + cultureBonus;
    const result: MomentumScore = {
      postId: post.id,
      rawScore,
      decayScore,
      velocityScore,
      cultureBonus,
      finalScore: Math.round(finalScore),
      calculatedAt: now,
    };
    await this.cache.setCachedScore(post.id, result.finalScore);
    return result;
  }

  async calculateScores(posts: PostMetrics[]): Promise<MomentumScore[]> {
    return Promise.all(posts.map((post) => this.calculateScore(post)));
  }

  async sortByMomentum(posts: PostMetrics[]): Promise<PostMetrics[]> {
    const scores = await this.calculateScores(posts);
    const scoreMap = new Map(scores.map((s) => [s.postId, s.finalScore]));
    return [...posts].sort(
      (a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SQL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function generateViralScoreSQL(
  config: ScoringConfig = DEFAULT_CONFIG,
): string {
  const { weights, decayHalfLife } = config;
  return `
    ROUND(
      (POWER(0.5, EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 / ${decayHalfLife}) * 100 * ${weights.recency})
      +
      (reactions_count * ${weights.fires} + comments_count * ${weights.comments})
      +
      (CASE WHEN region IS NOT NULL AND region != '' THEN ${weights.culture * 2} ELSE 0 END)
    )
  `;
}
