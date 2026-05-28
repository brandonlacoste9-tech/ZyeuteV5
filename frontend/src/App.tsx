export default function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0a0a0a",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "2rem", letterSpacing: "0.04em" }}>
          Zyeute
        </h1>
        <p style={{ marginTop: "0.75rem", opacity: 0.8 }}>
          Frontend build is now configured for Vercel.
        </p>
      </div>
    </main>
  );
}
