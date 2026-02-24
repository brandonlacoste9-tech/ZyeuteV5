// RESTORE: Full app with actual Feed component
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { NavigationStateProvider } from "@/contexts/NavigationStateContext";
import { NetworkQueueProvider } from "@/contexts/NetworkQueueContext";
import { MediaSessionProvider } from "@/contexts/MediaSessionContext";
import { BorderColorProvider } from "@/contexts/BorderColorContext";
import { HiveProvider } from "@/contexts/HiveContext";
import { Login } from "@/pages/Login";
import { Feed } from "@/pages/Feed";

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
                            <Route path="/feed" element={<Feed />} />
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
