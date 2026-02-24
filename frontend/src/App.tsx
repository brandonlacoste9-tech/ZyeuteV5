// ULTRA MINIMAL - No providers, no hooks, just static
export default function App() {
  return (
    <div style={{ 
      padding: 50, 
      textAlign: "center", 
      fontFamily: "Arial",
      background: "#000",
      color: "#fff",
      minHeight: "100vh"
    }}>
      <h1>🐝 ZYEUTE TEST</h1>
      <p>If you see this, the app loads!</p>
      <p>Now we know the issue is in providers...</p>
    </div>
  );
}
