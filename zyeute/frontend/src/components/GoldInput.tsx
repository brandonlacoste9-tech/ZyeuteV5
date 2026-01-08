/**
 * GoldInput - Premium Themed Input Component
 * Standardized input field with gold border accents and dark background
 */

import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GoldInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  className?: string;
  // Size variants
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "py-1.5 px-3 text-sm",
  md: "py-2.5 px-4 text-base",
  lg: "py-3 px-5 text-lg",
};

export const GoldInput = forwardRef<HTMLInputElement, GoldInputProps>(
  ({ className = "", size = "md", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full bg-gray-900 text-white",
          "border border-gold-500/30 rounded-lg",
          "placeholder:text-gray-400 placeholder:text-sm",
          "focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20",
          "transition-all duration-200 ease-in-out",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

GoldInput.displayName = "GoldInput";
