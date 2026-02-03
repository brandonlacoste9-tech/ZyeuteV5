/**
 * Startup env validation – fail fast with clear messages.
 * Required for: feed, auth, and basic server operation.
 */

const REQUIRED = ["DATABASE_URL"] as const;

const RECOMMENDED = [
  "SESSION_SECRET",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function validateEnv(): {
  ok: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED) {
    const val = process.env[key];
    if (val === undefined || val === "") {
      missing.push(key);
    }
  }

  for (const key of RECOMMENDED) {
    const val = process.env[key];
    if (val === undefined || val === "") {
      warnings.push(key);
    }
  }

  return { ok: missing.length === 0, missing, warnings };
}

export function assertEnv(): void {
  const { ok, missing, warnings } = validateEnv();
  if (!ok) {
    console.error("🔥 [Startup] Missing required environment variables:");
    missing.forEach((k) => console.error(`   - ${k}`));
    console.error("   Set them in .env or your deployment environment.");
    process.exit(1);
  }
  if (warnings.length > 0) {
    console.warn(
      "⚠️ [Startup] Recommended env not set (auth/upload may be limited):",
      warnings.join(", "),
    );
  }
}
