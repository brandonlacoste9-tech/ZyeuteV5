/**
 * Main App Component with Routing
 * Global Styles Applied via leather-overlay
 * Performance: Lazy loading for rarely-accessed routes
 */

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { BorderColorProvider } from "@/contexts/BorderColorContext";
import { MainLayout } from "@/components/MainLayout";
import { HiveProvider } from "@/contexts/HiveContext";
import { PageTransition } from "@/components/AnimatedRoutes";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { TiGuy } from "@/components/features/TiGuy";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { MapleSpinner } from "@/components/ui/MapleSpinner";
import { AchievementListener } from "@/components/gamification/AchievementModal";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ColonyProvider } from "@/components/providers/colony-provider";
import { RBACProvider } from "@/contexts/RBACContext";
import { NavigationStateProvider } from "@/contexts/NavigationStateContext";
import { NetworkQueueProvider } from "@/contexts/NetworkQueueContext";
import { OfflineIndicator } from "@/components/features/OfflineIndicator";
import { FactoryThemeProvider } from "@/providers/FactoryThemeProvider";
import { AppConfig } from "@/config/factory";

// Core Pages - Eagerly loaded (frequently accessed)
import Home from "@/pages/Home";
import Feed from "@/pages/Feed";
import Profile from "@/pages/Profile";
import Explore from "@/pages/Explore";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AuthCallback from "@/pages/AuthCallback";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Banned from "@/pages/Banned";

// Lazy-loaded Pages
const Upload = lazy(() => import("@/pages/Upload"));
const PostDetail = lazy(() => import("@/pages/PostDetail"));
const Player = lazy(() => import("@/pages/Player"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Settings = lazy(() => import("@/pages/Settings"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const StoryCreator = lazy(() => import("@/components/features/StoryCreator"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const CreatorRevenue = lazy(() => import("@/pages/CreatorRevenue"));

// Admin Pages
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const EmailCampaigns = lazy(() => import("@/pages/admin/EmailCampaigns"));
const HiveCommand = lazy(() => import("@/pages/admin/HiveCommand"));
const Observability = lazy(() => import("@/pages/admin/Observability"));

// Phase 2 Pages
const Artiste = lazy(() => import("@/pages/Artiste"));
const Studio = lazy(() => import("@/pages/Studio"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const Premium = lazy(() => import("@/pages/Premium"));
const Challenges = lazy(() => import("@/pages/Challenges"));
const VoiceSettingsPage = lazy(() => import("@/pages/VoiceSettingsPage"));
const GoLive = lazy(() => import("@/pages/GoLive"));
const WatchLive = lazy(() => import("@/pages/WatchLive"));
const LiveDiscover = lazy(() => import("@/pages/LiveDiscover"));
const AIStudio = lazy(() => import("@/pages/AIStudio"));
const LaZyeute = lazy(() => import("@/pages/LaZyeute"));

// Settings Pages
const TagsSettings = lazy(() => import("@/pages/settings/TagsSettings"));
const CommentsSettings = lazy(
  () => import("@/pages/settings/CommentsSettings"),
);
const SharingSettings = lazy(() => import("@/pages/settings/SharingSettings"));
const RestrictedAccountsSettings = lazy(
  () => import("@/pages/settings/RestrictedAccountsSettings"),
);
const FavoritesSettings = lazy(
  () => import("@/pages/settings/FavoritesSettings"),
);
const MutedAccountsSettings = lazy(
  () => import("@/pages/settings/MutedAccountsSettings"),
);
const ContentPreferencesSettings = lazy(
  () => import("@/pages/settings/ContentPreferencesSettings"),
);
const MediaSettings = lazy(() => import("@/pages/settings/MediaSettings"));
const AudioSettings = lazy(() => import("@/pages/settings/AudioSettings"));
const StorageSettings = lazy(() => import("@/pages/settings/StorageSettings"));
const AppSettings = lazy(() => import("@/pages/settings/AppSettings"));
const RegionSettings = lazy(() => import("@/pages/settings/RegionSettings"));
const LanguageSettings = lazy(
  () => import("@/pages/settings/LanguageSettings"),
);
const ProfileEditSettings = lazy(
  () => import("@/pages/settings/ProfileEditSettings"),
);
const PrivacySettings = lazy(() => import("@/pages/settings/PrivacySettings"));
const NotificationSettings = lazy(
  () => import("@/pages/settings/NotificationSettings"),
);

const Moderation = lazy(() => import("@/pages/moderation/Moderation"));

const CommunityGuidelines = lazy(
  () => import("@/pages/legal/CommunityGuidelines"),
);
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));

const LazyLoadFallback: React.FC = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center flex flex-col items-center">
      <MapleSpinner size="lg" className="mb-4" />
      <p className="text-stone-400 font-medium">Chargement...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading)
    return (
      <LoadingScreen message={`Chargement de ${AppConfig.identity.name}...`} />
    );
  if (user?.role === "banned") return <Navigate to="/banned" replace />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const GlobalAuthLoader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoading } = useAuth();
  if (isLoading)
    return (
      <LoadingScreen message={`Chargement de ${AppConfig.identity.name}...`} />
    );
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <FactoryThemeProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <GuestModeProvider>
                <ColonyProvider>
                  <RBACProvider>
                    <NavigationStateProvider>
                      <NetworkQueueProvider>
                        <GlobalAuthLoader>
                          <BorderColorProvider>
                            <BrowserRouter>
                              <AchievementListener />
                              <OfflineIndicator />
                              <Suspense fallback={<LoadingScreen />}>
                                <HiveProvider>
                                  <Routes>
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
                                          <Suspense
                                            fallback={<LazyLoadFallback />}
                                          >
                                            <LaZyeute />
                                          </Suspense>
                                        </ProtectedRoute>
                                      }
                                    />
                                    <Route
                                      path="*"
                                      element={
                                        <MainLayout>
                                          <PageTransition>
                                            <Routes>
                                              <Route
                                                path="/banned"
                                                element={<Banned />}
                                              />
                                              <Route
                                                path="/login"
                                                element={<Login />}
                                              />
                                              <Route
                                                path="/signup"
                                                element={<Signup />}
                                              />
                                              <Route
                                                path="/forgot-password"
                                                element={<ForgotPassword />}
                                              />
                                              <Route
                                                path="/reset-password"
                                                element={<ResetPassword />}
                                              />
                                              <Route
                                                path="/auth/callback"
                                                element={<AuthCallback />}
                                              />
                                              <Route
                                                path="/"
                                                element={<Home />}
                                              />
                                              <Route
                                                path="/feed"
                                                element={
                                                  <ProtectedRoute>
                                                    <RouteErrorBoundary>
                                                      <Feed />
                                                    </RouteErrorBoundary>
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/explore"
                                                element={
                                                  <ProtectedRoute>
                                                    <RouteErrorBoundary>
                                                      <Explore />
                                                    </RouteErrorBoundary>
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/upload"
                                                element={
                                                  <ProtectedRoute>
                                                    <RouteErrorBoundary>
                                                      <Suspense
                                                        fallback={
                                                          <LazyLoadFallback />
                                                        }
                                                      >
                                                        <Upload />
                                                      </Suspense>
                                                    </RouteErrorBoundary>
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/story/create"
                                                element={
                                                  <ProtectedRoute>
                                                    <Suspense
                                                      fallback={
                                                        <LazyLoadFallback />
                                                      }
                                                    >
                                                      <StoryCreator />
                                                    </Suspense>
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/p/:id"
                                                element={
                                                  <ProtectedRoute>
                                                    <Suspense
                                                      fallback={
                                                        <LazyLoadFallback />
                                                      }
                                                    >
                                                      <PostDetail />
                                                    </Suspense>
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/profile/:username"
                                                element={
                                                  <ProtectedRoute>
                                                    <Profile />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/notifications"
                                                element={
                                                  <ProtectedRoute>
                                                    <Notifications />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/settings"
                                                element={
                                                  <ProtectedRoute>
                                                    <Settings />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/analytics"
                                                element={
                                                  <ProtectedRoute>
                                                    <Analytics />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              {/* Sub-routes */}
                                              <Route
                                                path="/settings/*"
                                                element={
                                                  <ProtectedRoute>
                                                    <Settings />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/artiste"
                                                element={
                                                  <ProtectedRoute>
                                                    <Artiste />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/studio"
                                                element={
                                                  <ProtectedRoute>
                                                    <Studio />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/marketplace"
                                                element={
                                                  <ProtectedRoute>
                                                    <Marketplace />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/premium"
                                                element={
                                                  <ProtectedRoute>
                                                    <Premium />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/challenges"
                                                element={
                                                  <ProtectedRoute>
                                                    <Challenges />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/ai-studio"
                                                element={
                                                  <ProtectedRoute>
                                                    <AIStudio />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/live/*"
                                                element={
                                                  <ProtectedRoute>
                                                    <LiveDiscover />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/moderation"
                                                element={
                                                  <ProtectedAdminRoute>
                                                    <Moderation />
                                                  </ProtectedAdminRoute>
                                                }
                                              />
                                              <Route
                                                path="/admin/observability"
                                                element={
                                                  <ProtectedAdminRoute>
                                                    <Observability />
                                                  </ProtectedAdminRoute>
                                                }
                                              />
                                              <Route
                                                path="/admin/*"
                                                element={
                                                  <ProtectedAdminRoute>
                                                    <AdminDashboard />
                                                  </ProtectedAdminRoute>
                                                }
                                              />
                                              {/* Legal */}
                                              <Route
                                                path="/legal/community-guidelines"
                                                element={
                                                  <CommunityGuidelines />
                                                }
                                              />
                                              <Route
                                                path="/legal/terms"
                                                element={<TermsOfService />}
                                              />
                                              <Route
                                                path="/legal/privacy"
                                                element={<PrivacyPolicy />}
                                              />
                                              <Route
                                                path="/achievements"
                                                element={
                                                  <ProtectedRoute>
                                                    <Achievements />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="/revenue"
                                                element={
                                                  <ProtectedRoute>
                                                    <CreatorRevenue />
                                                  </ProtectedRoute>
                                                }
                                              />
                                              <Route
                                                path="*"
                                                element={
                                                  <Navigate to="/" replace />
                                                }
                                              />
                                            </Routes>
                                          </PageTransition>
                                          <TiGuy />
                                        </MainLayout>
                                      }
                                    />
                                  </Routes>
                                </HiveProvider>
                              </Suspense>
                            </BrowserRouter>
                          </BorderColorProvider>
                        </GlobalAuthLoader>
                      </NetworkQueueProvider>
                    </NavigationStateProvider>
                  </RBACProvider>
                </ColonyProvider>
              </GuestModeProvider>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </FactoryThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
