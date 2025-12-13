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
  ...rest
}) => {
  const { tap, impact } = useHaptics();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    impact(); // Strong haptic feedback for premium feel
    if (onClick) {
      onClick(e);
    }
  };

  // Base classes for premium look
  const baseClasses = cn(
    'font-bold rounded-lg transition-all duration-200 ease-in-out',
    'shadow-md active:scale-95',
    sizeClasses[size],
    disabled && 'opacity-50 cursor-not-allowed',
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
      disabled={disabled}
      className={cn(baseClasses, isInverse ? inverseClasses : primaryClasses)}
      {...rest}
    >
      {children}
    </button>
  );
};

