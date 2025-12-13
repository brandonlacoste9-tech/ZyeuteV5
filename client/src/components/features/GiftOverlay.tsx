/**
 * GiftOverlay - Animated gift celebration overlay with edge lighting
 * Shows beautiful animation when a gift is sent successfully
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils';

interface GiftOverlayProps {
  giftType: string;
  emoji: string;
  recipientName: string;
  isVisible: boolean;
  onComplete: () => void;
}

const GIFT_COLORS: Record<string, string> = {
  comete: '#9333EA', // purple
  feuille_erable: '#DC2626', // red
  fleur_de_lys: '#FFBF00', // gold
  feu: '#F97316', // orange
  coeur_or: '#FFBF00', // gold
};

interface ParticlePosition {
  left: number;
  top: number;
  duration: number;
  delay: number;
}

export const GiftOverlay: React.FC<GiftOverlayProps> = ({
  giftType,
  emoji,
  recipientName,
  isVisible,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  
  const glowColor = GIFT_COLORS[giftType] || '#FFBF00';

  // Stable ref for onComplete to prevent timer recreation
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Precompute particle positions once and keep stable
  const particlePositions = useMemo<ParticlePosition[]>(() => {
    return Array.from({ length: 12 }, () => ({
      left: 10 + Math.random() * 80,
      top: 10 + Math.random() * 80,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 1,
    }));
  }, []); // Empty deps = computed once per component mount

  useEffect(() => {
    if (!isVisible) {
      setPhase('enter');
      return;
    }
    
    setPhase('enter');
    
    const showTimer = setTimeout(() => setPhase('show'), 100);
    const exitTimer = setTimeout(() => setPhase('exit'), 2500);
    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [isVisible]); // Only depend on isVisible, use ref for callback

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden',
        phase === 'enter' && 'animate-fade-in',
        phase === 'exit' && 'animate-fade-out'
      )}
      data-testid="gift-overlay"
    >
      {/* Background overlay with pulse */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          animation: 'pulse 0.5s ease-in-out infinite alternate',
        }}
      />

      {/* Edge lighting effect - Gold border glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 100px ${glowColor}40, inset 0 0 200px ${glowColor}20`,
          animation: 'edgePulse 1s ease-in-out infinite alternate',
        }}
      />

      {/* Corner accent lights */}
      <div 
        className="absolute top-0 left-0 w-32 h-32"
        style={{
          background: `radial-gradient(circle at top left, ${glowColor}60 0%, transparent 70%)`,
          animation: 'cornerGlow 1.5s ease-in-out infinite alternate',
        }}
      />
      <div 
        className="absolute top-0 right-0 w-32 h-32"
        style={{
          background: `radial-gradient(circle at top right, ${glowColor}60 0%, transparent 70%)`,
          animation: 'cornerGlow 1.5s ease-in-out infinite alternate 0.3s',
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-32 h-32"
        style={{
          background: `radial-gradient(circle at bottom left, ${glowColor}60 0%, transparent 70%)`,
          animation: 'cornerGlow 1.5s ease-in-out infinite alternate 0.6s',
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-32 h-32"
        style={{
          background: `radial-gradient(circle at bottom right, ${glowColor}60 0%, transparent 70%)`,
          animation: 'cornerGlow 1.5s ease-in-out infinite alternate 0.9s',
        }}
      />

      {/* Floating particles - positions are memoized for stability */}
      {particlePositions.map((particle, i) => (
        <div
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animation: `float ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
            opacity: 0.8,
          }}
        >
          {emoji}
        </div>
      ))}

      {/* Main gift animation */}
      <div
        className={cn(
          'relative flex flex-col items-center gap-4 transform',
          phase === 'enter' && 'scale-0',
          phase === 'show' && 'scale-100 animate-bounce-in',
          phase === 'exit' && 'scale-0 opacity-0 transition-all duration-500'
        )}
      >
        {/* Large emoji with glow */}
        <div 
          className="text-9xl filter drop-shadow-2xl"
          style={{
            animation: 'giftBounce 0.6s ease-in-out infinite',
            filter: `drop-shadow(0 0 30px ${glowColor})`,
          }}
        >
          {emoji}
        </div>

        {/* Message */}
        <div 
          className="bg-black/80 backdrop-blur-md rounded-2xl px-8 py-4 border-2 text-center"
          style={{
            borderColor: glowColor,
            boxShadow: `0 0 30px ${glowColor}60`,
          }}
        >
          <p className="text-white text-xl font-bold mb-1">Cadeau envoyé! 🎉</p>
          <p className="text-gold-400 text-lg">
            Pour <span className="font-bold">{recipientName}</span>
          </p>
        </div>

        {/* Sparkle ring */}
        <div
          className="absolute inset-0 rounded-full border-4 border-dashed opacity-50"
          style={{
            borderColor: glowColor,
            animation: 'spin 3s linear infinite',
            width: '300px',
            height: '300px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes edgePulse {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes cornerGlow {
          0% { opacity: 0.3; transform: scale(1); }
          100% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes giftBounce {
          0%, 100% { transform: scale(1) rotate(-3deg); }
          50% { transform: scale(1.1) rotate(3deg); }
        }
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-fade-out {
          animation: fadeOut 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default GiftOverlay;
