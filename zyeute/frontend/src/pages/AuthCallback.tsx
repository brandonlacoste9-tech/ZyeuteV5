/**
 * OAuth Callback Handler
 * Handles the OAuth redirect from providers like Google
 *
 * Supports both:
 * 1. Hash-based OAuth (automatic with detectSessionInUrl)
 * 2. Code-based OAuth (explicit exchangeCodeForSession)
 */

import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// TODO: Replace with authClient abstraction once Clerk is integrated
// Clerk handles OAuth callbacks automatically, so this file may be simplified
import { supabase } from "@/lib/supabase"; // Keep direct import for exchangeCodeForSession
import { LoadingScreen } from "@/components/LoadingScreen";
import { logger } from "../lib/logger";

const authCallbackLogger = logger.withContext("AuthCallback");

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processedRef = React.useRef(false); // Ref to prevention double-fire in Strict Mode

  useEffect(() => {
    // Prevent double invocation
    if (processedRef.current) return;
    processedRef.current = true;

    const handleAuth = async () => {
      authCallbackLogger.debug("🔍 AuthCallback processing...");

      // 1. Check for specific error params
      const errorStr = searchParams.get("error");
      const errorDesc = searchParams.get("error_description");
      if (errorStr) {
        authCallbackLogger.error("OAuth Error:", errorStr, errorDesc);
        navigate(`/login?error=${encodeURIComponent(errorStr)}`, {
          replace: true,
        });
        return;
      }

      // 2. Check for Code (PKCE Flow)
      // TODO: Clerk handles OAuth callbacks automatically - this may not be needed
      const code = searchParams.get("code");
      if (code) {
        authCallbackLogger.debug("Exchange code detected.");
        // TODO: Replace with Clerk OAuth handling once integrated
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          authCallbackLogger.error("Exchange failed:", error);
          navigate(`/login?error=${encodeURIComponent(error.message)}`, {
            replace: true,
          });
          return;
        }
        if (data?.session) {
          authCallbackLogger.debug("Session established via Code Exchange.");
          // Wait a tick to ensure storage sync
          setTimeout(() => navigate("/", { replace: true }), 100);
          return;
        }
      }

      // 3. Check for implicit hash fragment (Supabase often handles this automatically)
      // We'll give Supabase a moment to detect the session from the URL hash
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (session) {
        authCallbackLogger.debug("Session detected automatically.");
        navigate("/", { replace: true });
        return;
      }

      // 4. Fallback listener
      // If code/hash wasn't immediately present or processed, listen for the event
      const { data: authData } = supabase.auth.onAuthStateChange(
        (event: any, session: any) => {
          if (event === "SIGNED_IN" && session) {
            authCallbackLogger.debug("Signed In event captured.");
            authData.subscription.unsubscribe();
            navigate("/", { replace: true });
          }
        },
      );

      // Timeout fallback if nothing happens
      setTimeout(() => {
        // Final check
        supabase.auth.getSession().then(({ data: sessionData }: any) => {
          if (sessionData.session) {
            navigate("/", { replace: true });
          } else {
            authCallbackLogger.warn("Auth timeout - redirecting to login");
            navigate("/login?error=timeout", { replace: true });
          }
        });
      }, 4000);
    };

    handleAuth();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
      <LoadingScreen message="Connexion sécurisée..." />
      <p className="text-zinc-500 text-xs">Vérification des identifiants...</p>
    </div>
  );
};

export default AuthCallback;
