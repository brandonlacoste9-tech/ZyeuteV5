/**
 * Logo Component - Zyeuté Fleur-de-lis logo
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  linkTo?: string;
}

const SIZES = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  className,
  linkTo = '/',
}) => {
  const logoContent = (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Logo Image/Icon */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-sm border-2 border-gold-400/50 shadow-2xl',
          SIZES[size]
        )}
        style={{
          boxShadow: '0 0 20px rgba(245, 200, 66, 0.3)',
        }}
      >
        {/* Gold Fleur-de-lis */}
        <div className="relative">
          {/* Main fleur-de-lis symbol */}
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn(
              'text-gold-400 drop-shadow-2xl',
              size === 'xs' && 'w-4 h-4',
              size === 'sm' && 'w-5 h-5',
              size === 'md' && 'w-8 h-8',
              size === 'lg' && 'w-10 h-10',
              size === 'xl' && 'w-16 h-16'
            )}
            style={{
              filter: 'drop-shadow(0 2px 8px rgba(245, 200, 66, 0.6))',
            }}
          >
            <path d="M12 2C12 2 8 4 8 8C8 10 9 11 10 11.5C9 12 8 13 8 14.5C8 17 10 18 12 18C14 18 16 17 16 14.5C16 13 15 12 14 11.5C15 11 16 10 16 8C16 4 12 2 12 2M12 4.5C12.5 5 14 6.5 14 8C14 9.5 13 10.5 12 10.5C11 10.5 10 9.5 10 8C10 6.5 11.5 5 12 4.5M12 13C13 13 14 13.5 14 14.5C14 16 13 16.5 12 16.5C11 16.5 10 16 10 14.5C10 13.5 11 13 12 13M7 19C7 19 6 19.5 6 21H18C18 19.5 17 19 17 19C17 19 15.5 19.5 12 19.5C8.5 19.5 7 19 7 19M8 21.5C8 21.5 8 22 8 22.5H16C16 22 16 21.5 16 21.5H8Z" />
          </svg>
          
          {/* Glow effect */}
          <div
            className="absolute inset-0 blur-xl bg-gold-400 opacity-20 animate-pulse"
            style={{ animationDuration: '3s' }}
          />
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className="font-bold text-white leading-none" style={{
            fontSize: size === 'xs' ? '0.875rem' : size === 'sm' ? '1rem' : size === 'md' ? '1.5rem' : size === 'lg' ? '2rem' : '2.5rem',
            textShadow: '0 2px 10px rgba(245, 200, 66, 0.3)',
          }}>
            Zyeuté
          </h1>
          {size !== 'xs' && size !== 'sm' && (
            <p className="text-gold-400 text-xs font-semibold tracking-wider">
              QUÉBEC ⚜️
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-80 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

/**
 * Full Logo - With ornate frame (for splash/loading screens)
 */
export const LogoFull: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Ornate frame */}
      <div className="relative">
        {/* Dark plaque with golden border */}
        <div
          className="relative rounded-3xl bg-gradient-to-br from-black via-gray-900 to-black p-8 border-4 border-gold-400 shadow-2xl"
          style={{
            boxShadow: '0 0 60px rgba(245, 200, 66, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Subtle texture overlay */}
          <div
            className="absolute inset-0 rounded-3xl opacity-20"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%\' height=\'100%\' filter=\'url(%23noise)\' opacity=\'0.3\'/%3E%3C/svg%3E")',
            }}
          />

          {/* Gold fleur-de-lis */}
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-32 h-32 text-gold-400"
              style={{
                filter: 'drop-shadow(0 4px 20px rgba(245, 200, 66, 0.8)) drop-shadow(0 0 40px rgba(245, 200, 66, 0.4))',
              }}
            >
              <path d="M12 2C12 2 8 4 8 8C8 10 9 11 10 11.5C9 12 8 13 8 14.5C8 17 10 18 12 18C14 18 16 17 16 14.5C16 13 15 12 14 11.5C15 11 16 10 16 8C16 4 12 2 12 2M12 4.5C12.5 5 14 6.5 14 8C14 9.5 13 10.5 12 10.5C11 10.5 10 9.5 10 8C10 6.5 11.5 5 12 4.5M12 13C13 13 14 13.5 14 14.5C14 16 13 16.5 12 16.5C11 16.5 10 16 10 14.5C10 13.5 11 13 12 13M7 19C7 19 6 19.5 6 21H18C18 19.5 17 19 17 19C17 19 15.5 19.5 12 19.5C8.5 19.5 7 19 7 19M8 21.5C8 21.5 8 22 8 22.5H16C16 22 16 21.5 16 21.5H8Z" />
            </svg>

            {/* Animated glow rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-40 h-40 border-2 border-gold-400/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute w-48 h-48 border border-gold-400/10 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            </div>
          </div>

          {/* Sparkle effect in corner */}
          <div className="absolute bottom-4 right-4 w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
        </div>

        {/* App name */}
        <div className="mt-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2" style={{
            textShadow: '0 2px 20px rgba(245, 200, 66, 0.5)',
          }}>
            Zyeuté
          </h1>
          <p className="text-gold-400 text-sm font-semibold tracking-widest">
            L&apos;APP SOCIALE DU QUÉBEC
          </p>
          <p className="text-white/60 text-xs mt-1">
            Fait au Québec, pour le Québec 🇨🇦⚜️
          </p>
        </div>
      </div>
    </div>
  );
};

export default Logo;

