/**
 * GoldButton - Premium Themed Button Component
 * Standardized gold/leather theme button with haptic feedback
 */

import React, { ButtonHTMLAttributes } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  // Inverse style: black background with gold text/border
  isInverse?: boolean;
  // Size variants
  size?: 'sm' | 'md' | 'lg';
  // Accessibility
  'aria-label'?: string;
  isLoading?: boolean;
}

const sizeClasses = {
  sm: 'py-1.5 px-3 text-xs',
  md: 'py-2 px-4 text-sm',
  lg: 'py-3 px-6 text-base',
};

export const GoldButton: React.FC<GoldButtonProps> = ({
  children,
  className = '',
  isInverse = false,
  size = 'md',
  onClick,
  disabled,
  isLoading = false,
  'aria-label': ariaLabel,
  ...rest
}) => {
  const { tap, impact } = useHaptics();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    
    impact(); // Strong haptic feedback for premium feel
    if (onClick) {
      onClick(e);
    }
  };

  // Base classes for premium look
  const baseClasses = cn(
    'font-bold rounded-lg transition-all duration-200 ease-in-out',
    'shadow-md active:scale-95',
    'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-black',
    sizeClasses[size],
    (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
    className
  );

  // Gold primary style
  const primaryClasses = cn(
    'bg-gold-500 text-black',
    'hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/40',
    'active:bg-gold-600',
    'shadow-gold-500/30'
  );

  // Black inverse style (for secondary actions)
  const inverseClasses = cn(
    'bg-black border-2 border-gold-500 text-gold-500',
    'hover:bg-gold-500/10 hover:border-gold-400',
    'active:bg-gold-500/20',
    'shadow-none'
  );

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(baseClasses, isInverse ? inverseClasses : primaryClasses)}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2" aria-live="polite">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

