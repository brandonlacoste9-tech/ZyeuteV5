import { Request, Response, NextFunction } from "express";

// Simple in-memory cache for API endpoints
const cacheStore = new Map<string, { data: any; expiresAt: number }>();

/**
 * Express middleware to cache GET requests for a specified duration
 * @param durationSeconds How long to keep the response in cache
 */
export const cacheMiddleware = (durationSeconds: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests (don't cache POST, PUT, DELETE)
    if (req.method !== "GET") {
      return next();
    }

    // Include userId in the cache key if present, so different users don't get the same cached private data under the same URL
    const userId = (req as any).userId || "anonymous";
    const key = `cache_${userId}_${req.originalUrl || req.url}`;

    const cachedItem = cacheStore.get(key);
    if (cachedItem && Date.now() < cachedItem.expiresAt) {
      console.log(`[Cache Hit] ${req.method} ${req.originalUrl}`);
      return res.json(cachedItem.data);
    }

    // Wrap res.json to capture the response body and cache it
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Don't cache error responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          data: body,
          expiresAt: Date.now() + durationSeconds * 1000,
        });
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache for a specific path substring. Useful for invalidation.
 */
export const invalidateCache = (pathSubstring: string) => {
  let cleared = 0;
  for (const key of cacheStore.keys()) {
    if (key.includes(pathSubstring)) {
      cacheStore.delete(key);
      cleared++;
    }
  }
  console.log(
    `[Cache] Invalidated ${cleared} entries matching '${pathSubstring}'`,
  );
};
