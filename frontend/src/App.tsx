// STABILIZE: Disable Feed, show simple success page
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { NavigationStateProvider } from "@/contexts/NavigationStateContext";
import { NetworkQueueProvider } from "@/contexts/NetworkQueueContext";
import { MediaSessionProvider } from "@/contexts/MediaSessionContext";
import { BorderColorProvider } from "@/contexts/BorderColorContext";
import { HiveProvider } from "@/contexts/HiveContext";
import { Login } from "@/pages/Login";

// Stable feed (no ContinuousFeed)
function StableFeed() {
  const { user } = useAuth();
  
  return (
    <div style={{ padding: 50, textAlign: "center", background: "#000", color: "#fff", minHeight: "100vh" }}>
      <h1>🐝 ZYEUTE FEED</h1>
      <p>Welcome, {user?.email}!</p>
      <p>Feed is temporarily disabled due to render loop issue.</p>
      <p>We're fixing the video components...</p>
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
              <NavigationStateProvider>
                <NetworkQueueProvider>
                  <MediaSessionProvider>
                    <BorderColorProvider>
                      <BrowserRouter>
                        <HiveProvider>
                          <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/feed" element={<StableFeed />} />
                            <Route path="*" element={<Navigate to="/login" />} />
                          </Routes>
                        </HiveProvider>
                      </BrowserRouter>
                    </BorderColorProvider>
                  </MediaSessionProvider>
                </NetworkQueueProvider>
              </NavigationStateProvider>
            </RBACProvider>
          </GuestModeProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
