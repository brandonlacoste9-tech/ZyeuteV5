// ULTRA SIMPLE - Test if login navigation works
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Ultra simple login
function SimpleLogin() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 50, textAlign: "center", background: "#111", color: "#fff", minHeight: "100vh" }}>
      <h1>🐝 ZYEUTE LOGIN TEST</h1>
      <button 
        onClick={() => navigate("/feed")}
        style={{ padding: "15px 30px", fontSize: 18, cursor: "pointer" }}
      >
        GO TO FEED (No Auth)
      </button>
    </div>
  );
}

// Ultra simple feed
function SimpleFeed() {
  return (
    <div style={{ padding: 50, textAlign: "center", background: "#111", color: "#fff", minHeight: "100vh" }}>
      <h1>🐝 FEED LOADED!</h1>
      <p>Navigation works! No freeze!</p>
      <button onClick={() => window.location.href = "/login"}>Back</button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<SimpleLogin />} />
        <Route path="/feed" element={<SimpleFeed />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
