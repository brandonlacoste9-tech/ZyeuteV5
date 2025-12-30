/**
 * Admin role checking utilities
 * Checks via Supabase User Metadata for admin status
 * Migration: Replaces legacy session-based /api/auth/me check
 */

import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { logger } from "./logger";

const adminLogger = logger.withContext("Admin");

/**
 * Check if current user is an admin via Supabase Metadata
 */
export async function checkIsAdmin(
  currentUser?: User | null,
): Promise<boolean> {
  try {
    let user = currentUser;
    if (!user) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    if (!user) {
      adminLogger.debug("No authenticated user found");
      return false;
    }

    // Check multiple common patterns for Admin flags in metadata
    // Priority: app_metadata (secure, set by service role) > user_metadata (editable via dashboard)
    const isAdminViaMetadata =
      user.app_metadata?.role === "service_role" || // Supabase service role
      user.app_metadata?.role === "admin" || // Custom RBAC role
      user.user_metadata?.is_admin === true || // Boolean flag
      user.user_metadata?.role === "admin"; // String role

    if (isAdminViaMetadata) {
      adminLogger.debug("Admin status confirmed via Supabase Metadata");
      return true;
    }

    // 🛡️ Fallback: Query the public.user_profiles table directly
    // This is necessary because Supabase Auth metadata might not be synced with our custom table
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError) {
      adminLogger.warn(
        "Error fetching user profile for admin check",
        profileError,
      );
    }

    if (profile?.is_admin) {
      adminLogger.debug("Admin status confirmed via user_profiles table");
      return true;
    }

    adminLogger.debug("User is authenticated but not an admin", {
      id: user.id,
    });
    return false;
  } catch (error) {
    adminLogger.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get admin status with user details
 */
export async function getAdminStatus(): Promise<{
  isAdmin: boolean;
  user: unknown | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isAdmin: false, user: null };
    }

    // Reuse the robust logic from checkIsAdmin
    const isAdmin = await checkIsAdmin();
    return { isAdmin, user };
  } catch (error) {
    adminLogger.error("Error getting admin status:", error);
    return { isAdmin: false, user: null };
  }
}

/**
 * Hook-friendly admin check that returns loading state
 */
export async function useAdminCheck(): Promise<{
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}> {
  try {
    const isAdmin = await checkIsAdmin();
    return { isAdmin, isLoading: false, error: null };
  } catch (error) {
    return {
      isAdmin: false,
      isLoading: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
