// STEP 3: Test NotificationProvider
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <div style={{ padding: 50, textAlign: "center", fontFamily: "Arial", background: "#000", color: "#fff", minHeight: "100vh" }}>
          <h1>🐝 STEP 3: NotificationProvider</h1>
          <p>If this works, the issue is NOT in NotificationProvider...</p>
          <p>Next test: AuthProvider (🚨 MOST LIKELY!)</p>
        </div>
      </NotificationProvider>
    </ThemeProvider>
  );
}
