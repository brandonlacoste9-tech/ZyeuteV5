// TEST: Feed component with NO video (isolate the issue)
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

// Simple feed without ContinuousFeed
function SimpleFeedTest() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div style={{color: "#fff", padding: 50}}>Loading auth...</div>;
  
  return (
    <div style={{ padding: 50, textAlign: "center", background: "#000", color: "#fff", minHeight: "100vh" }}>
      <h1>🐝 FEED TEST</h1>
      <p>User: {user?.email || "Guest"}</p>
      <p>This page loaded! Auth works!</p>
      <p>Now we need to test the actual Feed component...</p>
    </div>
  );
}

// Original Login
import { Login } from "@/pages/Login";

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
                            <Route path="/feed" element={<SimpleFeedTest />} />
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
