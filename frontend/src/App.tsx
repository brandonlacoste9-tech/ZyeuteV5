// FINAL TEST: Bypass Feed, test API directly
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { Login } from "@/pages/Login";

// Simple placeholder instead of Feed
function FeedPlaceholder() {
  return (
    <div style={{ padding: 50, textAlign: "center", background: "#000", color: "#fff", minHeight: "100vh" }}>
      <h1>🐝 FEED PLACEHOLDER</h1>
      <p>Login worked! But Feed component is bypassed.</p>
      <p>The issue is in the Feed/Video components.</p>
      <button onClick={() => window.location.href = "/login"}>Back to Login</button>
    </div>
  );
}

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
                            <Routes>
                              <Route path="/login" element={<Login />} />
                              <Route path="/feed" element={<FeedPlaceholder />} />
                              <Route path="*" element={<Navigate to="/login" />} />
                            </Routes>
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
