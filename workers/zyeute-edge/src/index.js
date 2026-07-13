/**
 * zyeute-edge — Cloudflare Worker API edge cache + keep-warm in front of Render.
 *
 * - Public GET cache in KV (never for Authorization-bearing requests)
 * - Stale-while-revalidate: serve soft-expired cache while refreshing origin
 * - Cron (scheduled) pings health + warms hot keys so Render stays awake
 */

const ORIGIN = "https://zyeutev5-bg8t.onrender.com";

/** Soft TTL = serve as fresh. After soft, still serve stale while revalidating until hard. */
const PUBLIC_CACHE_RULES = [
  { re: /^\/api\/health(\/|$)/, soft: 15, hard: 60 },
  { re: /^\/api\/cennes\/catalog/, soft: 120, hard: 600 },
  { re: /^\/api\/gifts\/catalog/, soft: 120, hard: 600 },
  { re: /^\/api\/users\/[^/]+$/, soft: 45, hard: 180 },
  { re: /^\/api\/users\/[^/]+\/posts/, soft: 30, hard: 120 },
  { re: /^\/api\/gamification\/profile\//, soft: 60, hard: 300 },
  // NOTE: do NOT cache /api/feed* — personalization + seen-ids must stay fresh
  { re: /^\/api\/trending/, soft: 60, hard: 300 },
  { re: /^\/api\/sounds/, soft: 120, hard: 600 },
  { re: /^\/api\/search\//, soft: 30, hard: 120 },
];

/** Paths the cron warms every few minutes (keeps origin + KV hot). */
const WARM_PATHS = [
  "/api/health",
  "/api/cennes/catalog",
  "/api/gifts/catalog",
  "/api/users/ti_guy_bot",
  "/api/users/ti_guy_bot/posts",
];

function matchRule(pathname, search) {
  const path = pathname + (search || "");
  for (const rule of PUBLIC_CACHE_RULES) {
    if (rule.re.test(path)) return rule;
  }
  return null;
}

async function readKv(kv, key) {
  if (!kv) return null;
  try {
    return await kv.get(key, { type: "json" });
  } catch {
    return null;
  }
}

async function writeKv(kv, key, entry, hardSec) {
  if (!kv) return;
  try {
    await kv.put(key, JSON.stringify(entry), {
      expirationTtl: Math.max(60, hardSec + 30),
    });
  } catch {
    /* ignore */
  }
}

function headersToObject(headers) {
  const out = {};
  headers.forEach((value, key) => {
    const k = key.toLowerCase();
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

function applyCors(headers) {
  headers.set(
    "Access-Control-Allow-Origin",
    headers.get("Access-Control-Allow-Origin") || "*",
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Seen-Ids, X-Cron-Secret",
  );
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  return headers;
}

function cachedResponse(entry, edgeStatus, soft) {
  const headers = new Headers(entry.headers || {});
  headers.set("X-Zyeute-Edge", edgeStatus);
  headers.set(
    "Cache-Control",
    `public, max-age=${Math.min(30, soft || 15)}`,
  );
  applyCors(headers);
  return new Response(entry.body, {
    status: entry.status || 200,
    headers,
  });
}

async function fetchOrigin(pathname, search, request, ttlSoft) {
  const upstreamUrl = `${ORIGIN}${pathname}${search || ""}`;
  const method = request.method.toUpperCase();
  const init = {
    method,
    headers: request.headers,
    redirect: "follow",
  };
  if (method !== "GET" && method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  if (ttlSoft > 0 && method === "GET") {
    return fetch(upstreamUrl, {
      ...init,
      cf: {
        cacheTtl: ttlSoft,
        cacheEverything: true,
        cacheTtlByStatus: {
          "200-299": ttlSoft,
          "404": 10,
          "500-599": 0,
        },
      },
    });
  }
  return fetch(upstreamUrl, init);
}

async function storeOriginResponse(upstream, env, cacheKey, soft, hard) {
  const headers = applyCors(new Headers(upstream.headers));
  headers.set("X-Zyeute-Edge", "MISS");
  if (!upstream.ok) {
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  }
  const bodyText = await upstream.text();
  const now = Date.now();
  if (bodyText.length < 900_000) {
    await writeKv(
      env.CACHE,
      cacheKey,
      {
        status: upstream.status,
        headers: headersToObject(headers),
        body: bodyText,
        softExp: now + soft * 1000,
        hardExp: now + hard * 1000,
      },
      hard,
    );
  }
  headers.set("Cache-Control", `public, max-age=${Math.min(30, soft)}`);
  return new Response(bodyText, { status: upstream.status, headers });
}

async function revalidate(env, cacheKey, pathname, search, soft, hard) {
  try {
    const fakeReq = new Request(`${ORIGIN}${pathname}${search || ""}`, {
      method: "GET",
    });
    const upstream = await fetchOrigin(pathname, search, fakeReq, soft);
    if (!upstream.ok) return;
    const bodyText = await upstream.text();
    if (bodyText.length >= 900_000) return;
    const headers = applyCors(new Headers(upstream.headers));
    const now = Date.now();
    await writeKv(
      env.CACHE,
      cacheKey,
      {
        status: upstream.status,
        headers: headersToObject(headers),
        body: bodyText,
        softExp: now + soft * 1000,
        hardExp: now + hard * 1000,
      },
      hard,
    );
  } catch {
    /* ignore revalidate failures */
  }
}

async function handleFetch(request, env, ctx) {
  const url = new URL(request.url);

  if (url.pathname === "/__edge" || url.pathname === "/__edge/health") {
    return Response.json({
      ok: true,
      service: "zyeute-edge",
      origin: ORIGIN,
      features: ["kv-cache", "stale-while-revalidate", "cron-warm"],
      ts: new Date().toISOString(),
    });
  }

  let pathname = url.pathname;
  if (!pathname.startsWith("/api")) {
    pathname =
      "/api" + (pathname.startsWith("/") ? pathname : `/${pathname}`);
  }

  const method = request.method.toUpperCase();
  const hasAuth = Boolean(request.headers.get("Authorization"));
  const rule =
    method === "GET" && !hasAuth
      ? matchRule(pathname, url.search)
      : null;
  const soft = rule?.soft || 0;
  const hard = rule?.hard || 0;
  const cacheKey = `pub:v2:${method}:${pathname}${url.search}`;

  if (soft > 0) {
    const hit = await readKv(env.CACHE, cacheKey);
    if (hit?.body != null) {
      const now = Date.now();
      const softExp = hit.softExp || 0;
      const hardExp = hit.hardExp || 0;
      if (now < softExp) {
        return cachedResponse(hit, "HIT", soft);
      }
      if (now < hardExp) {
        // Stale but usable — refresh in background
        ctx.waitUntil(
          revalidate(env, cacheKey, pathname, url.search, soft, hard),
        );
        return cachedResponse(hit, "STALE", soft);
      }
    }
  }

  let upstream;
  try {
    upstream = await fetchOrigin(pathname, url.search, request, soft);
  } catch (err) {
    // Origin down — last-chance stale serve even past hardExp
    if (soft > 0) {
      const hit = await readKv(env.CACHE, cacheKey);
      if (hit?.body != null) {
        return cachedResponse(hit, "STALE-ORIGIN-DOWN", soft);
      }
    }
    return Response.json(
      {
        error: "Edge origin unreachable",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502, headers: { "X-Zyeute-Edge": "ORIGIN_ERROR" } },
    );
  }

  const headers = applyCors(new Headers(upstream.headers));
  headers.set("X-Zyeute-Edge", soft > 0 ? "MISS" : "BYPASS");

  if (soft > 0 && upstream.ok) {
    return storeOriginResponse(upstream, env, cacheKey, soft, hard);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

/** Cron: keep Render warm + seed KV for hot public paths. */
async function handleScheduled(env, ctx) {
  const results = [];
  for (const path of WARM_PATHS) {
    const u = new URL(path, "https://edge.internal");
    const pathname = u.pathname.startsWith("/api")
      ? u.pathname
      : `/api${u.pathname}`;
    const search = u.search;
    const rule = matchRule(pathname, search);
    const soft = rule?.soft || 30;
    const hard = rule?.hard || 120;
    const cacheKey = `pub:v2:GET:${pathname}${search}`;
    try {
      const res = await fetch(`${ORIGIN}${pathname}${search}`, {
        method: "GET",
        cf: {
          cacheTtl: soft,
          cacheEverything: true,
        },
      });
      if (res.ok) {
        const body = await res.text();
        if (body.length < 900_000) {
          const headers = applyCors(new Headers(res.headers));
          const now = Date.now();
          await writeKv(
            env.CACHE,
            cacheKey,
            {
              status: res.status,
              headers: headersToObject(headers),
              body,
              softExp: now + soft * 1000,
              hardExp: now + hard * 1000,
            },
            hard,
          );
        }
      }
      results.push({ path, status: res.status });
    } catch (e) {
      results.push({
        path,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  // Log for Workers Observability
  console.log("zyeute-edge warm", JSON.stringify(results));
  return results;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Authorization, Content-Type, X-Seen-Ids, X-Cron-Secret",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    return handleFetch(request, env, ctx);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(env, ctx));
  },
};
