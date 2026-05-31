/**
 * ZYEUTÉ — root shell: providers, routing, Ti-Guy.
 * Feature pages live under `src/pages` and are wired in `src/routes/AppRoutes.tsx`.\
 */

import { lazy, Suspense } from "react";
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
import { Analytics } from "@vercel/analytics/react";

// Lazy-load TIGuyFullScreen to keep it out of the main index chunk.
// It imports from @/lib/supabase at module level; eagerly bundling it into
// the index chunk caused a TDZ ReferenceError in the esbuild-minified output.
const TIGuyFullScreen = lazy(() =>
  import("@/components/tiguy/TIGuyFullScreen").then((m) => ({
    default: m.TIGuyFullScreen,
  })),
);

function LoadingScreen({ message }: { message?: string }) {
  return <LoadingScreenComponent message={message || "Chargement..."} />;
}

function AppShell() {
  const { isLoading, user } = useAuth();
  const { isOpen, openChat, closeChat } = useTIGuy(user?.id ?? "anonymous");
  const location = useLocation();
  const isFeedPage = location.pathname === "/feed" || location.pathname === "/";

  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  return (
    <>
      <ApiHealthBanner />
      <AgeGateModal />
      <AppRoutes />
      {user ? (
        <>
          {!isOpen && !isFeedPage && <TIGuyButton onClick={openChat} />}
          <Suspense fallback={null}>
            <TIGuyFullScreen
              isOpen={isOpen}
              onClose={closeChat}
              userId={user.id}
              username={user.username}
            />
          </Suspense>
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
