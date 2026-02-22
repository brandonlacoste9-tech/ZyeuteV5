/**
 * Check required and recommended env vars (no values printed).
 * Loads .env then .env.local (override), same order as backend/index.ts.
 * Usage: npm run check:env  or  npx tsx scripts/check-env.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const REQUIRED = ["DATABASE_URL"];
const RECOMMENDED = [
  "SESSION_SECRET",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const DATABASE_URL_PLACEHOLDER = "[YOUR-PASSWORD]";

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  const content = readFileSync(path, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      const val = m[2].replace(/^["']|["']$/g, "").trim();
      out[m[1]] = val;
    }
  }
  return out;
}

function loadEnv(): Record<string, string> {
  const base = loadEnvFile(resolve(process.cwd(), ".env"));
  const local = loadEnvFile(resolve(process.cwd(), ".env.local"));
  return { ...base, ...local };
}

function main() {
  const env = { ...process.env, ...loadEnv() };
  const missing = REQUIRED.filter((k) => !env[k] || env[k] === "");
  const recommendedMissing = RECOMMENDED.filter(
    (k) => !env[k] || env[k] === "",
  );

  let exit = 0;

  if (env.DATABASE_URL && env.DATABASE_URL.includes(DATABASE_URL_PLACEHOLDER)) {
    console.error(
      "DATABASE_URL still contains the placeholder. Update .env.local with your real DB password from Supabase:",
    );
    console.error(
      "  https://app.supabase.com/project/vuanulvyqkfefmjcikfk/settings/database",
    );
    exit = 1;
  }

  if (missing.length > 0) {
    console.error("Missing required env:");
    missing.forEach((k) => console.error("  -", k));
    if (!env.DATABASE_URL?.includes(DATABASE_URL_PLACEHOLDER)) {
      console.error(
        "Tip: Backend loads .env then .env.local (override). Use .env.local for local DB password.",
      );
    }
    exit = 1;
  } else if (exit === 0) {
    console.log("Required env: OK");
  }

  if (recommendedMissing.length > 0) {
    console.warn(
      "Recommended (auth/upload) not set:",
      recommendedMissing.join(", "),
    );
  } else {
    console.log("Recommended env: OK");
  }
  process.exit(exit);
}

main();
