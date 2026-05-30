/**
 * ZYEUTÉ — root shell: providers, routing, Ti-Guy.
 * Feature pages live under `src/pages` and are wired in `src/routes/AppRoutes.tsx`.
 */

import { BrowserRouter as Router } from "react-router-dom";
import { LoadingScreen as LoadingScreenComponent } from "./components/LoadingScreen";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TIGuyFullScreen } from "@/components/tiguy/TIGuyFullScreen";
import { TIGuyButton } from "@/components/tiguy/TIGuyButton";
import { useTIGuy } from "@/components/tiguy/useTIGuy";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BorderColorProvider } from "@/contexts/BorderColorContext";
import { NavigationStateProvider } from "@/contexts/NavigationStateContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ColonyProvider } from "@/components/providers/colony-provider";
import { AppRoutes } from "@/routes/AppRoutes";
import { ApiHealthBanner } from "@/components/system/ApiHealthBanner";
import { AgeGateModal } from "@/components/system/AgeGateModal";
import { Analytics } from "@vercel/analytics/react";

function LoadingScreen({ message }: { message?: string }) {
  return <LoadingScreenComponent message={message || "Chargement..."} />;
}

function AppContent() {
  const { isLoading, user } = useAuth();
  const { isOpen, openChat, closeChat } = useTIGuy(user?.id ?? "anonymous");

  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  return (
    <Router>
      <ApiHealthBanner />
      <AgeGateModal />
      <AppRoutes />
      {user ? (
        <>
          {!isOpen && <TIGuyButton onClick={openChat} />}
          <TIGuyFullScreen
            isOpen={isOpen}
            onClose={closeChat}
            userId={user.id}
            username={user.username}
          />
        </>
      ) : null}
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
              <ColonyProvider>
                <AppContent />
                <Analytics />
              </ColonyProvider>
            </NotificationProvider>
          </NavigationStateProvider>
        </BorderColorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
