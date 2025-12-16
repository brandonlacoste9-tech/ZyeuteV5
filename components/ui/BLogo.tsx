'use client';

import { cn } from '@/lib/utils';

interface BLogoProps {
  size?: number;
  className?: string;
  state?: 'idle' | 'thinking' | 'speaking' | 'error';
  animated?: boolean;
}

export function BLogo({ 
  size = 48, 
  className = '', 
  state = 'idle',
  animated = false 
}: BLogoProps) {
  const stateAnimations = {
    idle: '',
    thinking: 'animate-spin-slow',
    speaking: 'animate-pulse',
    error: 'animate-bounce',
  };

  const animation = animated ? stateAnimations[state] : '';

  return (
    <div 
      className={cn('relative inline-flex items-center justify-center', className, animation)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="B - Bitcoin AI"
    >
      {/* Outer red ring with glow */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #FF3333 0%, #FF0000 50%, #CC0000 100%)',
          boxShadow: '0 4px 12px rgba(255, 0, 0, 0.4), 0 0 20px rgba(255, 0, 0, 0.2)',
        }}
      />
      {/* Silver coin body */}
      <div 
        className="absolute rounded-full"
        style={{
          top: '6%',
          left: '6%',
          right: '6%',
          bottom: '6%',
          background: 'radial-gradient(circle at 35% 35%, #F5F5F5 0%, #E0E0E0 40%, #C0C0C0 70%, #A8A8A8 100%)',
          boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)',
        }}
      />
      {/* Bitcoin symbol ₿ */}
      <div 
        className="absolute inset-0 flex items-center justify-center font-bold"
        style={{
          fontSize: size * 0.59,
          background: 'linear-gradient(180deg, #FF0000 0%, #AA0000 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        ₿
      </div>
      {/* Top-left shine effect */}
      <div 
        className="absolute rounded-full bg-white"
        style={{
          top: size * 0.18,
          left: size * 0.18,
          width: size * 0.31,
          height: size * 0.22,
          opacity: 0.5,
          filter: 'blur(6px)',
        }}
      />
      {/* Small sparkle */}
      <div 
        className="absolute rounded-full bg-white"
        style={{
          top: size * 0.16,
          left: size * 0.22,
          width: size * 0.06,
          height: size * 0.06,
          opacity: 0.8,
        }}
      />
    </div>
  );
}
