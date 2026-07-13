/**
 * zyeute-edge — Cloudflare Worker API edge cache in front of Render.
 *
 * Why: Render cold starts + slow public GETs (gift catalog, profiles, posts)
 * make the mobile app feel offline. This Worker caches safe public GETs in KV
 * (and Cloudflare edge cache) so Montreal/global clients get sub-100ms hits.
 *
 * Auth: requests with Authorization never use the public cache key — private
 * data is never shared across users.
 */

const ORIGIN = "https://zyeutev5-bg8t.onrender.com";

/** @type {Array<{ re: RegExp, ttl: number }>} */
const PUBLIC_CACHE_RULES = [
  { re: /^\/api\/health(\/|$)/, ttl: 15 },
  { re: /^\/api\/cennes\/catalog(\/|$|\?)/, ttl: 120 },
  { re: /^\/api\/gifts\/catalog(\/|$|\?)/, ttl: 120 },
  // Public profile shell
  { re: /^\/api\/users\/[^/]+$/, ttl: 45 },
  // Public post grid (no auth personalization on this route)
  { re: /^\/api\/users\/[^/]+\/posts(\?|$)/, ttl: 30 },
  // Gamification public profile strip
  { re: /^\/api\/gamification\/profile\/[^/]+$/, ttl: 60 },
];

/**
 * @param {string} pathname
 * @param {string} search
 */
function publicCacheTtl(pathname, search) {
  const path = pathname + (search || "");
  for (const rule of PUBLIC_CACHE_RULES) {
    if (rule.re.test(path)) return rule.ttl;
  }
  return 0;
}

/**
 * @param {Request} request
 * @param {string} cacheKey
 * @param {import("@cloudflare/workers-types").KVNamespace | undefined} kv
 */
async function readKvCache(kv, cacheKey) {
  if (!kv) return null;
  try {
    const raw = await kv.get(cacheKey, { type: "json" });
    if (!raw || typeof raw !== "object") return null;
    if (!raw.exp || raw.exp < Date.now()) return null;
    return raw;
  } catch {
    return null;
  }
}

/**
 * @param {import("@cloudflare/workers-types").KVNamespace | undefined} kv
 * @param {string} cacheKey
 * @param {{ status: number, headers: Record<string, string>, body: string }} entry
 * @param {number} ttlSec
 */
async function writeKvCache(kv, cacheKey, entry, ttlSec) {
  if (!kv) return;
  try {
    await kv.put(
      cacheKey,
      JSON.stringify({ ...entry, exp: Date.now() + ttlSec * 1000 }),
      { expirationTtl: Math.max(60, ttlSec + 30) },
    );
  } catch {
    // ignore KV write failures
  }
}

/**
 * @param {Headers} headers
 */
function headersToObject(headers) {
  /** @type {Record<string, string>} */
  const out = {};
  headers.forEach((value, key) => {
    const k = key.toLowerCase();
    // Drop hop-by-hop / encoding issues for re-serve
    if (
      k === "content-encoding" ||
      k === "transfer-encoding" ||
      k === "connection" ||
      k === "keep-alive"
    ) {
      return;
    }
    out[key] = value;
  });
  return out;
}

/**
 * @param {Request} request
 * @param {Env} env
 * @param {ExecutionContext} ctx
 */
async function handle(request, env, ctx) {
  const url = new URL(request.url);

  // Health of the edge itself
  if (url.pathname === "/__edge" || url.pathname === "/__edge/health") {
    return Response.json({
      ok: true,
      service: "zyeute-edge",
      origin: ORIGIN,
      ts: new Date().toISOString(),
    });
  }

  // Normalize path: accept both /api/... and bare /...
  let pathname = url.pathname;
  if (!pathname.startsWith("/api")) {
    pathname = "/api" + (pathname.startsWith("/") ? pathname : `/${pathname}`);
  }

  const method = request.method.toUpperCase();
  const hasAuth = Boolean(request.headers.get("Authorization"));
  const ttl = method === "GET" && !hasAuth ? publicCacheTtl(pathname, url.search) : 0;
  const cacheKey = `pub:v1:${method}:${pathname}${url.search}`;

  if (ttl > 0) {
    const hit = await readKvCache(env.CACHE, cacheKey);
    if (hit && hit.body != null) {
      const headers = new Headers(hit.headers || {});
      headers.set("X-Zyeute-Edge", "HIT");
      headers.set("X-Zyeute-Edge-TTL", String(ttl));
      headers.set("Cache-Control", `public, max-age=${Math.min(30, ttl)}`);
      return new Response(hit.body, {
        status: hit.status || 200,
        headers,
      });
    }
  }

  const upstreamUrl = `${ORIGIN}${pathname}${url.search}`;
  /** @type {RequestInit} */
  const init = {
    method,
    headers: request.headers,
    redirect: "follow",
  };
  if (method !== "GET" && method !== "HEAD") {
    init.body = request.body;
    // @ts-expect-error duplex required for streaming body in Workers
    init.duplex = "half";
  }

  let upstream;
  try {
    // Prefer Cloudflare edge cache on origin fetch for public GETs
    if (ttl > 0) {
      upstream = await fetch(upstreamUrl, {
        ...init,
        cf: {
          cacheTtl: ttl,
          cacheEverything: true,
          cacheTtlByStatus: { "200-299": ttl, "404": 10, "500-599": 0 },
        },
      });
    } else {
      upstream = await fetch(upstreamUrl, init);
    }
  } catch (err) {
    return Response.json(
      {
        error: "Edge origin unreachable",
        detail: err instanceof Error ? err.message : String(err),
      },
      {
        status: 502,
        headers: { "X-Zyeute-Edge": "ORIGIN_ERROR" },
      },
    );
  }

  // Clone for optional KV write
  const headers = new Headers(upstream.headers);
  headers.set("X-Zyeute-Edge", ttl > 0 ? "MISS" : "BYPASS");
  headers.set("Access-Control-Allow-Origin", headers.get("Access-Control-Allow-Origin") || "*");
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Seen-Ids, X-Cron-Secret",
  );
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );

  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (ttl > 0 && upstream.ok) {
    const bodyText = await upstream.clone().text();
    // Cap KV entry size (~2MB soft limit; keep profiles/posts small)
    if (bodyText.length < 900_000) {
      const entry = {
        status: upstream.status,
        headers: headersToObject(headers),
        body: bodyText,
      };
      ctx.waitUntil(writeKvCache(env.CACHE, cacheKey, entry, ttl));
    }
    headers.set("Cache-Control", `public, max-age=${Math.min(30, ttl)}`);
    return new Response(bodyText, { status: upstream.status, headers });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Authorization, Content-Type, X-Seen-Ids, X-Cron-Secret",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    return handle(request, env, ctx);
  },
};
