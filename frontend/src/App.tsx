// STEP 9: Test NetworkQueueProvider
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { ColonyProvider } from "@/components/providers/colony-provider";
import { NavigationStateProvider } from "@/contexts/NavigationStateContext";
import { NetworkQueueProvider } from "@/contexts/NetworkQueueContext";

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
                    <div style={{ padding: 50, textAlign: "center", fontFamily: "Arial", background: "#000", color: "#fff", minHeight: "100vh" }}>
                      <h1>🐝 STEP 9: NetworkQueueProvider</h1>
                      <p>Testing NetworkQueueProvider...</p>
                    </div>
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
