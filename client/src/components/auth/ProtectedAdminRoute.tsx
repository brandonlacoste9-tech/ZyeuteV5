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

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC } from '@/contexts/RBACContext';
import { logger } from '@/lib/logger';

const routeLogger = logger.withContext('ProtectedAdminRoute');

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = React.memo(({ children }) => {
  const { isLoading } = useAuth();
  const { hasPermission, role } = useRBAC();

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gold-400 animate-pulse">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin (Founder or Moderator with dashboard access)
  const isAuthorized = hasPermission('admin_dashboard') || role === 'founder';

  if (!isAuthorized) {
    routeLogger.warn(`Unauthorized admin access attempt by role: ${role}`);
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return <>{children}</>;
});

// Display name for React DevTools debugging
ProtectedAdminRoute.displayName = 'ProtectedAdminRoute';
