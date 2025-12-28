
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * RouteErrorBoundary - Resets error state when location changes
 */
export const RouteErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  return (
    <ErrorBoundary resetKeys={[location.pathname]}>
      {children}
    </ErrorBoundary>
  );
};
