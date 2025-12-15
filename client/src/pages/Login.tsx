/**
 * Login Page - Luxury Quebec Heritage Design
 * Beaver leather texture with gold fleur-de-lys
 * Includes Guest Access "Backdoor"
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logger } from '../lib/logger';
import copy from '../lib/copy';
import { GUEST_MODE_KEY, GUEST_TIMESTAMP_KEY, GUEST_VIEWS_KEY } from '../lib/constants';

const loginLogger = logger.withContext('Login');

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Check if already logged in
  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const { getCurrentUser } = await import('../lib/supabase');
        const user = await getCurrentUser();
        if (user) {
          loginLogger.info('✅ User already logged in, redirecting...');
          window.location.href = '/';
        }
      } catch (err) {
        // Not logged in, stay on login page
        loginLogger.debug('No existing session found');
      }
    };
    checkUser();
  }, [navigate]);

  // ✅ Guest Login Handler - Sets 24h session
  const handleGuestLogin = (e: React.MouseEvent) => {
    e.preventDefault(); // Stop form submission
    setIsLoading(true);
    loginLogger.info('🎭 Guest login initiated');
    
    // Set guest mode flags in localStorage
    localStorage.setItem(GUEST_MODE_KEY, 'true');
    localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
    localStorage.setItem(GUEST_VIEWS_KEY, '0');
    
    // Simulate a short delay for UX, then navigate
    setTimeout(() => {
        window.location.href = '/';
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // ✅ DIRECT CLIENT-SIDE AUTH - No server proxy
      const { signIn } = await import('../lib/supabase');
      const { data, error } = await signIn(email, password);

      if (error) {
        loginLogger.error('❌ Sign in error:', error.message);
        throw new Error(error.message || 'Erreur de connexion');
      }

      if (!data.user) {
        throw new Error('Erreur de connexion');
      }

      loginLogger.info('✅ User signed in:', data.user.email);

      // Clear guest mode on successful login
      localStorage.removeItem(GUEST_MODE_KEY);
      localStorage.removeItem(GUEST_TIMESTAMP_KEY);
      localStorage.removeItem(GUEST_VIEWS_KEY);

      // Redirect to home
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { signInWithGoogle } = await import('../lib/supabase');
      const { data, error } = await signInWithGoogle();

      if (error) {
        loginLogger.error('❌ Google OAuth error:', error.message);
        throw error;
      }
      loginLogger.info('✅ Google OAuth initiated:', data);
    } catch (err: any) {
      loginLogger.error('❌ Google sign-in error:', err);
      setError(err?.message || 'Erreur de connexion avec Google');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1510 50%, #0d0b09 100%)',
      }}
    >
      {/* Leather Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gold Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,191,0,0.15) 0%, rgba(255,191,0,0.05) 40%, transparent 70%)',
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Glowing Fleur-de-lys Logo */}
        <div className="text-center mb-10 overflow-visible">
          <div className="relative inline-block overflow-visible">
            <div 
              className="absolute inset-0 blur-xl opacity-60"
              style={{
                background: 'radial-gradient(circle, rgba(255,191,0,0.6) 0%, transparent 70%)',
                transform: 'scale(1.5)',
              }}
            />
            
            <div 
              className="relative w-28 h-28 mx-auto rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
                border: '3px solid transparent',
                backgroundClip: 'padding-box',
                boxShadow: `0 0 40px rgba(255,191,0,0.3), 0 0 80px rgba(255,191,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}
            >
              <div 
                className="absolute inset-0 rounded-2xl"
                style={{
                  border: '2px solid rgba(255,191,0,0.6)',
                  boxShadow: '0 0 20px rgba(255,191,0,0.4), inset 0 0 20px rgba(255,191,0,0.1)',
                }}
              />
              
              <svg 
                viewBox="0 0 100 100" 
                className="w-16 h-16 relative z-10"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255,191,0,0.8)) drop-shadow(0 0 20px rgba(255,191,0,0.4))',
                }}
              >
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFC125" />
                    <stop offset="100%" stopColor="#DAA520" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 5 C50 5 45 15 45 22 C45 27 47 30 50 32 C53 30 55 27 55 22 C55 15 50 5 50 5 Z M50 32 L50 45 M35 35 C25 30 20 35 20 42 C20 48 25 52 32 50 C38 48 42 44 45 40 M65 35 C75 30 80 35 80 42 C80 48 75 52 68 50 C62 48 58 44 55 40 M50 45 L50 75 M50 55 L35 70 C30 75 25 78 25 85 C25 90 30 92 35 90 M50 55 L65 70 C70 75 75 78 75 85 C75 90 70 92 65 90 M40 75 L60 75 L55 85 L45 85 Z"
                  fill="none"
                  stroke="url(#goldGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <h1 
            className="text-5xl font-black mt-6 tracking-wide"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              background: 'linear-gradient(180deg, #FFF8DC 0%, #FFE55C 15%, #FFD700 30%, #DAA520 60%, #B8860B 85%, #8B6914 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.6)) drop-shadow(0 3px 6px rgba(0,0,0,0.9))',
              lineHeight: '1.2',
              paddingTop: '0.25rem',
              letterSpacing: '0.03em',
            }}
          >
            Zyeuté
          </h1>
          <p className="text-sm font-bold tracking-[0.3em] mt-2" style={{ color: '#DAA520' }}>
            L'APP SOCIALE DU QUÉBEC
          </p>
        </div>

        {/* Login Card */}
        <div 
          className="rounded-3xl p-8 relative"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, rgba(80, 60, 45, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(60, 45, 35, 0.15) 0%, transparent 50%), linear-gradient(145deg, #3a2a22 0%, #251a15 50%, #1a1210 100%)`,
            border: '1px solid rgba(139, 90, 43, 0.4)',
            boxShadow: `0 25px 50px rgba(0,0,0,0.6), 0 0 30px rgba(255,191,0,0.1), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.5)`,
          }}
        >
          {/* Gold Stitching */}
          <div 
            className="absolute rounded-2xl pointer-events-none"
            style={{
              inset: '8px',
              border: '2px dashed rgba(218, 165, 32, 0.7)',
              boxShadow: '0 0 8px rgba(255, 215, 0, 0.4), inset 0 0 6px rgba(255, 215, 0, 0.2)',
            }}
          />

          <h2 className="text-2xl font-bold mb-6 slide-up" style={{ color: '#E8DCC4' }}>
            {copy.auth.login}
          </h2>

          {error && (
            <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#B8A88A' }}>Courriel</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ton@email.com"
                className="w-full rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none transition-all duration-300"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,191,0,0.2)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#B8A88A' }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none transition-all duration-300"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,191,0,0.2)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                    paddingRight: '48px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#B8A88A',
                    padding: '4px',
                  }}
                  title={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                  aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '13px',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
                className="hover:underline transition-all"
              >
                Mot de passe oublié?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 relative overflow-hidden group press-effect hover-glow"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC125 50%, #DAA520 100%)',
                color: '#1a1a1a',
                boxShadow: '0 4px 20px rgba(255,191,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? 'Connexion...' : copy.auth.loginButton}
              </span>
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,191,0,0.3), transparent)' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm" style={{ background: '#13120f', color: '#8B7355' }}>Ou</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 group press-effect hover-glow"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '2px solid rgba(255,191,0,0.3)',
                color: '#DAA520',
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {copy.auth.continueGoogle}
            </button>

            {/* ✅ NEW: Guest Login Button */}
            <button
              type="button" 
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 group press-effect hover-glow"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#E8DCC4',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              <span className="text-xl">🎭</span>
              Mode Invité (Accès Rapide)
            </button>
          </div>

          <p className="text-center text-sm mt-8" style={{ color: '#8B7355' }}>
            {copy.auth.noAccount}{' '}
            <Link to="/signup" className="font-bold transition-colors link-underline" style={{ color: '#DAA520' }}>
              {copy.auth.signupButton}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: '#5C4D3C' }}>
          Fait avec fierté au Québec 🦫⚜️
        </p>
      </div>
    </div>
  );
};

export default Login;
