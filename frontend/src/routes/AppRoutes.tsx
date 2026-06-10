/**
 * Application routes — wires real pages (previously many were missing from the router).
 */

import { lazy, Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RequireModerator } from "@/components/auth/RequireModerator";
import { LoadingScreen as LoadingScreenComponent } from "@/components/LoadingScreen";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

function LoadingScreen({ message }: { message?: string }) {
  return <LoadingScreenComponent message={message || "Chargement..."} />;
}

const LoginPage = lazy(() => import("@/pages/Login"));
const OnboardingPage = lazy(() => import("@/pages/Onboarding"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallback"));
const Zyeute = lazy(() => import("@/pages/LaZyeute"));
const ExplorePage = lazy(() => import("@/pages/Explore"));
const FeedGrid = lazy(() => import("@/pages/Feed"));
const UploadPage = lazy(() => import("@/pages/Upload"));
const PostDetailPage = lazy(() => import("@/pages/PostDetail"));
const MessagesPage = lazy(() => import("@/pages/Messages"));
const NotificationsPage = lazy(() => import("@/pages/Notifications"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const ProfilePage = lazy(() => import("@/pages/Profile"));
const PremiumPage = lazy(() => import("@/pages/Premium"));
const StorePage = lazy(() => import("@/pages/Store"));
const WalletPage = lazy(() => import("@/pages/Wallet"));
const ParentalDashboard = lazy(() => import("@/pages/ParentalDashboard"));
const SignupPage = lazy(() => import("@/pages/Signup"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPassword"));
const ModerationPage = lazy(() => import("@/pages/moderation/Moderation"));
const AIStudio = lazy(() => import("@/pages/AIStudio"));
const VideoDoctorDashboard = lazy(
  () => import("@/components/admin/VideoDoctorDashboard"),
);
const TikTokCuration = lazy(() =>
  import("@/components/features/TikTokCuration").then((m) => ({
    default: m.TikTokCuration,
  })),
);
const CreatorHubPage = lazy(() => import("@/pages/CreatorHub"));
const GoLivePage = lazy(() => import("@/pages/GoLive"));
const WatchLivePage = lazy(() => import("@/pages/WatchLive"));
const LiveDiscoverPage = lazy(() => import("@/pages/LiveDiscover"));
const EmailPreferencesPage = lazy(() => import("@/pages/EmailPreferences"));
const AnalyticsPage = lazy(() => import("@/pages/Analytics"));
const CreatorRevenuePage = lazy(() => import("@/pages/CreatorRevenue"));
const NetworkPage = lazy(() => import("@/pages/Network"));
const HashtagDetail = lazy(() => import("@/pages/HashtagDetail"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const SoundDetail = lazy(() => import("@/pages/SoundDetail"));
const ArcadeHub = lazy(() => import("@/pages/ArcadeHub"));
const GridRushLobby = lazy(() => import("@/pages/GridRushLobby"));
const GridRushMatch = lazy(() => import("@/pages/GridRushMatch"));
const PoutineLobby = lazy(() => import("@/pages/PoutineLobby"));
const PoutineStackGame = lazy(() =>
  import("@/components/features/PoutineStackGame").then((m) => ({
    default: m.default,
  })),
);
const HiveTap = lazy(() => import("@/pages/HiveTap"));
const ZyeuteQuiz = lazy(() => import("@/pages/ZyeuteQuiz"));

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
const VoiceSettingsPage = lazy(() => import("@/pages/VoiceSettingsPage"));
const ProfileEditSettings = lazy(
  () => import("@/pages/settings/ProfileEditSettings"),
);
const PrivacySettings = lazy(() => import("@/pages/settings/PrivacySettings"));
const NotificationSettings = lazy(
  () => import("@/pages/settings/NotificationSettings"),
);

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const HiveCommand = lazy(() => import("@/pages/admin/HiveCommand"));
const EmailCampaigns = lazy(() => import("@/pages/admin/EmailCampaigns"));
const Observability = lazy(() => import("@/pages/admin/Observability"));

const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const CommunityGuidelines = lazy(
  () => import("@/pages/legal/CommunityGuidelines"),
);
const AboutPage = lazy(() => import("@/pages/company/AboutPage"));
const NewsroomPage = lazy(() => import("@/pages/company/NewsroomPage"));
const ContactPage = lazy(() => import("@/pages/company/ContactPage"));

function LogoutRoute() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void logout().finally(() => navigate("/login", { replace: true }));
  }, [logout, navigate]);

  return <LoadingScreen message="Déconnexion..." />;
}

/** No longer redirects — onboarding is now a delayed overlay in AppShell. */
function OnboardingGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Session or guest mode — required for account-style surfaces (not for public /feed). */
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <>{children}</>;
}

/** Real Supabase profile — blocks guest mode (RequireAuth alone allows guests). */
function RequireRealAccount({ children }: { children: ReactNode }) {
  const { user, session, isGuest, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  // Session exists but profile still hydrating — wait (avoids login ↔ app bounce)
  if (session?.user && !user && !isGuest) {
    return <LoadingScreen message="Chargement du profil..." />;
  }

  if (!user || isGuest) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <>{children}</>;
}

/** Infra marketing placeholders (kept for existing deep links). */
function ManusPage() {
  return (
    <div className="min-h-screen flex flex-col pt-12 bg-[#1A0F0A] text-[#F5E6D3] pb-24">
      <div className="p-8 text-center">
        <div className="text-6xl mb-6">🦾</div>
        <h1 className="text-4xl font-bold mb-4 text-[#C9A227] font-serif">
          Manus Infrastructure
        </h1>
        <p className="text-xl opacity-80 max-w-lg mx-auto mb-8">
          Autonomous execution layer for Zyeuté ops.
        </p>
      </div>
    </div>
  );
}

function GravityClawPage() {
  return (
    <div className="min-h-screen flex flex-col pt-12 bg-[#1A0F0A] text-[#F5E6D3] pb-24">
      <div className="p-8 text-center">
        <div className="text-6xl mb-6">🦅</div>
        <h1 className="text-4xl font-bold mb-4 text-[#C9A227] font-serif">
          GravityClaw
        </h1>
        <p className="text-xl opacity-80 max-w-lg mx-auto mb-8">
          Heavy-lift automation mesh.
        </p>
      </div>
    </div>
  );
}

function NullClawPage() {
  return (
    <div className="min-h-screen flex flex-col pt-12 bg-black text-[#F5E6D3] pb-24">
      <div className="p-8 text-center">
        <div className="text-6xl mb-6">⚙️</div>
        <h1 className="text-4xl font-bold mb-4 text-[#C9A227] font-serif">
          NullClaw Infrastructure
        </h1>
        <p className="text-xl opacity-80 max-w-lg mx-auto mb-8">
          Minimal autonomous stack.
        </p>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense
        fallback={<LoadingScreen message="Initialisation du module..." />}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/logout" element={<LogoutRoute />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/onboarding"
            element={
              <Suspense fallback={<div className="min-h-screen bg-black" />}>
                <OnboardingPage />
              </Suspense>
            }
          />

          {/* Public — TikTok-style: anyone can open FYP, discover, and post links */}
          <Route
            path="/feed"
            element={
              <OnboardingGate>
                <Zyeute />
              </OnboardingGate>
            }
          />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/feed/grid" element={<FeedGrid />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/hashtag/:tag" element={<HashtagDetail />} />
          <Route path="/sound/:id" element={<SoundDetail />} />
          <Route path="/p/:id" element={<PostDetailPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile/:username/network" element={<NetworkPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/legal/terms" element={<TermsOfService />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/newsroom" element={<NewsroomPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/legal/community" element={<CommunityGuidelines />} />
          <Route
            path="/legal/community-guidelines"
            element={<CommunityGuidelines />}
          />
          <Route path="/manus" element={<ManusPage />} />
          <Route path="/gravityclaw" element={<GravityClawPage />} />
          <Route path="/nullclaw" element={<NullClawPage />} />

          <Route
            path="/profile"
            element={<Navigate to="/profile/me" replace />}
          />

          <Route
            path="/upload"
            element={
              <RequireAuth>
                <RequireRealAccount>
                  <UploadPage />
                </RequireRealAccount>
              </RequireAuth>
            }
          />
          <Route
            path="/creator"
            element={
              <RequireAuth>
                <RequireRealAccount>
                  <CreatorHubPage />
                </RequireRealAccount>
              </RequireAuth>
            }
          />
          <Route
            path="/creator/revenue"
            element={
              <RequireAuth>
                <RequireRealAccount>
                  <CreatorRevenuePage />
                </RequireRealAccount>
              </RequireAuth>
            }
          />
          <Route
            path="/create"
            element={
              <RequireAuth>
                <RequireRealAccount>
                  <Navigate to="/upload" replace />
                </RequireRealAccount>
              </RequireAuth>
            }
          />

          <Route
            path="/messages"
            element={
              <RequireAuth>
                <MessagesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            }
          />

          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/tags"
            element={
              <RequireAuth>
                <TagsSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/comments"
            element={
              <RequireAuth>
                <CommentsSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/sharing"
            element={
              <RequireAuth>
                <SharingSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/restricted"
            element={
              <RequireAuth>
                <RestrictedAccountsSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/favorites"
            element={
              <RequireAuth>
                <FavoritesSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/muted"
            element={
              <RequireAuth>
                <MutedAccountsSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/content"
            element={
              <RequireAuth>
                <ContentPreferencesSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/media"
            element={
              <RequireAuth>
                <MediaSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/audio"
            element={
              <RequireAuth>
                <AudioSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/storage"
            element={
              <RequireAuth>
                <StorageSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/app"
            element={
              <RequireAuth>
                <AppSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/region"
            element={
              <RequireAuth>
                <RegionSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/language"
            element={
              <RequireAuth>
                <LanguageSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/voice"
            element={
              <RequireAuth>
                <VoiceSettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/profile"
            element={
              <RequireAuth>
                <ProfileEditSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/privacy"
            element={
              <RequireAuth>
                <PrivacySettings />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <RequireAuth>
                <NotificationSettings />
              </RequireAuth>
            }
          />

          <Route
            path="/parental"
            element={
              <RequireAuth>
                <ParentalDashboard />
              </RequireAuth>
            }
          />

          <Route
            path="/moderation"
            element={
              <RequireAuth>
                <RequireModerator>
                  <ModerationPage />
                </RequireModerator>
              </RequireAuth>
            }
          />

          <Route
            path="/ai-studio"
            element={
              <RequireAuth>
                <RequireRealAccount>
                  <AIStudio />
                </RequireRealAccount>
              </RequireAuth>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/hive"
            element={
              <RequireAuth>
                <HiveCommand />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/email"
            element={
              <RequireAuth>
                <EmailCampaigns />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/observability"
            element={
              <RequireAuth>
                <Observability />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/video-doctor"
            element={
              <RequireAuth>
                <VideoDoctorDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/tiktok-curation"
            element={
              <RequireAuth>
                <TikTokCuration />
              </RequireAuth>
            }
          />

          {/* Live streaming */}
          <Route path="/live" element={<LiveDiscoverPage />} />
          <Route path="/live/watch/:id" element={<WatchLivePage />} />
          <Route
            path="/live/go"
            element={
              <RequireAuth>
                <RequireRealAccount>
                  <GoLivePage />
                </RequireRealAccount>
              </RequireAuth>
            }
          />

          {/* Analytics */}
          <Route
            path="/analytics"
            element={
              <RequireAuth>
                <RequireRealAccount>
                  <AnalyticsPage />
                </RequireRealAccount>
              </RequireAuth>
            }
          />

          {/* Email preferences */}
          <Route
            path="/settings/email-preferences"
            element={
              <RequireAuth>
                <EmailPreferencesPage />
              </RequireAuth>
            }
          />

          {/* Arcade */}
          <Route path="/arcade" element={<ArcadeHub />} />
          <Route
            path="/arcade/grid-rush"
            element={
              <RequireRealAccount>
                <GridRushLobby />
              </RequireRealAccount>
            }
          />
          <Route
            path="/arcade/grid-rush/:matchId"
            element={
              <RequireRealAccount>
                <GridRushMatch />
              </RequireRealAccount>
            }
          />
          <Route
            path="/arcade/poutine"
            element={
              <RequireRealAccount>
                <PoutineLobby />
              </RequireRealAccount>
            }
          />
          <Route
            path="/games/poutine"
            element={<Navigate to="/arcade/poutine" replace />}
          />
          <Route
            path="/arcade/poutine/play/:tournamentId"
            element={
              <RequireRealAccount>
                <PoutineStackGame />
              </RequireRealAccount>
            }
          />
          <Route
            path="/royale/play/:tournamentId"
            element={
              <RequireRealAccount>
                <PoutineStackGame />
              </RequireRealAccount>
            }
          />
          <Route
            path="/arcade/hive-tap"
            element={
              <RequireRealAccount>
                <HiveTap />
              </RequireRealAccount>
            }
          />
          <Route
            path="/hive-tap"
            element={<Navigate to="/arcade/hive-tap" replace />}
          />
          <Route
            path="/arcade/quiz"
            element={
              <RequireRealAccount>
                <ZyeuteQuiz />
              </RequireRealAccount>
            }
          />

          <Route path="/" element={<Navigate to="/feed" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
