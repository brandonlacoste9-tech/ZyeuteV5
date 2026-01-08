/**
 * Configuration for Context Caching
 * Aligning with Google ADK v1.14.0+ specs
 */
export interface ContextCacheConfig {
  /** Minimum tokens required to trigger caching (default 2048 for Gemini) */
  minTokens?: number;
  /** Time to live for the cache in seconds (default 1800) */
  ttlSeconds?: number;
  /** Number of times the cache can be reused (default 10) */
  cacheIntervals?: number;
}
