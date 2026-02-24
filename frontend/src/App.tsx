// STEP 2: Test ThemeProvider
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <div style={{ padding: 50, textAlign: "center", fontFamily: "Arial", background: "#000", color: "#fff", minHeight: "100vh" }}>
        <h1>🐝 STEP 2: ThemeProvider</h1>
        <p>If this works, the issue is NOT in ThemeProvider...</p>
        <p>Next test: NotificationProvider</p>
      </div>
    </ThemeProvider>
  );
}
