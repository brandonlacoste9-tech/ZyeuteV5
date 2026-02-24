// TEST: Google Sign-In + Simple Feed
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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

// Simple login with Google
function SimpleLogin() {
  const handleGoogleSignIn = async () => {
    console.log("Starting Google sign-in...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/feed",
      },
    });
    if (error) console.error("Google sign-in error:", error);
  };

  return (
    <div style={{ padding: 50, textAlign: "center", background: "#111", color: "#fff", minHeight: "100vh" }}>
      <h1>🐝 ZYEUTE LOGIN TEST</h1>
      <button 
        onClick={handleGoogleSignIn}
        style={{ padding: "15px 30px", fontSize: 18, cursor: "pointer", background: "#4285f4", color: "#fff", border: "none", borderRadius: 5 }}
      >
        Sign in with Google
      </button>
    </div>
  );
}

// Simple feed
function SimpleFeed() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div style={{color: "#fff", padding: 50}}>Loading...</div>;
  
  return (
    <div style={{ padding: 50, textAlign: "center", background: "#000", color: "#fff", minHeight: "100vh" }}>
      <h1>🐝 FEED LOADED!</h1>
      <p>User: {user?.email || "No user"}</p>
      <p>Google sign-in worked!</p>
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
                            <Route path="/login" element={<SimpleLogin />} />
                            <Route path="/feed" element={<SimpleFeed />} />
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
