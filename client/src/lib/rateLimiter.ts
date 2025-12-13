/**
 * Rate Limiter - Client-side rate limiting for API calls
 * Security: Prevents abuse by limiting the number of requests per time window
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  /**
   * Check if an action can proceed based on rate limits
   * @param key - Unique identifier for the action (e.g., 'create-post', 'comment-123')
   * @param maxAttempts - Maximum number of attempts allowed in the time window
   * @param windowMs - Time window in milliseconds
   * @returns true if action can proceed, false if rate limited
   */
  canProceed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the time window
    const recentAttempts = attempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return false;
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }

  /**
   * Get the number of attempts made in the current window
   */
  getAttemptCount(key: string, windowMs: number): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    return attempts.filter(time => now - time < windowMs).length;
  }

  /**
   * Get time until the user can try again (in milliseconds)
   */
  getRetryAfter(key: string, windowMs: number): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;

    const now = Date.now();
    const oldestAttempt = Math.min(...attempts);
    const timeUntilReset = windowMs - (now - oldestAttempt);

    return Math.max(0, timeUntilReset);
  }

  /**
   * Clear rate limit for a specific key
   */
  clear(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limits (useful for logout)
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Pre-defined rate limit configurations
export const RATE_LIMITS = {
  // Post creation: 5 posts per minute
  POST_CREATE: { maxAttempts: 5, windowMs: 60 * 1000 },
  
  // Comment creation: 10 comments per minute
  COMMENT_CREATE: { maxAttempts: 10, windowMs: 60 * 1000 },
  
  // Fire reactions: 20 per minute
  FIRE_REACTION: { maxAttempts: 20, windowMs: 60 * 1000 },
  
  // Follow/Unfollow: 30 per minute
  FOLLOW_ACTION: { maxAttempts: 30, windowMs: 60 * 1000 },
  
  // Search queries: 60 per minute
  SEARCH_QUERY: { maxAttempts: 60, windowMs: 60 * 1000 },
  
  // Profile updates: 5 per minute
  PROFILE_UPDATE: { maxAttempts: 5, windowMs: 60 * 1000 },
  
  // Upload: 3 per 5 minutes
  UPLOAD_MEDIA: { maxAttempts: 3, windowMs: 5 * 60 * 1000 },
};

/**
 * Helper function to check rate limit with toast notification
 */
export function checkRateLimit(
  key: string, 
  config: RateLimitConfig,
  errorMessage?: string
): boolean {
  const canProceed = rateLimiter.canProceed(key, config.maxAttempts, config.windowMs);
  
  if (!canProceed) {
    const retryAfter = rateLimiter.getRetryAfter(key, config.windowMs);
    const retrySeconds = Math.ceil(retryAfter / 1000);
    
    const message = errorMessage || 
      `Ralentis un peu! Réessaye dans ${retrySeconds} secondes.`;
    
    // Import toast dynamically to avoid circular dependency
    import('../components/Toast').then(({ toast }) => {
      toast.error(message);
    });
    
    return false;
  }
  
  return true;
}

