import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { traceSupabase } from "./tracer.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// FALLBACK: Prioritize Anon Key for verification as Service Role Key is reporting invalid
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Track if Supabase is properly configured
const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_KEY);

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase environment variables missing. JWT Auth will fail.",
  );
  console.warn(
    "   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.",
  );
}

// Create the Supabase client (exported for auto-provisioning in routes)
export let supabaseAdmin: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verifies a Supabase JWT and returns the user ID if valid.
 * This is stateless and serverless-friendly.
 */
export async function verifyAuthToken(token: string): Promise<string | null> {
  // If Supabase is not configured, auth always fails
  if (!supabaseAdmin) {
    console.warn("Auth verification skipped: Supabase not configured");
    return null;
  }

  return traceSupabase(
    "auth.getUser",
    { "auth.method": "jwt_verification" },
    async (span) => {
      try {
        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !data.user) {
          if (error) {
            console.error("JWT Verification failed:", error.message);
            span.setAttributes({ "auth.error": error.message });
          }
          span.setAttributes({ "auth.success": false });
          return null;
        }

        span.setAttributes({
          "auth.success": true,
          "auth.user_id": data.user.id,
        });
        return data.user.id;
      } catch (err) {
        console.error("Unexpected auth error:", err);
        span.setAttributes({ "auth.success": false });
        return null;
      }
    },
  );
}
