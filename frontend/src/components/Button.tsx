/**
 * Gold-themed Button component for Zyeuté
 */

import React, { memo } from "react";
import { cn } from "../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "icon";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        className,
        variant = "primary",
        size = "md",
        isLoading = false,
        leftIcon,
        rightIcon,
        children,
        disabled,
        ...props
      },
      ref,
    ) => {
      const baseStyles =
        "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2";

      const variants = {
        primary:
          "bg-gold-gradient text-black shadow-gold hover:shadow-gold-lg hover:scale-105 active:scale-95",
        outline:
          "border-2 border-gold-500 text-gold-500 hover:bg-gold-500/10 hover:border-gold-400",
        ghost: "text-gold-500 hover:bg-gold-500/10",
        icon: "text-white hover:text-gold-400 hover:bg-white/10",
      };

      const sizes = {
        sm: "px-3 py-1.5 text-sm rounded-lg",
        md: "px-4 py-2 text-base rounded-xl",
        lg: "px-6 py-3 text-lg rounded-2xl",
      };

      return (
        <button
          ref={ref}
          className={cn(baseStyles, variants[variant], sizes[size], className)}
          disabled={disabled || isLoading}
          {...props}
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
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
          ) : leftIcon ? (
            <span className="mr-2">{leftIcon}</span>
          ) : null}

          {children}

          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </button>
      );
    },
  ),
);

Button.displayName = "Button";

/**
 * Specialized Play Button for video thumbnails
 */
export const PlayButton: React.FC<{ onClick?: () => void; size?: number }> = ({
  onClick,
  size = 64,
}) => (
  <button
    onClick={onClick}
    className="absolute inset-0 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-inset"
    aria-label="Play video"
  >
    <div
      className="bg-gold-gradient rounded-full shadow-2xl group-hover:scale-110 transition-transform duration-300 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="w-1/2 h-1/2 text-black translate-x-0.5"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  </button>
);

/**
 * Fire button for rating posts
 */
export const FireButton: React.FC<{
  level: number;
  active?: boolean;
  onClick?: () => void;
}> = ({ level, active = false, onClick }) => {
  const fires = "🔥".repeat(level);
  const actionText = active ? "Remove praise" : "Praise this post";
  const ariaLabel = `Give ${level} fire${level > 1 ? "s" : ""} - ${actionText}`;

  return (
    <button
      onClick={onClick}
      className={cn(
        "text-2xl transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-1 rounded-full",
        active
          ? "scale-125 drop-shadow-[0_0_8px_rgba(255,165,0,0.8)] animate-pulse"
          : "grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:scale-110",
      )}
      aria-label={ariaLabel}
      aria-pressed={active}
    >
      {fires}
    </button>
  );
};
