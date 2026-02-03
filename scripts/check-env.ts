/**
 * Check required and recommended env vars (no values printed).
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

function loadEnv(): Record<string, string> {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return {};
  const out: Record<string, string> = {};
  const content = readFileSync(p, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      const val = m[2].replace(/^["']|["']$/g, "").trim();
      out[m[1]] = val;
    }
  }
  return out;
}

function main() {
  const env = { ...process.env, ...loadEnv() };
  const missing = REQUIRED.filter((k) => !env[k] || env[k] === "");
  const recommendedMissing = RECOMMENDED.filter(
    (k) => !env[k] || env[k] === "",
  );

  let exit = 0;
  if (missing.length > 0) {
    console.error("Missing required env:");
    missing.forEach((k) => console.error("  -", k));
    exit = 1;
  } else {
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
