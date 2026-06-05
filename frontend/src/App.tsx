/**
 * ZYEUTÉ — root shell: providers, routing, Ti-Guy.
 * Feature pages live under `src/pages` and are wired in `src/routes/AppRoutes.tsx`.\
 */

import { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { LoadingScreen as LoadingScreenComponent } from "./components/LoadingScreen";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TIGuyButton } from "@/components/tiguy/TIGuyButton";
import { useTIGuy } from "@/components/tiguy/useTIGuy";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BorderColorProvider } from "@/contexts/BorderColorContext";
import { NavigationStateProvider } from "@/contexts/NavigationStateContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { MessagingProvider } from "@/contexts/MessagingContext";
import { ColonyProvider } from "@/components/providers/colony-provider";
import { HiveProvider } from "@/contexts/HiveContext";
import { AppRoutes } from "@/routes/AppRoutes";
import { ApiHealthBanner } from "@/components/system/ApiHealthBanner";
import { AgeGateModal } from "@/components/system/AgeGateModal";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { Analytics } from "@vercel/analytics/react";

// Lazy-load TIGuyFullScreen to keep it out of the main index chunk.
const TIGuyFullScreen = lazy(() =>
  import("@/components/tiguy/TIGuyFullScreen").then((m) => ({
    default: m.TIGuyFullScreen,
  })),
);

// Lazy-load Onboarding overlay
const OnboardingOverlay = lazy(() =>
  import("@/pages/Onboarding").then((m) => ({ default: m.Onboarding })),
);

function LoadingScreen({ message }: { message?: string }) {
  return <LoadingScreenComponent message={message || "Chargement..."} />;
}

function AppShell() {
  const { isLoading, user } = useAuth();
  const { isOpen, openChat, closeChat } = useTIGuy(user?.id ?? "anonymous");
  const location = useLocation();
  const isFeedPage = location.pathname === "/feed" || location.pathname === "/";
  const isMessagesPage = location.pathname === "/messages";

  // Hard cap: never show loading screen for more than 3.5s
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setForceReady(true), 3500);
    return () => clearTimeout(t);
  }, [isLoading]);

  // Show onboarding overlay for new users after 3s on the feed
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    if (!user || localStorage.getItem("zyeute_onboarded")) return;
    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    const isNewUser = Date.now() - createdAt < 30 * 60 * 1000; // 30 min window
    if (!isNewUser) {
      localStorage.setItem("zyeute_onboarded", "true");
      return;
    }
    const t = setTimeout(() => setShowOnboarding(true), 3000);
    return () => clearTimeout(t);
  }, [user]);

  if (isLoading && !forceReady) {
    return <LoadingScreen message="Chargement..." />;
  }

  return (
    <>
      <ApiHealthBanner />
      <AgeGateModal />
      
      {/* Global Desktop Layout Wrapper */}
      <div className="flex flex-col min-h-screen w-full">
        <DesktopHeader />
        <div className="flex flex-1 pt-0 lg:pt-16">
          <DesktopSidebar />
          <main className="flex-1 lg:ml-[240px] relative w-full min-h-[calc(100vh-64px)] overflow-x-hidden">
            <AppRoutes />
          </main>
        </div>
      </div>
      {user ? (
        <>
          {!isOpen && !isFeedPage && !isMessagesPage && (
            <TIGuyButton onClick={openChat} />
          )}
          <Suspense fallback={null}>
            <TIGuyFullScreen
              isOpen={isOpen}
              onClose={closeChat}
              userId={user.id}
              username={user.username}
            />
          </Suspense>
          {showOnboarding && (
            <Suspense fallback={null}>
              <OnboardingOverlay
                overlay
                onClose={() => setShowOnboarding(false)}
              />
            </Suspense>
          )}
        </>
      ) : null}
    </>
  );
}

function AppContent() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BorderColorProvider>
          <NavigationStateProvider>
            <NotificationProvider>
              <MessagingProvider>
                <ColonyProvider>
                  <HiveProvider>
                    <AppContent />
                    <Analytics />
                  </HiveProvider>
                </ColonyProvider>
              </MessagingProvider>
            </NotificationProvider>
          </NavigationStateProvider>
        </BorderColorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
