/**
 * GuestBanner Component
 * Conversion funnel for guest users to create an account
 * Shows after 3 views with countdown timer
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useGuestMode } from '../hooks/useGuestMode';

export const GuestBanner: React.FC = () => {
  const { isGuest, viewsCount, remainingTime } = useGuestMode();
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Don't show if not a guest, dismissed, or haven't viewed enough pages
  if (!isGuest || isDismissed || viewsCount < 3) return null;

  const hoursRemaining = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
      style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.95), rgba(218,165,32,0.95))',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(255,215,0,0.4)',
        borderTop: '2px solid rgba(255,215,0,0.8)',
      }}
    >
      <div>
        <p style={{ fontWeight: 'bold', color: '#1a1a1a', fontSize: '16px', marginBottom: '4px' }}>
          🎭 Mode Invité • {hoursRemaining}h {minutesRemaining}m restant
        </p>
        <p style={{ fontSize: '13px', color: '#3a2a22' }}>
          Créez un compte pour publier, aimer et sauvegarder des publications
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Link
          to="/signup"
          style={{
            padding: '10px 20px',
            background: '#1a1a1a',
            color: '#FFD700',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
          }}
        >
          Créer un compte
        </Link>
        <button
          onClick={() => setIsDismissed(true)}
          aria-label="Fermer"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: '#1a1a1a',
            padding: '8px',
            lineHeight: '1',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
