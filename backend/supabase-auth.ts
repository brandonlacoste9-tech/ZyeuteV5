import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { traceSupabase } from "./tracer.js";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage.js";

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
        const { data, error } = await supabaseAdmin!.auth.getUser(token);

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

/**
 * Hybrid Auth Middleware
 * Accepts Authorization: Bearer <jwt>
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const userId = await verifyAuthToken(token);

    if (userId) {
      const user = await storage.getUser(userId);
      if (user?.role === "banned") {
        return res.status(403).json({
          error: "Votre compte a été désactivé.",
          isBanned: true,
        });
      }

      (req as any).userId = userId;
      (req as any).userRole = user?.role || "citoyen";
      return next();
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
}

/**
 * Optional Auth Middleware
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const userId = await verifyAuthToken(token);

    if (userId) {
      const user = await storage.getUser(userId);
      (req as any).userId = userId;
      (req as any).userRole = user?.role || "citoyen";
    }
  }
  next();
}
