/**
 * ULTRA MINIMAL TEST - No providers except essentials
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Ultra minimal pages
const MinimalLogin = () => (
  <div style={{ padding: 40, textAlign: "center" }}>
    <h1>ZYEUTE LOGIN</h1>
    <button onClick={() => window.location.href = "/feed"}>Go to Feed</button>
  </div>
);

const MinimalFeed = () => (
  <div style={{ padding: 40, textAlign: "center" }}>
    <h1>FEED WORKS!</h1>
    <p>If you see this, Theme + Auth are OK</p>
    <button onClick={() => window.location.reload()}>Reload</button>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<MinimalLogin />} />
            <Route path="/feed" element={<MinimalFeed />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
