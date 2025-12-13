/**
 * Utility functions for Zyeuté
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { logger } from '../lib/logger';

const utilsLogger = logger.withContext('Utils');


/**
 * Merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number with K/M suffixes (Quebec style with spaces)
 * @example formatNumber(1234) => "1 234"
 * @example formatNumber(1500) => "1.5K"
 * @example formatNumber(2500000) => "2.5M"
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format video duration from seconds
 * @example formatDuration(125) => "2:05"
 * @example formatDuration(3665) => "1:01:05"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get relative time ago in Quebec French
 * @example getTimeAgo(new Date(Date.now() - 60000)) => "Il y a 1 minute"
 */
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'À l\'instant';
  }
  if (diffMins < 60) {
    return `Il y a ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`;
  }
  if (diffHours < 24) {
    return `Il y a ${diffHours} ${diffHours === 1 ? 'heure' : 'heures'}`;
  }
  if (diffDays < 7) {
    return `Il y a ${diffDays} ${diffDays === 1 ? 'jour' : 'jours'}`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} ${weeks === 1 ? 'semaine' : 'semaines'}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Il y a ${months} mois`;
  }
  const years = Math.floor(diffDays / 365);
  return `Il y a ${years} ${years === 1 ? 'an' : 'ans'}`;
}

/**
 * Validate Quebec postal code format
 */
export function isValidPostalCode(code: string): boolean {
  // Quebec postal codes: H, J, G (first letter)
  const quebecPattern = /^[HJG]\d[A-Z]\s?\d[A-Z]\d$/i;
  return quebecPattern.test(code);
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\wÀ-ÿ]+/g;
  return text.match(hashtagRegex) || [];
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate random ID (for optimistic updates)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Check if user is online (based on last_seen)
 */
export function isUserOnline(lastSeen: Date | null): boolean {
  if (!lastSeen) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastSeen > fiveMinutesAgo;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Extract Supabase project reference from URL
 * @param url - Supabase URL
 * @returns Project reference ID or null if invalid
 * @example extractSupabaseProjectRef('https://vuanulvyqkfefmjcikfk.supabase.co') => 'vuanulvyqkfefmjcikfk'
 */
export function extractSupabaseProjectRef(url: string): string | null {
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.(co|in)/);
  return match ? match[1] : null;
}

/**
 * Validate Supabase URL and log appropriate messages
 * @param url - Supabase URL to validate
 * @param expectedRef - Expected project reference (default: 'vuanulvyqkfefmjcikfk')
 */
export function validateSupabaseUrl(url: string, expectedRef: string = 'vuanulvyqkfefmjcikfk'): void {
  const projectRef = extractSupabaseProjectRef(url);
  
  if (!projectRef) {
    utilsLogger.warn('⚠️ Supabase URL format is unexpected:', url);
    return;
  }
  
  if (url.includes('kihxqurnmyxnsyqgpdaw')) {
    utilsLogger.error('❌ WRONG SUPABASE PROJECT DETECTED!');
    utilsLogger.error('   Current: kihxqurnmyxnsyqgpdaw');
    utilsLogger.error(`   Expected: ${expectedRef}`);
    utilsLogger.error(`   Action: Update VITE_SUPABASE_URL to: https://${expectedRef}.supabase.co`);
    utilsLogger.error('   Platforms: Check Netlify and Vercel environment variables');
  } else if (projectRef === expectedRef) {
    utilsLogger.debug(`✅ Using correct Supabase project: ${expectedRef}`);
  } else if (url.includes('demo.supabase.co')) {
    utilsLogger.warn('⚠️ Using demo Supabase URL - features will be limited');
  } else {
    utilsLogger.warn('⚠️ Using unexpected Supabase project:', projectRef);
    utilsLogger.warn(`   Expected: ${expectedRef}`);
  }
}