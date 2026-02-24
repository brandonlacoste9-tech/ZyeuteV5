/**
 * ZYEUTÉ - The Quebec Swarm
 * Stable version with i18n fix
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";

// Providers
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { GuestModeProvider } from "./contexts/GuestModeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { HiveProvider } from "./contexts/HiveContext";
import { NavigationStateProvider } from "./contexts/NavigationStateContext";
import { NetworkQueueProvider } from "./contexts/NetworkQueueContext";
import { MediaSessionProvider } from "./contexts/MediaSessionContext";
import { BorderColorProvider } from "./contexts/BorderColorContext";

// Layout
import { MainLayout } from "./components/MainLayout";

// Error boundary
import { ErrorBoundary, ErrorFallback } from "./components/ErrorBoundary";

// Lazy load pages - only essential ones
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Feed = lazy(() => import("./pages/Feed"));
const Explore = lazy(() => import("./pages/Explore"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));

const Upload = lazy(() => import("./pages/Upload"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin text-4xl mb-4">🐝</div>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

// Auth guard wrapper
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public only wrapper
const PublicOnly = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  return (
    <Router>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Protected routes */}
            <Route path="/feed" element={
              <RequireAuth>
                <MainLayout>
                  <Feed />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/explore" element={
              <RequireAuth>
                <MainLayout>
                  <Explore />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/profile/:userId?" element={
              <RequireAuth>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/notifications" element={
              <RequireAuth>
                <MainLayout>
                  <Notifications />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/settings" element={
              <RequireAuth>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/upload" element={
              <RequireAuth>
                <MainLayout>
                  <Upload />
                </MainLayout>
              </RequireAuth>
            } />

            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <GuestModeProvider>
          <AuthProvider>
            <HiveProvider>
              <NavigationStateProvider>
                <NetworkQueueProvider>
                  <MediaSessionProvider>
                    <BorderColorProvider>
                      <AppContent />
                    </BorderColorProvider>
                  </MediaSessionProvider>
                </NetworkQueueProvider>
              </NavigationStateProvider>
            </HiveProvider>
          </AuthProvider>
        </GuestModeProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
