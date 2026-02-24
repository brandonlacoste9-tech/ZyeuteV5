/**
 * MINIMAL App - Complete Provider Isolation Test
 * Original hierarchy from App.tsx (outer to inner):
 * 
 * 1. ErrorBoundary
 * 2. FactoryThemeProvider
 * 3. ThemeProvider
 * 4. NotificationProvider
 * 5. AuthProvider
 * 6. GuestModeProvider
 * 7. RBACProvider
 * 8. ColonyProvider (Socket - DISABLED)
 * 9. NavigationStateProvider
 * 10. NetworkQueueProvider
 * 11. MediaSessionProvider
 * 12. GlobalAuthLoader
 * 13. BorderColorProvider
 * 14. BrowserRouter
 * 15. HiveProvider
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Contexts in order
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

// Pages
import Login from "@/pages/Login";
import Feed from "@/pages/Feed";

// ============================================
// STEP TESTS - Uncomment ONE at a time
// ============================================

// STEP 1: Theme + Auth (baseline)
function Step1_ThemeAuth() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/feed" element={<div>STEP 1: Theme+Auth WORKS</div>} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

// STEP 2: + NotificationProvider
function Step2_Notification() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/feed" element={<div>STEP 2: +Notification WORKS</div>} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

// STEP 3: + GuestModeProvider
function Step3_GuestMode() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <GuestModeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/feed" element={<div>STEP 3: +GuestMode WORKS</div>} />
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            </BrowserRouter>
          </GuestModeProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

// STEP 4: + RBACProvider
function Step4_RBAC() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <GuestModeProvider>
            <RBACProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/feed" element={<div>STEP 4: +RBAC WORKS</div>} />
                  <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
              </BrowserRouter>
            </RBACProvider>
          </GuestModeProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

// STEP 5: + ColonyProvider (Socket - DISABLED in code)
function Step5_Colony() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <GuestModeProvider>
            <RBACProvider>
              <ColonyProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/feed" element={<div>STEP 5: +Colony WORKS</div>} />
                    <Route path="*" element={<Navigate to="/login" />} />
                  </Routes>
                </BrowserRouter>
              </ColonyProvider>
            </RBACProvider>
          </GuestModeProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

// STEP 6: + NavigationStateProvider
function Step6_NavigationState() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <GuestModeProvider>
            <RBACProvider>
              <ColonyProvider>
                <NavigationStateProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/feed" element={<div>STEP 6: +NavigationState WORKS</div>} />
                      <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                  </BrowserRouter>
                </NavigationStateProvider>
              </ColonyProvider>
            </RBACProvider>
          </GuestModeProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

// STEP 7: + NetworkQueueProvider
function Step7_NetworkQueue() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <GuestModeProvider>
            <RBACProvider>
              <ColonyProvider>
                <NavigationStateProvider>
                  <NetworkQueueProvider>
                    <BrowserRouter>
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/feed" element={<div>STEP 7: +NetworkQueue WORKS</div>} />
                        <Route path="*" element={<Navigate to="/login" />} />
                      </Routes>
                    </BrowserRouter>
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

// STEP 8: + MediaSessionProvider
function Step8_MediaSession() {
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
                      <BrowserRouter>
                        <Routes>
                          <Route path="/login" element={<Login />} />
                          <Route path="/feed" element={<div>STEP 8: +MediaSession WORKS</div>} />
                          <Route path="*" element={<Navigate to="/login" />} />
                        </Routes>
                      </BrowserRouter>
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

// STEP 9: + BorderColorProvider
function Step9_BorderColor() {
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
                          <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/feed" element={<div>STEP 9: +BorderColor WORKS</div>} />
                            <Route path="*" element={<Navigate to="/login" />} />
                          </Routes>
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

// STEP 10: + HiveProvider
function Step10_Hive() {
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
                              <Route path="/feed" element={<div>STEP 10: +Hive WORKS</div>} />
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

// STEP 11: Actual Feed Component (THE REAL TEST)
function Step11_RealFeed() {
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
                              <Route path="/feed" element={<Feed />} />
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

// ============================================
// TESTING: NavigationState, NetworkQueue, MediaSession
// UNCOMMENT ONE, TEST, REPORT BACK
// ============================================

// TEST A: NavigationStateProvider
// export default Step6_NavigationState;

// TEST B: NetworkQueueProvider (MOST LIKELY CULPRIT)
// export default Step7_NetworkQueue;

// TEST C: MediaSessionProvider
export default Step8_MediaSession;
