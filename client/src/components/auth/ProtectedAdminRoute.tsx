/**
 * ProtectedAdminRoute - Route wrapper for admin-only pages
 * Checks admin status via user_profiles.is_admin and auth metadata
 * 
 * Protects dangerous areas:
 * - Moderation tools (content reports, user strikes, bans)
 * - Database cleanup scripts and maintenance operations
 * - Revenue/Stripe test utilities and payment debugging
 * - User management (role changes, account deletions)
 * - Analytics dashboards with sensitive data
 * - Email campaign management
 * - System configuration changes
 * 
 * Note: Also enforce admin checks in API routes via RLS policies
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { checkIsAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';

const routeLogger = logger.withContext('ProtectedAdminRoute');

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = React.memo(({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = loading
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      setIsChecking(true);
      try {
        const adminStatus = await checkIsAdmin();
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          routeLogger.warn('Unauthorized admin access attempt');
        }
      } catch (error) {
        routeLogger.error('Error verifying admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAdmin();
  }, []);

  // Show loading state while checking
  if (isChecking || isAdmin === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gold-400 animate-pulse">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return <>{children}</>;
});

// Display name for React DevTools debugging
ProtectedAdminRoute.displayName = 'ProtectedAdminRoute';
