/**
 * Home Page - Smart Router Component
 * Shows Landing page to non-authenticated users
 * Shows Feed to authenticated users
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";

const Home: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while AuthContext initializes
  if (isLoading) {
    return <LoadingScreen message="Chargement de Zyeuté..." />;
  }

  // If authenticated (including guest mode via AuthContext), redirect to feed
  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  // Not authenticated - redirect to login
  return <Navigate to="/login" replace />;
};

export default Home;
