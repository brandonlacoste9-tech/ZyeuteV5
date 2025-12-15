/**
 * Reset Password Page
 * Allows user to set new password from email link
 * Matches luxury Quebec heritage design
 */
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  // Check if token is valid
  React.useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || type !== 'recovery') {
      setError('Lien de réinitialisation invalide ou expiré. Veuillez en demander un nouveau.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Veuillez remplir les deux champs de mot de passe');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('/login?reset=success');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Échec de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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

        <div className="w-full max-w-md relative z-10">
          <div className="text-center">
            <h1 
              className="text-5xl font-black mb-6 tracking-wide"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                background: 'linear-gradient(180deg, #FFF8DC 0%, #FFE55C 15%, #FFD700 30%, #DAA520 60%, #B8860B 85%, #8B6914 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.6)) drop-shadow(0 3px 6px rgba(0,0,0,0.9))',
              }}
            >
              Zyeuté
            </h1>
            
            <div 
              className="rounded-3xl p-8"
              style={{
                background: `linear-gradient(145deg, #3a2a22 0%, #251a15 50%, #1a1210 100%)`,
                border: '1px solid rgba(139, 90, 43, 0.4)',
                boxShadow: `0 25px 50px rgba(0,0,0,0.6), 0 0 30px rgba(255,191,0,0.1)`,
              }}
            >
              <div className="text-center mb-6">
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#10b981' }}>
                  Réinitialisation réussie
                </h2>
              </div>
              
              <p className="mb-6" style={{ color: '#E8DCC4' }}>
                Ton mot de passe a été mis à jour. Tu peux maintenant te connecter avec ton nouveau mot de passe.
              </p>
              
              <p className="text-sm" style={{ color: '#B8A88A' }}>
                Redirection vers la page de connexion...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h1 
            className="text-5xl font-black tracking-wide"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              background: 'linear-gradient(180deg, #FFF8DC 0%, #FFE55C 15%, #FFD700 30%, #DAA520 60%, #B8860B 85%, #8B6914 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.6)) drop-shadow(0 3px 6px rgba(0,0,0,0.9))',
            }}
          >
            Zyeuté
          </h1>
        </div>

        <div 
          className="rounded-3xl p-8"
          style={{
            background: `linear-gradient(145deg, #3a2a22 0%, #251a15 50%, #1a1210 100%)`,
            border: '1px solid rgba(139, 90, 43, 0.4)',
            boxShadow: `0 25px 50px rgba(0,0,0,0.6), 0 0 30px rgba(255,191,0,0.1)`,
          }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#E8DCC4' }}>
            Créer un nouveau mot de passe
          </h2>

          {error && (
            <div 
              className="rounded-xl p-4 mb-6" 
              style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}
            >
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password with Show Toggle */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#B8A88A' }}>
                Nouveau mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Confirm Password with Show Toggle */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#B8A88A' }}>
                Confirmer le mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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
                  onClick={() => setShowConfirm(!showConfirm)}
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
                  title={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'default' : 'pointer',
              }}
            >
              {isLoading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
