// STEP 4: Test AuthProvider (🚨 MOST LIKELY TO FREEZE!)
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <div style={{ padding: 50, textAlign: "center", fontFamily: "Arial", background: "#000", color: "#fff", minHeight: "100vh" }}>
            <h1>🐝 STEP 4: AuthProvider</h1>
            <p>If this FREEZES - we found the culprit!</p>
            <p>AuthProvider calls Supabase + Backend API...</p>
          </div>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
