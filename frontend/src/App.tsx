// STEP 10: Test MediaSessionProvider
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { ColonyProvider } from "@/components/providers/colony-provider";
import { NavigationStateProvider } from "@/contexts/NavigationStateContext";
import { NetworkQueueProvider } from "@/contexts/NetworkQueueContext";
import { MediaSessionProvider } from "@/contexts/MediaSessionContext";

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <GuestModeProvider>
            <RBACProvider>
              <ColonyProvider>
                <NavigationStateProvider>
                  <NetworkQueueProvider>
                    <MediaSessionProvider>
                      <div style={{ padding: 50, textAlign: "center", fontFamily: "Arial", background: "#000", color: "#fff", minHeight: "100vh" }}>
                        <h1>🐝 STEP 10: MediaSessionProvider</h1>
                        <p>Testing MediaSessionProvider...</p>
                      </div>
                    </MediaSessionProvider>
                  </NetworkQueueProvider>
                </NavigationStateProvider>
              </ColonyProvider>
            </RBACProvider>
          </GuestModeProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
