import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import './ZyeuteLogin.css';

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add your email/password auth logic here
    console.log('Login:', { email, password });
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const { credential } = credentialResponse;
    try {
      const res = await fetch('/api/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('authToken', data.token);
        // Redirect to dashboard
      }
    } catch (err) {
      console.error(err);
    }
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

            <button type="submit" className="login-button">Entrer</button>
          </form>

          <div className="or-divider">Ou</div>

          <div className="social-buttons">
            <button type="button" className="guest-button">Continuer en tant qu'invité</button>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => console.log('Google Error')} />
          </div>

          <p className="signup-text">Pas encore icitte?<br /><strong>Embarque!</strong></p>
        </div>

        <button type="button" className="biometric-button">
          <svg viewBox="0 0 24 24" className="fingerprint-icon" fill="#1976d2">
            <path d="M12 2a10 10 0 00-10 10c0 2.5 1 4.7 2.6 6.3l1.4-1.4C4.8 15.8 4 13.9 4 12a8 8 0 1116 0c0 1.9-0.8 3.8-2 5l1.4 1.4C21 16.7 22 14.5 22 12a10 10 0 00-10-10z" />
            <path d="M12 6a6 6 0 00-6 6c0 1.4.5 2.7 1.3 3.7l1.4-1.4C8.3 13.6 8 12.8 8 12a4 4 0 118 0c0 .8-.3 1.6-.7 2.3l1.4 1.4C17.5 14.7 18 13.4 18 12a6 6 0 00-6-6z" />
            <path d="M12 10a2 2 0 00-2 2c0 .5.2.9.5 1.2l1.4-1.4c-.1-.1-.2-.3-.2-.5a1 1 0 112 0c0 .2-.1.4-.2.5l1.4 1.4c.3-.3.5-.7.5-1.2a2 2 0 00-2-2z" />
          </svg>
        </button>
      </div>
    </GoogleOAuthProvider>
  );
};

export default ZyeuteLogin;
