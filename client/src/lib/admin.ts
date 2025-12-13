/**
 * Admin role checking utilities
 * Checks via session-based API for admin status
 */

import { logger } from './logger';

const adminLogger = logger.withContext('Admin');

/**
 * Check if current user is an admin via session API
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    
    if (!response.ok) {
      adminLogger.debug('No authenticated user');
      return false;
    }
    
    const data = await response.json();
    
    if (data.user?.isAdmin === true) {
      adminLogger.debug('Admin status confirmed via session');
      return true;
    }

    adminLogger.debug('User is not an admin');
    return false;
  } catch (error) {
    adminLogger.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get admin status with user details
 */
export async function getAdminStatus(): Promise<{
  isAdmin: boolean;
  user: unknown | null;
}> {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    
    if (!response.ok) {
      return { isAdmin: false, user: null };
    }
    
    const data = await response.json();
    const isAdmin = data.user?.isAdmin === true;
    return { isAdmin, user: data.user };
  } catch (error) {
    adminLogger.error('Error getting admin status:', error);
    return { isAdmin: false, user: null };
  }
}

/**
 * Hook-friendly admin check that returns loading state
 */
export async function useAdminCheck(): Promise<{
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}> {
  try {
    const isAdmin = await checkIsAdmin();
    return { isAdmin, isLoading: false, error: null };
  } catch (error) {
    return {
      isAdmin: false,
      isLoading: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}
