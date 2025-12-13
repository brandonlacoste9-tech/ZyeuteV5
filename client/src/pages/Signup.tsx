/**
 * Signup Page - Premium Quebec Heritage Design
 * Matching the luxury login aesthetic
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { signUp } from '@/lib/supabase';
import { toast } from '@/components/Toast';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const isMountedRef = React.useRef(true);
  const navigationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Cleanup on unmount to prevent state updates after navigation
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMountedRef.current) return;
    
    setError('');

    // Validation
    if (username.length < 3) {
      setError('Le nom d\'utilisateur doit avoir au moins 3 caractères');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit avoir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, username);

      if (error) throw error;

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      // Show success toast (non-blocking)
      toast.success('Compte créé! Vérifie ton courriel pour confirmer ton compte.');
      
      // Use window.location for immediate redirect to bypass animation system
      // This prevents React DOM manipulation errors with AnimatePresence
      navigationTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          // Use window.location instead of navigate() to bypass PageTransition animations
          // This prevents AnimatePresence from trying to animate during unmount
          window.location.href = '/login';
        }
      }, 150);
    } catch (err: any) {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors de l\'inscription');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative leather-bg fur-overlay">
      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center animate-fade-in">
          <Logo size="xl" showText={true} linkTo={null} className="mb-4" />
          <p className="text-gold-400 text-sm font-semibold tracking-wider mb-1 embossed">
            REJOINS LA COMMUNAUTÉ QUÉBÉCOISE
          </p>
          <p className="text-white/80 text-sm embossed">Fait au Québec, pour le Québec 🇨🇦⚜️</p>
        </div>

        {/* Signup Form */}
        <div className="leather-card rounded-2xl p-8 stitched animate-fade-in">
          <h2 className="text-2xl font-bold text-gold-400 mb-6 embossed">
            Inscription
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-3 mb-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gold-400 font-semibold mb-2 text-sm embossed">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
                placeholder="tonusername"
                className="input-premium"
              />
              <p className="text-leather-400 text-xs mt-1">
                Lettres minuscules, chiffres et _ seulement
              </p>
            </div>

            <div>
              <label className="block text-gold-400 font-semibold mb-2 text-sm embossed">
                Courriel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ton@email.com"
                className="input-premium"
              />
            </div>

            <div>
              <label className="block text-gold-400 font-semibold mb-2 text-sm embossed">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-premium"
              />
              <p className="text-leather-400 text-xs mt-1">
                Minimum 6 caractères
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full btn-gold"
              isLoading={isLoading}
            >
              Créer mon compte
            </Button>
          </form>

          {/* Terms */}
          <p className="text-center text-leather-400 text-xs mt-6">
            En t&apos;inscrivant, tu acceptes nos{' '}
            <Link to="/legal/terms" className="text-gold-400 hover:underline">
              Conditions d&apos;utilisation
            </Link>
            {' '}et notre{' '}
            <Link to="/legal/privacy" className="text-gold-400 hover:underline">
              Politique de confidentialité
            </Link>
          </p>

          {/* Login link */}
          <p className="text-center text-white/80 text-sm mt-6 embossed">
            Déjà un compte?{' '}
            <Link to="/login" className="text-gold-400 hover:underline font-semibold">
              Connecte-toi
            </Link>
          </p>
        </div>

        {/* Quebec Pride */}
        <div className="text-center mt-6 text-leather-400 text-sm">
          <p className="flex items-center justify-center gap-2 embossed">
            <span className="text-gold-500">⚜️</span>
            <span>Bienvenue dans la famille québécoise</span>
            <span className="text-gold-500">🦫</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
