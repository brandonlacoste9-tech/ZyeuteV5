/**
 * Main App Component with Routing
 * Global Styles Applied via leather-overlay
 * Performance: Lazy loading for rarely-accessed routes
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { BorderColorProvider } from '@/contexts/BorderColorContext';
import { MainLayout } from '@/components/MainLayout';
import { PageTransition } from '@/components/AnimatedRoutes';
import { TiGuy } from '@/components/features/TiGuy';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AchievementListener } from '@/components/gamification/AchievementModal';
import { ProtectedAdminRoute } from '@/components/auth/ProtectedAdminRoute';
import { GUEST_SESSION_DURATION, GUEST_MODE_KEY, GUEST_TIMESTAMP_KEY, GUEST_VIEWS_KEY } from '@/lib/constants';

// Core Pages - Eagerly loaded (frequently accessed)
import Feed from '@/pages/Feed';
import Profile from '@/pages/Profile';
import Explore from '@/pages/Explore';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import AuthCallback from '@/pages/AuthCallback';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Lazy-loaded Pages - Split into separate bundles (rarely accessed)
const Upload = lazy(() => import('@/pages/Upload'));
const PostDetail = lazy(() => import('@/pages/PostDetail'));
const Player = lazy(() => import('@/pages/Player'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Settings = lazy(() => import('@/pages/Settings'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const StoryCreator = lazy(() => import('@/components/features/StoryCreator'));
const Achievements = lazy(() => import('@/pages/Achievements'));
const CreatorRevenue = lazy(() => import('@/pages/CreatorRevenue'));

// Admin Pages - Lazy loaded (admin only)
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const EmailCampaigns = lazy(() => import('@/pages/admin/EmailCampaigns'));

// Phase 2 Pages - Lazy loaded (optional features)
const Artiste = lazy(() => import('@/pages/Artiste'));
const Studio = lazy(() => import('@/pages/Studio'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const Premium = lazy(() => import('@/pages/Premium'));
const Challenges = lazy(() => import('@/pages/Challenges'));
const VoiceSettingsPage = lazy(() => import('@/pages/VoiceSettingsPage'));
const GoLive = lazy(() => import('@/pages/GoLive'));
const WatchLive = lazy(() => import('@/pages/WatchLive'));
const LiveDiscover = lazy(() => import('@/pages/LiveDiscover'));
const AIStudio = lazy(() => import('@/pages/AIStudio'));
const LaZyeute = lazy(() => import('@/pages/LaZyeute'));

// Settings Pages - Lazy loaded (rarely accessed)
const TagsSettings = lazy(() => import('@/pages/settings/TagsSettings'));
const CommentsSettings = lazy(() => import('@/pages/settings/CommentsSettings'));
const SharingSettings = lazy(() => import('@/pages/settings/SharingSettings'));
const RestrictedAccountsSettings = lazy(() => import('@/pages/settings/RestrictedAccountsSettings'));
const FavoritesSettings = lazy(() => import('@/pages/settings/FavoritesSettings'));
const MutedAccountsSettings = lazy(() => import('@/pages/settings/MutedAccountsSettings'));
const ContentPreferencesSettings = lazy(() => import('@/pages/settings/ContentPreferencesSettings'));
const MediaSettings = lazy(() => import('@/pages/settings/MediaSettings'));
const AudioSettings = lazy(() => import('@/pages/settings/AudioSettings'));
const StorageSettings = lazy(() => import('@/pages/settings/StorageSettings'));
const AppSettings = lazy(() => import('@/pages/settings/AppSettings'));
const RegionSettings = lazy(() => import('@/pages/settings/RegionSettings'));
const LanguageSettings = lazy(() => import('@/pages/settings/LanguageSettings'));
const ProfileEditSettings = lazy(() => import('@/pages/settings/ProfileEditSettings'));
const PrivacySettings = lazy(() => import('@/pages/settings/PrivacySettings'));
const NotificationSettings = lazy(() => import('@/pages/settings/NotificationSettings'));

// Moderation - Lazy loaded (admin only)
const Moderation = lazy(() => import('@/pages/moderation/Moderation'));

// Legal Pages - Lazy loaded (rarely accessed)
const CommunityGuidelines = lazy(() => import('@/pages/legal/CommunityGuidelines'));
const TermsOfService = lazy(() => import('@/pages/legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'));

// Loading fallback component with Quebec styling
const LazyLoadFallback: React.FC = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-4 mx-auto shadow-[0_0_20px_rgba(255,191,0,0.2)]" />
      <p className="text-stone-400 font-medium">Chargement...</p>
    </div>
  </div>
);

// Protected Route Component - Uses Supabase auth + guest mode
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for Supabase authenticated user
        const { supabase } = await import('./lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setIsAuthenticated(true);
          return;
        }
        
        // Check for guest mode
        const guestMode = localStorage.getItem(GUEST_MODE_KEY);
        const guestTimestamp = localStorage.getItem(GUEST_TIMESTAMP_KEY);
        
        if (guestMode === 'true' && guestTimestamp) {
          const age = Date.now() - parseInt(guestTimestamp, 10);
          
          if (age < GUEST_SESSION_DURATION) {
            // Valid guest session
            setIsAuthenticated(true);
            return;
          } else {
            // Guest session expired - clear localStorage
            localStorage.removeItem(GUEST_MODE_KEY);
            localStorage.removeItem(GUEST_TIMESTAMP_KEY);
            localStorage.removeItem(GUEST_VIEWS_KEY);
          }
        }
        
        // No valid auth or guest session
        setIsAuthenticated(false);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <LoadingScreen message="Chargement de Zyeuté..." />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <BorderColorProvider>
            <BrowserRouter>
              {/* Achievement Listener (Global) */}
              <AchievementListener />

              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Full-screen routes (outside MainLayout) */}
                  <Route
                    path="/video/:videoId"
                    element={
                      <ProtectedRoute>
                        <Player />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/zyeute"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LazyLoadFallback />}>
                          <LaZyeute />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />

                  {/* Main App Content (inside MainLayout) */}
                  <Route
                    path="*"
                    element={
                      <MainLayout>
                        <PageTransition>
                          <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />

                        {/* Protected Routes - with granular error boundaries */}
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <Feed />
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/explore"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <Explore />
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/upload"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <Suspense fallback={<LazyLoadFallback />}>
                                  <Upload />
                                </Suspense>
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/story/create"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LazyLoadFallback />}>
                                <StoryCreator />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/notifications"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LazyLoadFallback />}>
                                <Notifications />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/profile/:slug"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <Profile />
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/p/:id"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <Suspense fallback={<LazyLoadFallback />}>
                                  <PostDetail />
                                </Suspense>
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute>
                              <ErrorBoundary>
                                <Suspense fallback={<LazyLoadFallback />}>
                                  <Settings />
                                </Suspense>
                              </ErrorBoundary>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/analytics"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LazyLoadFallback />}>
                                <Analytics />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        
                        {/* Phase 2 Feature Routes - Lazy loaded */}
                        <Route
                          path="/artiste"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LazyLoadFallback />}>
                                <Artiste />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/studio"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LazyLoadFallback />}>
                                <Studio />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/marketplace"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LazyLoadFallback />}>
                                <Marketplace />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/premium"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LazyLoadFallback />}>
                                <Premium />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/challenges"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LazyLoadFallback />}>
                                <Challenges />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/voice"
                          element={
                            <ProtectedRoute>
                              <VoiceSettingsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/tags"
                          element={
                            <ProtectedRoute>
                              <TagsSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/comments"
                          element={
                            <ProtectedRoute>
                              <CommentsSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/sharing"
                          element={
                            <ProtectedRoute>
                              <SharingSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/restricted"
                          element={
                            <ProtectedRoute>
                              <RestrictedAccountsSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/favorites"
                          element={
                            <ProtectedRoute>
                              <FavoritesSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/muted"
                          element={
                            <ProtectedRoute>
                              <MutedAccountsSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/content"
                          element={
                            <ProtectedRoute>
                              <ContentPreferencesSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/media"
                          element={
                            <ProtectedRoute>
                              <MediaSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/audio"
                          element={
                            <ProtectedRoute>
                              <AudioSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/storage"
                          element={
                            <ProtectedRoute>
                              <StorageSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/app"
                          element={
                            <ProtectedRoute>
                              <AppSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/region"
                          element={
                            <ProtectedRoute>
                              <RegionSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/language"
                          element={
                            <ProtectedRoute>
                              <LanguageSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/profile"
                          element={
                            <ProtectedRoute>
                              <ProfileEditSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/privacy"
                          element={
                            <ProtectedRoute>
                              <PrivacySettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/notifications"
                          element={
                            <ProtectedRoute>
                              <NotificationSettings />
                            </ProtectedRoute>
                          }
                        />

                        {/* AI Studio Route */}
                        <Route
                          path="/ai-studio"
                          element={
                            <ProtectedRoute>
                              <AIStudio />
                            </ProtectedRoute>
                          }
                        />

                        {/* Live Streaming Routes */}
                        <Route
                          path="/live"
                          element={
                            <ProtectedRoute>
                              <LiveDiscover />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/live/go"
                          element={
                            <ProtectedRoute>
                              <GoLive />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/live/watch/:id"
                          element={
                            <ProtectedRoute>
                              <WatchLive />
                            </ProtectedRoute>
                          }
                        />
                        
                        {/* Moderation Routes (Admin Only) */}
                        <Route
                          path="/moderation"
                          element={
                            <ProtectedAdminRoute>
                              <Moderation />
                            </ProtectedAdminRoute>
                          }
                        />

                        {/* Legal Pages (Public) */}
                        <Route path="/legal/community-guidelines" element={<CommunityGuidelines />} />
                        <Route path="/legal/terms" element={<TermsOfService />} />
                        <Route path="/legal/privacy" element={<PrivacyPolicy />} />

                        {/* Gamification */}
                        <Route
                          path="/achievements"
                          element={
                            <ProtectedRoute>
                              <Achievements />
                            </ProtectedRoute>
                          }
                        />

                        {/* Creator Monetization */}
                        <Route
                          path="/revenue"
                          element={
                            <ProtectedRoute>
                              <CreatorRevenue />
                            </ProtectedRoute>
                          }
                        />

                        {/* Admin Routes */}
                        <Route
                          path="/admin"
                          element={
                            <ProtectedAdminRoute>
                              <AdminDashboard />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/emails"
                          element={
                            <ProtectedAdminRoute>
                              <EmailCampaigns />
                            </ProtectedAdminRoute>
                          }
                        />

                        {/* Catch all - redirect to feed */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </PageTransition>
                      
                      {/* Ti-Guy mascot assistant (always available) */}
                      <TiGuy />
                    </MainLayout>
                  }
                />
              </Routes>
              </Suspense>
            </BrowserRouter>
          </BorderColorProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
