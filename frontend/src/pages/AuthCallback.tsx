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
import { supabase } from "@/lib/supabase";
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
      const code = searchParams.get("code");
      if (code) {
        authCallbackLogger.debug("Exchange code detected.");
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

  // State to show manual entry if it takes too long
  const [showManual, setShowManual] = React.useState(false);

  useEffect(() => {
    // Show manual override after 3 seconds
    const timer = setTimeout(() => setShowManual(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-6">
      <div className="flex flex-col items-center gap-4">
        <LoadingScreen message="Connexion sécurisée..." />
        <p className="text-zinc-500 text-xs animate-pulse">Vérification des identifiants...</p>
      </div>

      {showManual && (
        <button
          onClick={() => navigate("/", { replace: true })}
          className="text-amber-500 hover:text-amber-400 text-sm underline decoration-amber-500/30 underline-offset-4 transition-colors p-2"
        >
          Ça prend trop de temps? Continuer
        </button>
      )}
    </div>
  );
};

export default AuthCallback;
