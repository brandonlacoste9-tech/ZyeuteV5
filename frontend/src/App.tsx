// STEP 7: Test ColonyProvider (Socket.IO)
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { ColonyProvider } from "@/components/providers/colony-provider";

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <GuestModeProvider>
            <RBACProvider>
              <ColonyProvider>
                <div style={{ padding: 50, textAlign: "center", fontFamily: "Arial", background: "#000", color: "#fff", minHeight: "100vh" }}>
                  <h1>🐝 STEP 7: ColonyProvider</h1>
                  <p>Testing ColonyProvider (Socket.IO)...</p>
                </div>
              </ColonyProvider>
            </RBACProvider>
          </GuestModeProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
