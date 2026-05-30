import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Quebec-specific utility functions
 */

export function formatQuebecDate(date: Date): string {
  return date.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatQuebecTime(date: Date): string {
  return date.toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatQuebecCurrency(amount: number): string {
  return amount.toLocaleString("fr-CA", {
    style: "currency",
    currency: "CAD",
  });
}

/**
 * Get Quebec-compliant loading text
 */
export function getLoadingText(): string {
  return "Ça charge...";
}

/**
 * Get Quebec-compliant error text
 */
export function getErrorText(): string {
  return "Oups, y'a un bobo";
}
