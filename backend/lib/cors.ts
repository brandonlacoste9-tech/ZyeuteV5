import type { CorsOptions } from "cors";

// Sane default allowlist. Used when CORS_ALLOWED_ORIGINS is unset so that a
// missing env var on a deploy target (e.g. Render) can never strip the
// production frontend's access or crash request handling.
export const DEFAULT_ALLOWED_ORIGINS: readonly string[] = [
  "https://zyeute-v5.vercel.app",
  "https://www.zyeute.com",
  "https://zyeute.com",
  "https://zyeute.vercel.app",
  "https://zyeutev5-production.up.railway.app",
  "https://zyeutev5-1.onrender.com",
  "http://localhost:12000",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

// Resolve the allowlist from CORS_ALLOWED_ORIGINS (comma-separated) and merge in
// the defaults so config can extend — never silently shrink — the safe baseline.
export function resolveAllowedOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const fromEnv = (env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv]));
}

// Build the cors() options. The origin callback NEVER passes an Error: a
// disallowed origin resolves with `false`, so the cors middleware simply omits
// the Access-Control-Allow-Origin header and the request continues to its route
// (which returns its normal status). This prevents a disallowed Origin from
// bubbling an Error into Express's default handler and producing a 500.
export function buildCorsOptions(
  allowedOrigins: string[] = resolveAllowedOrigins(),
): CorsOptions {
  return {
    origin(origin, callback) {
      // Requests with no Origin header (curl, server-to-server, same-origin
      // navigations) are always allowed.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.log(`[CORS] Blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  };
}
