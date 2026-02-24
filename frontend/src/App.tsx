// STEP 12: Test BrowserRouter + HiveProvider (THE FINAL PROVIDERS!)
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { ColonyProvider } from "@/components/providers/colony-provider";
import { NavigationStateProvider } from "@/contexts/NavigationStateContext";
import { NetworkQueueProvider } from "@/contexts/NetworkQueueContext";
import { MediaSessionProvider } from "@/contexts/MediaSessionContext";
import { BorderColorProvider } from "@/contexts/BorderColorContext";
import { HiveProvider } from "@/contexts/HiveContext";

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
                      <BorderColorProvider>
                        <BrowserRouter>
                          <HiveProvider>
                            <div style={{ padding: 50, textAlign: "center", fontFamily: "Arial", background: "#000", color: "#fff", minHeight: "100vh" }}>
                              <h1>🐝 STEP 12: ALL PROVIDERS!</h1>
                              <p>BrowserRouter + HiveProvider...</p>
                              <p>If this works, the issue is NOT in any provider!</p>
                              <p>The freeze must be in the Feed component itself!</p>
                            </div>
                          </HiveProvider>
                        </BrowserRouter>
                      </BorderColorProvider>
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
