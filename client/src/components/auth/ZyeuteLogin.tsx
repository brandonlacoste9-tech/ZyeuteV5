import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { signInWithBiometrics, isBiometricAvailable, signIn, signInWithGoogle } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import './ZyeuteLogin.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const FleurDeLis = () => (
  <svg viewBox="0 0 100 100" className="fleur-de-lis">
    <defs>
      <linearGradient id="goldGradient">
        <stop offset="0%" stopColor="#5b8de6" />
        <stop offset="100%" stopColor="#1976d2" />
      </linearGradient>
    </defs>
    <path d="M50 10 C30 30, 20 50, 20 70 L30 70 C30 60, 35 50, 50 50 C65 50, 70 60, 70 70 L80 70 C80 50, 70 30, 50 10 Z" fill="url(#goldGradient)" />
    <circle cx="50" cy="85" r="8" fill="url(#goldGradient)" />
  </svg>
);

const ZyeuteLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { enterGuestMode } = useAuth();

  useEffect(() => {
    // Check if biometric authentication is available
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('Login error:', msg);
        alert('Erreur de connexion: ' + msg);
      } else {
        console.log('✅ Connexion réussie!');
        // Auth context will handle the redirect
      }
    } catch (err) {
      console.error('Login failed:', err);
      alert('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const { data, error } = await signInWithGoogle();
      if (error) {
        const msg = (error as any)?.message || String(error);
        console.error('Google login error:', msg);
        alert('Erreur de connexion Google: ' + msg);
      } else {
        console.log('✅ Connexion Google réussie!');
      }
    } catch (err) {
      console.error('Google login failed:', err);
      alert('Erreur de connexion Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await signInWithBiometrics();
      if (error) {
        const msg = (error as any)?.message || String(error);
        console.error('Biometric login error:', msg);
        alert('Erreur d\'authentification biométrique: ' + msg);
      } else {
        console.log('✅ Authentification biométrique réussie!');
      }
    } catch (err) {
      console.error('Biometric login failed:', err);
      alert('Erreur d\'authentification biométrique');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    enterGuestMode();
    console.log('✅ Mode invité activé!');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="container">
        <div className="sparkles">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`sparkle sparkle-${i + 1}`} />
          ))}
        </div>

        <FleurDeLis />
        <h1 className="title">Zyeuté</h1>
        <p className="subtitle">L'APP SOCIALE DU QUÉBEC</p>

        <div className="login-card">
          <h2 className="card-title">Connecte-toi</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <input type="email" placeholder="Email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="password-wrapper">
              <input type="password" placeholder="Mot de passe" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <span className="forgot-password">Mot de passe oublié?</span>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Connexion...' : 'Entrer'}
            </button>
          </form>

          <div className="or-divider">Ou</div>

          <div className="social-buttons">
            <button type="button" className="guest-button" onClick={handleGuestMode} disabled={isLoading}>
              Continuer en tant qu'invité
            </button>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => console.log('Google Error')} />
          </div>

          <p className="signup-text">Pas encore icitte?<br /><strong>Embarque!</strong></p>
        </div>

        {/* [PHASE 9] Zero Tolerance Safety Policy Footer */}
        <div className="max-w-xs mx-auto mt-6 px-4 py-3 bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-xl text-center shadow-lg">
          <p className="text-[10px] text-red-400 font-bold uppercase tracking-[2px] mb-1">Sécurité Zyeuté</p>
          <p className="text-[10px] text-white/40 leading-tight">
            Politique de <span className="text-red-400">tolérance zéro</span> : toute forme de leurre ou grooming de mineurs entraîne un bannissement permanent immédiat.
          </p>
        </div>

        {biometricAvailable && (
          <button 
            type="button" 
            className="biometric-button" 
            onClick={handleBiometricLogin}
            disabled={isLoading}
            title="Authentification biométrique (Touch ID, Face ID, Windows Hello)"
          >
            <svg viewBox="0 0 24 24" className="fingerprint-icon" fill="#1976d2">
              <path d="M12 2a10 10 0 00-10 10c0 2.5 1 4.7 2.6 6.3l1.4-1.4C4.8 15.8 4 13.9 4 12a8 8 0 1116 0c0 1.9-0.8 3.8-2 5l1.4 1.4C21 16.7 22 14.5 22 12a10 10 0 00-10-10z" />
              <path d="M12 6a6 6 0 00-6 6c0 1.4.5 2.7 1.3 3.7l1.4-1.4C8.3 13.6 8 12.8 8 12a4 4 0 118 0c0 .8-.3 1.6-.7 2.3l1.4 1.4C17.5 14.7 18 13.4 18 12a6 6 0 00-6-6z" />
              <path d="M12 10a2 2 0 00-2 2c0 .5.2.9.5 1.2l1.4-1.4c-.1-.1-.2-.3-.2-.5a1 1 0 112 0c0 .2-.1.4-.2.5l1.4 1.4c.3-.3.5-.7.5-1.2a2 2 0 00-2-2z" />
            </svg>
            {isLoading && <span className="loading-spinner">⏳</span>}
          </button>
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default ZyeuteLogin;
