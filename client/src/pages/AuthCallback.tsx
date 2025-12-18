/**
 * OAuth Callback Handler
 * Handles the OAuth redirect from providers like Google
 * 
 * Supports both:
 * 1. Hash-based OAuth (automatic with detectSessionInUrl)
 * 2. Code-based OAuth (explicit exchangeCodeForSession)
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/LoadingScreen';
import { logger } from '../lib/logger';

const authCallbackLogger = logger.withContext('AuthCallback');


const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Log current URL state immediately for debugging
    authCallbackLogger.debug('🔍 AuthCallback mounted');
    authCallbackLogger.debug('Current URL:', window.location.href);
    authCallbackLogger.debug('Hash:', window.location.hash);
    authCallbackLogger.debug('Search params:', window.location.search);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let hasNavigated = false;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const exchangeCode = async () => {
      // Check for OAuth error in URL parameters
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      authCallbackLogger.debug('Checking for OAuth error:', error);

      if (error) {
        authCallbackLogger.error('❌ OAuth error:', error, errorDescription);
        hasNavigated = true;
        navigate(`/login?error=${encodeURIComponent(error || 'oauth_failed')}`, { replace: true });
        return;
      }

      // Check for code-based OAuth (query params)
      const code = searchParams.get('code');
      const provider = searchParams.get('provider') || 'google'; // Default to google if not specified

      authCallbackLogger.debug('Code param:', code);
      authCallbackLogger.debug('Provider param:', provider);

      if (code) {
        // Explicit code exchange flow
        authCallbackLogger.debug('Exchanging OAuth code for session...', { code, provider });

        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            authCallbackLogger.error('OAuth exchange error:', exchangeError);
            hasNavigated = true;
            navigate(`/login?error=${encodeURIComponent(exchangeError.message || 'exchange_failed')}`, { replace: true });
            return;
          }

          if (data?.session) {
            authCallbackLogger.debug('✅ Session established:', {
              user: data.session.user?.email,
              expiresAt: data.session.expires_at,
            });
            hasNavigated = true;
            navigate('/', { replace: true });
            return;
          } else {
            authCallbackLogger.warn('No session in exchange response');
            hasNavigated = true;
            navigate('/login?error=no_session', { replace: true });
            return;
          }
        } catch (error: any) {
          authCallbackLogger.error('OAuth exchange exception:', error);
          hasNavigated = true;
          navigate(`/login?error=${encodeURIComponent(error?.message || 'exchange_exception')}`, { replace: true });
          return;
        }
      }

      // Hash-based OAuth flow (detectSessionInUrl handles this automatically)
      authCallbackLogger.debug('No code param found, checking for hash-based OAuth...');
      authCallbackLogger.debug('Hash contains access_token:', window.location.hash.includes('access_token'));
      authCallbackLogger.debug('Hash contains type:', window.location.hash.includes('type='));

      // Listen for auth state changes to know when session is ready
      const { data } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
        const subscription = (data as any).subscription || data;
        authCallbackLogger.debug('🔔 Auth state change:', event, session ? 'has session' : 'no session');

        if (event === 'SIGNED_IN' && session) {
          authCallbackLogger.debug('✅ Signed in via hash-based OAuth:', {
            user: session.user?.email,
            expiresAt: session.expires_at,
          });
          hasNavigated = true;
          if (timeoutId) clearTimeout(timeoutId);
          if (authSubscription) authSubscription.unsubscribe();
          navigate('/', { replace: true });
        } else if (event === 'SIGNED_OUT') {
          authCallbackLogger.debug('Signed out');
          hasNavigated = true;
          if (timeoutId) clearTimeout(timeoutId);
          if (authSubscription) authSubscription.unsubscribe();
          navigate('/login', { replace: true });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          authCallbackLogger.debug('Token refreshed');
          hasNavigated = true;
          if (timeoutId) clearTimeout(timeoutId);
          if (authSubscription) authSubscription.unsubscribe();
          navigate('/', { replace: true });
        }
      });

      // Store the subscription object to be used for cleanup
      authSubscription = (data as any).subscription || data;

      // Also check current session immediately in case auth already completed
      const checkSession = async () => {
        try {
          authCallbackLogger.debug('🔍 Checking for existing session...');
          // Supabase's detectSessionInUrl should have processed hash-based OAuth already
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            authCallbackLogger.error('❌ Session error:', sessionError);
          }

          if (session) {
            authCallbackLogger.debug('✅ Session found immediately:', {
              user: session.user?.email,
              expiresAt: session.expires_at,
            });
            hasNavigated = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (authSubscription) authSubscription.unsubscribe();
            navigate('/', { replace: true });
            return;
          }

          authCallbackLogger.debug('⏳ No session yet, waiting for OAuth token exchange...');

          // If no session yet, wait a bit for OAuth token exchange to complete
          timeoutId = setTimeout(async () => {
            if (hasNavigated) {
              authCallbackLogger.debug('Already navigated, skipping retry');
              return;
            }

            authCallbackLogger.debug('🔄 Retrying session check...');
            try {
              const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();

              if (retryError) {
                authCallbackLogger.error('❌ Retry session error:', retryError);
              }

              if (retrySession) {
                authCallbackLogger.debug('✅ Session found on retry:', {
                  user: retrySession.user?.email,
                });
                hasNavigated = true;
                if (authSubscription) authSubscription.unsubscribe();
                navigate('/', { replace: true });
              } else {
                // Still no session after delay - likely a failed OAuth flow
                authCallbackLogger.warn('❌ No session established after OAuth callback');
                authCallbackLogger.warn('Current URL:', window.location.href);
                authCallbackLogger.warn('Hash:', window.location.hash);
                authCallbackLogger.warn('Search:', window.location.search);
                authCallbackLogger.warn('This usually means:');
                authCallbackLogger.warn('  1. OAuth callback URL not in Supabase Redirect URLs');
                authCallbackLogger.warn('  2. Google OAuth redirect URI mismatch');
                authCallbackLogger.warn('  3. Session not being stored properly');
                hasNavigated = true;
                if (authSubscription) authSubscription.unsubscribe();
                navigate('/login?error=no_session', { replace: true });
              }
            } catch (error) {
              authCallbackLogger.error('❌ Auth callback retry error:', error);
              hasNavigated = true;
              if (authSubscription) authSubscription.unsubscribe();
              navigate('/login?error=callback_failed', { replace: true });
            }
          }, 3000); // Wait 3 seconds for OAuth token exchange
        } catch (error) {
          authCallbackLogger.error('❌ Auth callback error:', error);
          hasNavigated = true;
          if (timeoutId) clearTimeout(timeoutId);
          if (authSubscription) authSubscription.unsubscribe();
          navigate('/login?error=callback_error', { replace: true });
        }
      };

      checkSession();
    };

    exchangeCode();

    // Cleanup function to prevent memory leaks
    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [navigate, searchParams]);

  return <LoadingScreen message="Connexion en cours..." />;
};

export default AuthCallback;
