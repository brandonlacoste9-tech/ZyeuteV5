/**
 * ZYEUTÉ - Quebec's TikTok
 * Full Login & Settings Feature Added
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  useRef,
  useCallback,
} from "react";
import { lazy, Suspense } from "react";
import { LoadingScreen as LoadingScreenComponent } from "./components/LoadingScreen";
import { ThemeProvider } from "./contexts/ThemeContext";
import { supabase, getSessionWithTimeout } from "@/lib/supabase";
import {
  TIGuyChat,
  TIGuyFullScreen,
  TIGuyButton,
  useTIGuy,
} from "@/components/tiguy";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Lazy-loaded pages for Pro-Tier Bundle Optimization
const LaZyeute = lazy(() =>
  import("./pages/LaZyeute").then((m) => ({ default: m.LaZyeute })),
);
const AIStudio = lazy(() =>
  import("./pages/AIStudio").then((m) => ({ default: m.AIStudio })),
);
const VideoDoctorDashboard = lazy(() =>
  import("@/components/admin/VideoDoctorDashboard").then((m) => ({
    default: m.VideoDoctorDashboard,
  })),
);
const TikTokCuration = lazy(() =>
  import("./components/features/TikTokCuration").then((m) => ({
    default: m.TikTokCuration,
  })),
);

// Note: If other pages like Profile, Settings, Search, etc. are also heavy, they should be lazy-loaded here too.
// For now, focusing on the heaviest identified components.

// ===== CONSTANTS - ANTIQUE GOLD & RICH LEATHER =====
const COLORS = {
  // Antique Gold Palette
  gold: "#C9A227",
  goldLight: "#D4AF37",
  goldDark: "#8B6914",
  goldAccent: "#E8D5A3",

  // Rich Leather Browns
  brown: "#1A0F0A",
  brownLight: "#2C1810",
  brownDark: "#0D0705",
  leather: "#3D2418",
  leatherLight: "#4A2E20",

  // Warm Text
  text: "#F5E6D3",
  textCream: "#FAF3EB",
  textMuted: "#A68B7C",

  // Typography
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody: "'Inter', -apple-system, sans-serif",
};

// ===== COMPONENTS =====
// Beautiful black opening with gold fleur-de-lys emblem
function LoadingScreen({ message }: { message?: string }) {
  return <LoadingScreenComponent message={message || "Chargement..."} />;
}

// ===== LOGIN PAGE =====
function Login() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [mode, setMode] = useState("login"); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigate("/feed");
  }, [user, navigate]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/feed");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) throw error;
      setMode("login");
      setError("Account created! Please sign in.");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    navigate("/feed");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: COLORS.brown }}
    >
      {/* Background Effects */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,191,0,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo - Louis Vuitton meets Fleur-de-lis */}
        <div className="text-center mb-10">
          <div
            className="text-7xl mb-4"
            style={{ filter: "drop-shadow(0 4px 8px rgba(201, 162, 39, 0.3))" }}
          >
            ⚜️
          </div>
          <h1
            className="mb-3"
            style={{
              fontFamily: COLORS.fontDisplay,
              fontSize: "3.5rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              background:
                "linear-gradient(180deg, #E8D5A3 0%, #C9A227 50%, #8B6914 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 2px 10px rgba(201, 162, 39, 0.2)",
            }}
          >
            Zyeuté
          </h1>
          <p
            style={{
              fontFamily: COLORS.fontDisplay,
              fontSize: "1.125rem",
              fontStyle: "italic",
              color: COLORS.textMuted,
              letterSpacing: "0.05em",
            }}
          >
            L&apos;app sociale du Québec ⚜️
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 p-4 rounded-xl text-center text-sm"
            style={{
              background: error.includes("created")
                ? "rgba(74, 222, 128, 0.2)"
                : "rgba(255, 68, 68, 0.2)",
              border: `1px solid ${error.includes("created") ? "#4ade80" : "#ff4444"}`,
              color: error.includes("created") ? "#4ade80" : "#ff4444",
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        {mode === "login" && (
          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Email Input with Stitching */}
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-5 rounded-xl text-base"
                style={{
                  background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brownLight} 100%)`,
                  border: `2px dashed ${COLORS.gold}30`,
                  color: COLORS.text,
                  fontFamily: COLORS.fontBody,
                  boxShadow:
                    "inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03)",
                }}
              />
            </div>

            {/* Password Input with Stitching */}
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-5 rounded-xl text-base"
                style={{
                  background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brownLight} 100%)`,
                  border: `2px dashed ${COLORS.gold}30`,
                  color: COLORS.text,
                  fontFamily: COLORS.fontBody,
                  boxShadow:
                    "inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03)",
                }}
              />
            </div>

            {/* Buckle Button - Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-lg font-semibold text-base transition-all duration-300 relative overflow-hidden"
              style={{
                background: loading
                  ? "linear-gradient(145deg, #6B4E14 0%, #4A3410 100%)"
                  : "linear-gradient(180deg, #D4AF37 0%, #C9A227 50%, #A68317 100%)",
                color: "#1A0F0A",
                fontFamily: COLORS.fontDisplay,
                fontSize: "1.125rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                border: "2px solid #6B4E14",
                boxShadow:
                  "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
                opacity: loading ? 0.8 : 1,
              }}
            >
              <span style={{ position: "relative", zIndex: 1 }}>
                {loading ? "Signing in..." : "Sign In"}
              </span>
            </button>

            <div
              className="flex justify-between text-sm pt-2"
              style={{ color: COLORS.textMuted }}
            >
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="hover:underline transition-all"
                style={{
                  color: COLORS.gold,
                  fontFamily: COLORS.fontBody,
                }}
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="hover:underline transition-all"
                style={{
                  color: COLORS.gold,
                  fontFamily: COLORS.fontBody,
                }}
              >
                Create account
              </button>
            </div>
          </form>
        )}

        {/* Signup Form */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-4 rounded-xl"
                style={{
                  background: COLORS.leather,
                  border: `1px solid ${COLORS.gold}40`,
                  color: COLORS.text,
                }}
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-4 rounded-xl"
                style={{
                  background: COLORS.leather,
                  border: `1px solid ${COLORS.gold}40`,
                  color: COLORS.text,
                }}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-4 rounded-xl"
                style={{
                  background: COLORS.leather,
                  border: `1px solid ${COLORS.gold}40`,
                  color: COLORS.text,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold transition-transform"
              style={{
                background: COLORS.gold,
                color: COLORS.brownDark,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="hover:underline"
                style={{ color: COLORS.gold }}
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password */}
        {mode === "forgot" && (
          <form className="space-y-4">
            <p
              className="text-center text-sm"
              style={{ color: COLORS.textMuted }}
            >
              Enter your email and we'll send you a reset link.
            </p>
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-4 rounded-xl"
                style={{
                  background: COLORS.leather,
                  border: `1px solid ${COLORS.gold}40`,
                  color: COLORS.text,
                }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-bold"
              style={{ background: COLORS.gold, color: COLORS.brownDark }}
            >
              Send Reset Link
            </button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="hover:underline"
                style={{ color: COLORS.gold }}
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* Belt Bar Divider - Like TI-GUY */}
        <div className="relative my-8 py-3">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${COLORS.leatherLight} 0%, ${COLORS.leather} 50%, ${COLORS.brownLight} 100%)`,
              borderTop: `1px dashed ${COLORS.gold}40`,
              borderBottom: `1px dashed ${COLORS.gold}40`,
            }}
          />
          <div className="relative flex items-center justify-center">
            <span
              className="px-4 text-sm uppercase tracking-widest"
              style={{
                color: COLORS.gold,
                fontFamily: COLORS.fontDisplay,
                letterSpacing: "0.2em",
              }}
            >
              Or
            </span>
          </div>
        </div>

        {/* Social Login */}
        <div className="space-y-4">
          {/* Google Button - Leather Style */}
          <button
            onClick={signInWithGoogle}
            className="w-full py-5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300"
            style={{
              background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brownLight} 100%)`,
              border: `2px dashed ${COLORS.gold}30`,
              color: COLORS.text,
              fontFamily: COLORS.fontBody,
              fontWeight: 500,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Guest Button */}
          <button
            onClick={handleGuest}
            className="w-full py-5 rounded-xl transition-all duration-300"
            style={{
              background: "transparent",
              border: `2px dashed ${COLORS.gold}50`,
              color: COLORS.gold,
              fontFamily: COLORS.fontDisplay,
              fontSize: "1rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Continue as Guest
          </button>
        </div>

        {/* Footer */}
        <p
          className="text-center mt-10 text-xs"
          style={{
            color: COLORS.textMuted,
            fontFamily: COLORS.fontBody,
            letterSpacing: "0.02em",
          }}
        >
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

// ===== BOTTOM NAVIGATION - Belt Bar Style =====
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      path: "/feed",
      icon: "ph-house",
      iconFill: "ph-fill ph-house",
      label: "Home",
    },
    {
      path: "/search",
      icon: "ph-magnifying-glass",
      iconFill: "ph-fill ph-magnifying-glass",
      label: "Search",
    },
    {
      path: "/create",
      icon: "ph-plus",
      iconFill: "ph-fill ph-plus",
      label: "Create",
      isCenter: true,
    },
    {
      path: "/notifications",
      icon: "ph-bell",
      iconFill: "ph-fill ph-bell",
      label: "Notifications",
    },
    {
      path: "/profile",
      icon: "ph-user",
      iconFill: "ph-fill ph-user",
      label: "Profile",
    },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-6 z-50"
      style={{
        background: `linear-gradient(180deg, ${COLORS.leather} 0%, ${COLORS.brownLight} 50%, ${COLORS.brown} 100%)`,
        height: "80px",
        paddingBottom: "16px",
        borderTop: `1px solid ${COLORS.gold}30`,
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center justify-center transition-all duration-300 ${item.isCenter ? "relative -top-5" : ""}`}
          style={{
            color: currentPath === item.path ? COLORS.gold : COLORS.textMuted,
            opacity: currentPath === item.path ? 1 : 0.6,
          }}
        >
          {item.isCenter ? (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${COLORS.goldLight} 0%, ${COLORS.gold} 50%, ${COLORS.goldDark} 100%)`,
                border: `2px solid ${COLORS.goldDark}`,
                boxShadow: `0 4px 15px rgba(201, 162, 39, 0.4)`,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={COLORS.brownDark}
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke={COLORS.brownDark}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ) : (
            <>
              {item.path === "/feed" && (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={currentPath === item.path ? COLORS.gold : "none"}
                  stroke={
                    currentPath === item.path ? COLORS.gold : COLORS.textMuted
                  }
                  strokeWidth="2"
                  className="mb-1"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              )}
              {item.path === "/search" && (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={
                    currentPath === item.path ? COLORS.gold : COLORS.textMuted
                  }
                  strokeWidth="2"
                  className="mb-1"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
              {item.path === "/notifications" && (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={currentPath === item.path ? COLORS.gold : "none"}
                  stroke={
                    currentPath === item.path ? COLORS.gold : COLORS.textMuted
                  }
                  strokeWidth="2"
                  className="mb-1"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              )}
              {item.path === "/profile" && (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={currentPath === item.path ? COLORS.gold : "none"}
                  stroke={
                    currentPath === item.path ? COLORS.gold : COLORS.textMuted
                  }
                  strokeWidth="2"
                  className="mb-1"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
              <span
                className="text-xs"
                style={{
                  fontWeight: currentPath === item.path ? 600 : 400,
                  color:
                    currentPath === item.path ? COLORS.gold : COLORS.textMuted,
                }}
              >
                {item.label}
              </span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// ===== SETTINGS PAGE =====
function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("account");

  useEffect(() => {
    const savedColor = localStorage.getItem("edgeColor");
    if (savedColor) {
      document.documentElement.style.setProperty("--edge-color", savedColor);
      const r = parseInt(savedColor.slice(1, 3), 16);
      const g = parseInt(savedColor.slice(3, 5), 16);
      const b = parseInt(savedColor.slice(5, 7), 16);
      document.documentElement.style.setProperty("--edge-glow", "transparent");
    }
  }, []);

  const [settings, setSettings] = useState<any>({
    username: user?.username || "",
    email: (user as any)?.email || "",
    phone: "",
    bio: "Quebec Creator ⚜️",
    privateAccount: false,
    allowComments: true,
    allowDuet: true,
    allowDownload: true,
    pushNotifications: true,
    emailNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    liveNotifications: true,
    darkMode: true,
    highContrast: false,
    reducedMotion: false,
    language: "English",
    contentLanguage: "All",
  });

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    alert("Settings saved! 🐝");
  };

  const menuItems = [
    { id: "account", icon: "ph-user", label: "Account" },
    { id: "privacy", icon: "ph-lock-key", label: "Privacy" },
    { id: "notifications", icon: "ph-bell", label: "Notifications" },
    { id: "appearance", icon: "ph-palette", label: "Appearance" },
    { id: "language", icon: "ph-globe", label: "Language" },
    { id: "help", icon: "ph-question", label: "Help & Support" },
    { id: "about", icon: "ph-info", label: "About" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
                style={{
                  background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brown} 100%)`,
                  border: `3px solid ${COLORS.gold}`,
                  boxShadow: `0 0 30px ${COLORS.gold}30`,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <button className="text-sm" style={{ color: COLORS.gold }}>
                Change Photo
              </button>
            </div>

            <div
              className="p-4 rounded-2xl stitched relative"
              style={{ background: COLORS.leather }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: COLORS.textMuted }}
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    value={settings.username}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl"
                    style={{
                      background: COLORS.brown,
                      border: `1px solid ${COLORS.gold}40`,
                      color: COLORS.text,
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: COLORS.textMuted }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl"
                    style={{
                      background: COLORS.brown,
                      border: `1px solid ${COLORS.gold}40`,
                      color: COLORS.text,
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: COLORS.textMuted }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Add phone number"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{
                      background: COLORS.brown,
                      border: `1px solid ${COLORS.gold}40`,
                      color: COLORS.text,
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: COLORS.textMuted }}
                  >
                    Bio
                  </label>
                  <textarea
                    value={settings.bio}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl resize-none"
                    rows={3}
                    style={{
                      background: COLORS.brown,
                      border: `1px solid ${COLORS.gold}40`,
                      color: COLORS.text,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-4 rounded-xl font-bold mt-6"
              style={{ background: COLORS.gold, color: COLORS.brownDark }}
            >
              Save Changes
            </button>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6">
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: COLORS.gold }}
            >
              Privacy Settings
            </h2>
            <ToggleItem
              icon="ph-lock-key"
              title="Private Account"
              description="Only approved followers can see your content"
              checked={settings.privateAccount}
              onChange={() => handleToggle("privateAccount")}
            />
            <ToggleItem
              icon="ph-chat-circle"
              title="Allow Comments"
              description="Let others comment on your videos"
              checked={settings.allowComments}
              onChange={() => handleToggle("allowComments")}
            />
            <ToggleItem
              icon="ph-users"
              title="Allow Duets"
              description="Others can duet with your videos"
              checked={settings.allowDuet}
              onChange={() => handleToggle("allowDuet")}
            />
            <ToggleItem
              icon="ph-download"
              title="Allow Downloads"
              description="Others can download your videos"
              checked={settings.allowDownload}
              onChange={() => handleToggle("allowDownload")}
            />
            <div
              className="pt-6 border-t"
              style={{ borderColor: `${COLORS.gold}30` }}
            >
              <button
                className="w-full py-3 rounded-xl font-bold border mb-3"
                style={{ borderColor: "#ff4444", color: "#ff4444" }}
              >
                Blocked Users
              </button>
              <button
                className="w-full py-3 rounded-xl font-bold border"
                style={{ borderColor: "#ff4444", color: "#ff4444" }}
              >
                Restricted Accounts
              </button>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: COLORS.gold }}
            >
              Notification Settings
            </h2>
            <ToggleItem
              icon="ph-bell"
              title="Push Notifications"
              description="Receive push notifications"
              checked={settings.pushNotifications}
              onChange={() => handleToggle("pushNotifications")}
            />
            <ToggleItem
              icon="ph-envelope"
              title="Email Notifications"
              description="Receive email updates"
              checked={settings.emailNotifications}
              onChange={() => handleToggle("emailNotifications")}
            />
            <div
              className="pt-4 border-t"
              style={{ borderColor: `${COLORS.gold}30` }}
            >
              <h3
                className="font-bold mb-4"
                style={{ color: COLORS.textMuted }}
              >
                Activity Notifications
              </h3>
              <ToggleItem
                icon="ph-fire"
                title="Likes"
                description="When someone likes your video"
                checked={settings.likeNotifications}
                onChange={() => handleToggle("likeNotifications")}
              />
              <ToggleItem
                icon="ph-chat-circle"
                title="Comments"
                description="When someone comments on your video"
                checked={settings.commentNotifications}
                onChange={() => handleToggle("commentNotifications")}
              />
              <ToggleItem
                icon="ph-users"
                title="New Followers"
                description="When someone follows you"
                checked={settings.followNotifications}
                onChange={() => handleToggle("followNotifications")}
              />
              <ToggleItem
                icon="ph-video-camera"
                title="Live Streams"
                description="When accounts you follow go live"
                checked={settings.liveNotifications}
                onChange={() => handleToggle("liveNotifications")}
              />
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: COLORS.gold }}
            >
              Appearance
            </h2>
            <ToggleItem
              icon="ph-moon"
              title="Dark Mode"
              description="Use dark theme throughout the app"
              checked={settings.darkMode}
              onChange={() => handleToggle("darkMode")}
            />
            <ToggleItem
              icon="ph-eye"
              title="High Contrast"
              description="Increase contrast for better visibility"
              checked={settings.highContrast}
              onChange={() => handleToggle("highContrast")}
            />
            <ToggleItem
              icon="ph-film-strip"
              title="Reduced Motion"
              description="Minimize animations throughout the app"
              checked={settings.reducedMotion}
              onChange={() => handleToggle("reducedMotion")}
            />
            <div
              className="pt-4 border-t"
              style={{ borderColor: `${COLORS.gold}30` }}
            >
              <h3
                className="font-bold mb-4"
                style={{ color: COLORS.textMuted }}
              >
                Edge Lighting Color
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { color: "#C9A227", name: "Gold" },
                  { color: "#0066CC", name: "Blue" },
                  { color: "#00AA44", name: "Green" },
                  { color: "#CC0000", name: "Red" },
                  { color: "#8833CC", name: "Purple" },
                  { color: "#CC3377", name: "Pink" },
                  { color: "#FF6600", name: "Orange" },
                  { color: "#00AAAA", name: "Teal" },
                ].map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => {
                      document.documentElement.style.setProperty(
                        "--edge-color",
                        color,
                      );
                      const r = parseInt(color.slice(1, 3), 16);
                      const g = parseInt(color.slice(3, 5), 16);
                      const b = parseInt(color.slice(5, 7), 16);
                      document.documentElement.style.setProperty(
                        "--edge-glow",
                        `rgba(${r}, ${g}, ${b}, 0.6)`,
                      );
                      localStorage.setItem("edgeColor", color);
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105"
                    style={{ background: COLORS.leather }}
                    title={name}
                  >
                    <div
                      className="w-10 h-10 rounded-full border-2"
                      style={{
                        backgroundColor: color,
                        borderColor: `${color}80`,
                        boxShadow: `0 0 10px ${color}60`,
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: COLORS.textMuted }}
                    >
                      {name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "language":
        return (
          <div className="space-y-6">
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: COLORS.gold }}
            >
              Language
            </h2>
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl"
                style={{ background: COLORS.leather }}
              >
                <label
                  className="block text-sm mb-2"
                  style={{ color: COLORS.textMuted }}
                >
                  App Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl"
                  style={{
                    background: COLORS.brown,
                    border: `1px solid ${COLORS.gold}40`,
                    color: COLORS.text,
                  }}
                >
                  <option>English</option>
                  <option>Français (French)</option>
                </select>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ background: COLORS.leather }}
              >
                <label
                  className="block text-sm mb-2"
                  style={{ color: COLORS.textMuted }}
                >
                  Content Language
                </label>
                <select
                  value={settings.contentLanguage}
                  onChange={(e) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      contentLanguage: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl"
                  style={{
                    background: COLORS.brown,
                    border: `1px solid ${COLORS.gold}40`,
                    color: COLORS.text,
                  }}
                >
                  <option>All Languages</option>
                  <option>English</option>
                  <option>Français</option>
                  <option>Español</option>
                </select>
              </div>
            </div>
            <div
              className="p-4 rounded-xl mt-6"
              style={{
                background: `${COLORS.gold}20`,
                border: `1px solid ${COLORS.gold}40`,
              }}
            >
              <p className="text-sm" style={{ color: COLORS.text }}>
                🇨🇦 <strong>Quebec Pride!</strong> Zyeute celebrates
                French-Canadian culture and the Joual language.
              </p>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="space-y-4">
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: COLORS.gold }}
            >
              Help & Support
            </h2>
            <HelpItem
              icon="ph-book-open"
              title="Help Center"
              description="Find answers to common questions"
            />
            <HelpItem
              icon="ph-chat-circle"
              title="Contact Us"
              description="Get in touch with our support team"
            />
            <HelpItem
              icon="ph-bug"
              title="Report a Problem"
              description="Let us know if something's not working"
            />
            <HelpItem
              icon="ph-lightbulb"
              title="Feature Request"
              description="Suggest new features for Zyeute"
            />
            <HelpItem
              icon="ph-scroll"
              title="Community Guidelines"
              description="Rules for keeping Zyeute safe"
            />
            <HelpItem
              icon="ph-scales"
              title="Terms of Service"
              description="Legal terms and conditions"
            />
            <HelpItem
              icon="ph-shield"
              title="Privacy Policy"
              description="How we handle your data"
            />
          </div>
        );

      case "about":
        return (
          <div className="text-center py-8">
            <img
              src="/zyeute-beaver.svg"
              alt="Zyeuté"
              className="w-24 h-24 mx-auto mb-4"
            />
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: COLORS.gold, fontFamily: COLORS.fontDisplay }}
            >
              Zyeuté
            </h2>
            <p
              className="mb-6"
              style={{
                color: COLORS.textMuted,
                fontFamily: COLORS.fontDisplay,
                fontStyle: "italic",
              }}
            >
              L'app sociale du Québec
            </p>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              <div
                className="flex justify-between py-2"
                style={{ borderBottom: `1px solid ${COLORS.gold}20` }}
              >
                <span style={{ color: COLORS.textMuted }}>Version</span>
                <span style={{ color: COLORS.text }}>1.0.0</span>
              </div>
              <div
                className="flex justify-between py-2"
                style={{ borderBottom: `1px solid ${COLORS.gold}20` }}
              >
                <span style={{ color: COLORS.textMuted }}>Build</span>
                <span style={{ color: COLORS.text }}>2024.02.24</span>
              </div>
              <div
                className="flex justify-between py-2"
                style={{ borderBottom: `1px solid ${COLORS.gold}20` }}
              >
                <span style={{ color: COLORS.textMuted }}>Platform</span>
                <span style={{ color: COLORS.text }}>Web</span>
              </div>
            </div>
            <p
              className="mt-8 text-sm flex items-center justify-center gap-2"
              style={{ color: COLORS.textMuted }}
            >
              <i className="ph ph-map-pin" style={{ color: COLORS.gold }}></i>
              Made in Quebec, for Quebec
              <img src="/zyeute-icon.svg" alt="⚜️" className="w-4 h-4 inline" />
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      <div
        className="sticky top-0 z-40 p-4 flex items-center gap-4"
        style={{ background: COLORS.brownDark }}
      >
        <button
          onClick={() => navigate("/profile")}
          className="text-2xl"
          style={{ color: COLORS.text }}
        >
          ←
        </button>
        <h1 className="text-xl font-bold" style={{ color: COLORS.gold }}>
          Settings
        </h1>
      </div>

      <div className="flex">
        <div
          className="hidden md:block w-64 p-4 border-r"
          style={{
            borderColor: `${COLORS.gold}20`,
            minHeight: "calc(100vh - 140px)",
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-colors"
              style={{
                background:
                  activeSection === item.id
                    ? `${COLORS.gold}15`
                    : "transparent",
                color: activeSection === item.id ? COLORS.gold : COLORS.text,
                border:
                  activeSection === item.id
                    ? `2px dashed ${COLORS.gold}40`
                    : "2px dashed transparent",
              }}
            >
              <i className={`ph ${item.icon} text-lg`}></i>
              <span
                className="font-medium"
                style={{ fontFamily: COLORS.fontBody }}
              >
                {item.label}
              </span>
            </button>
          ))}
          <div
            className="mt-8 pt-6 border-t"
            style={{ borderColor: `${COLORS.gold}20` }}
          >
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500"
            >
              <i className="ph ph-sign-out text-xl"></i>
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </div>

        <div className="md:hidden w-full p-4">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="w-full px-4 py-3 rounded-xl"
            style={{
              background: COLORS.leather,
              border: `1px solid ${COLORS.gold}40`,
              color: COLORS.text,
            }}
          >
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.icon} {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 p-4 md:p-8">
          <div
            className="max-w-2xl mx-auto p-6 rounded-2xl"
            style={{
              background: `linear-gradient(145deg, ${COLORS.leather} 0%, rgba(58, 42, 34, 0.5) 100%)`,
              border: `1px solid rgba(255, 191, 0, 0.2)`,
            }}
          >
            {renderContent()}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// Toggle Item Component
function ToggleItem({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-5 rounded-xl"
      style={{
        background: COLORS.leather,
        border: `2px dashed ${COLORS.gold}20`,
      }}
    >
      <div className="flex items-center gap-4">
        <i className={`ph ${icon} text-2xl`} style={{ color: COLORS.gold }}></i>
        <div>
          <p
            className="font-medium"
            style={{ color: COLORS.text, fontFamily: COLORS.fontBody }}
          >
            {title}
          </p>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={onChange}
        className="w-14 h-8 rounded-full relative transition-colors"
        style={{ background: checked ? COLORS.gold : `${COLORS.textMuted}40` }}
      >
        <div
          className="absolute top-1 w-6 h-6 rounded-full transition-all"
          style={{
            background: "white",
            left: checked ? "calc(100% - 28px)" : "4px",
          }}
        />
      </button>
    </div>
  );
}

// Help Item Component
function HelpItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <button
      className="w-full flex items-center gap-4 p-5 rounded-xl text-left transition-colors"
      style={{
        background: COLORS.leather,
        border: `2px dashed ${COLORS.gold}20`,
      }}
    >
      <i className={`ph ${icon} text-2xl`} style={{ color: COLORS.gold }}></i>
      <div className="flex-1">
        <p
          className="font-medium"
          style={{ color: COLORS.text, fontFamily: COLORS.fontBody }}
        >
          {title}
        </p>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          {description}
        </p>
      </div>
      <span style={{ color: COLORS.textMuted }}>→</span>
    </button>
  );
}

// ... rest of the app components (VideoFeed, Search, Create, etc.) ...
// [Previous components remain the same]

// ===== COMMENTS MODAL =====
function CommentsModal({
  postId,
  onClose,
}: {
  postId?: number;
  onClose: () => void;
}) {
  const [comments, setComments] = useState([
    { id: 1, user: "marie_qc", text: "C'est ben beau!", avatar: "M" },
    { id: 2, user: "ti_guy_514", text: "Tabarnac c'est nice", avatar: "T" },
    { id: 3, user: "sarah_mtl", text: "Love this!", avatar: "S" },
  ]);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: Date.now(), user: "You", text: newComment, avatar: "Y" },
    ]);
    setNewComment("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl p-4"
        style={{
          background: `linear-gradient(145deg, ${COLORS.brown} 0%, ${COLORS.brownDark} 100%)`,
          borderTop: `2px solid ${COLORS.gold}40`,
          maxHeight: "70vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-12 h-1 rounded-full mx-auto mb-4"
          style={{ background: COLORS.gold }}
        />
        <h3
          className="text-xl font-bold mb-4 text-center"
          style={{ color: COLORS.gold, fontFamily: COLORS.fontDisplay }}
        >
          Comments
        </h3>

        <div className="overflow-y-auto mb-4" style={{ maxHeight: "40vh" }}>
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                style={{
                  background: COLORS.leather,
                  border: `1px solid ${COLORS.gold}`,
                }}
              >
                {comment.avatar}
              </div>
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: COLORS.gold }}
                >
                  @{comment.user}
                </p>
                <p style={{ color: COLORS.text }}>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-3 rounded-full"
            style={{
              background: COLORS.leather,
              border: `1px solid ${COLORS.gold}40`,
              color: COLORS.text,
            }}
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-full font-bold"
            style={{ background: COLORS.gold, color: COLORS.brownDark }}
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

// ===== PROFILE MODAL =====
function ProfileModal({
  user,
  onClose,
}: {
  user?: { username?: string };
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{
          background: `linear-gradient(145deg, ${COLORS.brown} 0%, ${COLORS.brownDark} 100%)`,
          border: `2px solid ${COLORS.gold}40`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
          style={{
            background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brown} 100%)`,
            border: `3px solid ${COLORS.gold}`,
            boxShadow: `0 0 30px ${COLORS.gold}30`,
          }}
        >
          {user?.username?.[0]?.toUpperCase() || "?"}
        </div>

        <h2 className="text-2xl font-bold mb-1" style={{ color: COLORS.gold }}>
          @{user?.username}
        </h2>
        <p
          className="mb-6 flex items-center justify-center gap-1"
          style={{ color: COLORS.textMuted }}
        >
          Quebec Creator
          <img src="/zyeute-icon.svg" alt="⚜️" className="w-4 h-4 inline" />
        </p>

        <div className="flex justify-around mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>
              1.2K
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Followers
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>
              89
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Following
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>
              456
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Likes
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 py-3 rounded-xl font-bold"
            style={{ background: COLORS.gold, color: COLORS.brownDark }}
          >
            Follow
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold border"
            style={{ borderColor: COLORS.gold, color: COLORS.gold }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== UPLOAD / CREATE PAGE =====
function Create() {
  const navigate = useNavigate();
  const [step, setStep] = useState("select");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isJoualizing, setIsJoualizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setStep("preview");
  };

  const handleUpload = async () => {
    if (!videoFile && !videoPreview) return;
    setUploading(true);
    setStep("uploading");

    try {
      // Case 1: AI Generated Video (URL based)
      if (videoPreview && !videoFile) {
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaUrl: videoPreview,
            caption: caption,
            content: caption,
            type: "video",
            hiveId: "quebec",
            aiGenerated: true,
            videoType: "url", // So backend knows it's a direct URL
          }),
        });

        if (response.ok) {
          setUploading(false);
          navigate("/feed");
        } else {
          throw new Error("Post creation failed");
        }
        return;
      }

      // Case 2: File Upload (Original logic)
      const formData = new FormData();
      if (videoFile) formData.append("video", videoFile);
      formData.append("caption", caption);
      formData.append("hive_id", "quebec");

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          setUploading(false);
          navigate("/feed");
        } else {
          alert("Upload failed. Please try again.");
          setUploading(false);
          setStep("caption");
        }
      };

      xhr.onerror = () => {
        alert("Upload failed. Please try again.");
        setUploading(false);
        setStep("caption");
      };

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
      setUploading(false);
      setStep("caption");
    }
  };

  if (step === "select") {
    return (
      <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
        <div className="p-4">
          <h1
            className="text-3xl mb-2"
            style={{
              color: COLORS.gold,
              fontFamily: COLORS.fontDisplay,
              fontWeight: 700,
            }}
          >
            Create [V2]
          </h1>
          <p
            className="mb-8 flex items-center justify-center gap-1"
            style={{
              color: COLORS.textMuted,
              fontFamily: COLORS.fontDisplay,
              fontStyle: "italic",
            }}
          >
            Share your Quebec story
            <img src="/zyeute-icon.svg" alt="⚜️" className="w-4 h-4 inline" />
          </p>

          <div className="space-y-5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 rounded-2xl flex flex-col items-center gap-4 transition-all duration-300"
              style={{
                background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brownLight} 100%)`,
                border: `2px dashed ${COLORS.gold}40`,
              }}
            >
              <i
                className="ph ph-video-camera text-5xl"
                style={{ color: COLORS.gold }}
              ></i>
              <span
                className="font-bold"
                style={{
                  color: COLORS.gold,
                  fontFamily: COLORS.fontDisplay,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Record Video
              </span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 rounded-2xl flex flex-col items-center gap-4 transition-all duration-300"
              style={{
                background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brownLight} 100%)`,
                border: `2px dashed ${COLORS.gold}40`,
              }}
            >
              <i
                className="ph ph-image text-5xl"
                style={{ color: COLORS.gold }}
              ></i>
              <span
                className="font-bold"
                style={{
                  color: COLORS.gold,
                  fontFamily: COLORS.fontDisplay,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Upload from Gallery
              </span>
            </button>

            <button
              onClick={() => setStep("ai_prompt")}
              className="w-full p-8 rounded-2xl flex flex-col items-center gap-4 transition-all duration-300"
              style={{
                background: `linear-gradient(145deg, #4c1d95 0%, #1e1b4b 100%)`,
                border: `2px dashed ${COLORS.gold}60`,
                boxShadow: `0 0 20px rgba(139, 92, 246, 0.3)`,
              }}
            >
              <i
                className="ph ph-sparkle text-5xl"
                style={{ color: COLORS.gold }}
              ></i>
              <div className="text-center">
                <span
                  className="block font-bold"
                  style={{
                    color: COLORS.gold,
                    fontFamily: COLORS.fontDisplay,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  AI Video Magic
                </span>
                <span className="text-xs text-purple-200 opacity-80">
                  Generate video from text prompt
                </span>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (step === "ai_prompt") {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: COLORS.brown }}
      >
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => setStep("select")}
            style={{ color: COLORS.text }}
          >
            Cancel
          </button>
          <span className="font-bold" style={{ color: COLORS.gold }}>
            AI Generator
          </span>
          <div className="w-12"></div>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-center gap-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🪄</div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: COLORS.gold, fontFamily: COLORS.fontDisplay }}
            >
              What should I create?
            </h2>
            <p className="text-sm text-white/60 mb-6">
              Describe the scene you want to generate.
            </p>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. A majestic beaver wearing a crown, standing on top of a giant poutine in downtown Montreal, cinematic lighting, highly detailed..."
            className="w-full h-40 p-5 rounded-2xl resize-none text-lg"
            style={{
              background: COLORS.leather,
              border: `2px dashed ${COLORS.gold}40`,
              color: COLORS.text,
              boxShadow: "inset 0 4px 10px rgba(0,0,0,0.3)",
            }}
          />

          <button
            onClick={async () => {
              if (!caption.trim()) return;
              setUploading(true);
              setStep("uploading");
              try {
                const response = await fetch("/api/v3/generate-video", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ prompt: caption }),
                });

                if (!response.ok) throw new Error("Generation failed");

                const data = await response.json();
                setVideoPreview(data.videoUrl);
                setStep("preview");
              } catch (_err) {
                alert("AI Generation failed. Check your API credits.");
                setStep("ai_prompt");
              } finally {
                setUploading(false);
              }
            }}
            disabled={!caption.trim() || uploading}
            className="w-full py-5 rounded-xl font-bold text-lg transition-all"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold} 0%, #B8860B 100%)`,
              color: COLORS.brownDark,
              boxShadow: `0 10px 20px rgba(201, 162, 39, 0.3)`,
              opacity: !caption.trim() || uploading ? 0.5 : 1,
            }}
          >
            {uploading ? "Generating Magic..." : "Generate Magic"}
          </button>

          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Winter in Quebec",
              "Montreal at night",
              "Maple forest",
              "Funny beaver",
            ].map((hint) => (
              <button
                key={hint}
                onClick={() => setCaption(hint)}
                className="px-4 py-2 rounded-full text-sm bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: COLORS.brown }}
      >
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => setStep("select")}
            style={{ color: COLORS.text }}
          >
            Cancel
          </button>
          <span className="font-bold" style={{ color: COLORS.gold }}>
            Preview
          </span>
          <button
            onClick={() => setStep("caption")}
            className="px-4 py-2 rounded-full font-bold"
            style={{ background: COLORS.gold, color: COLORS.brownDark }}
          >
            Next
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          {videoPreview && (
            <video
              src={videoPreview}
              className="max-h-full max-w-full rounded-2xl"
              controls
              autoPlay
              loop
              style={{ maxHeight: "70vh" }}
            />
          )}
        </div>
      </div>
    );
  }

  if (step === "caption") {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: COLORS.brown }}
      >
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => setStep("preview")}
            style={{ color: COLORS.text }}
          >
            Back
          </button>
          <span className="font-bold" style={{ color: COLORS.gold }}>
            Caption
          </span>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 rounded-full font-bold"
            style={{
              background: COLORS.gold,
              color: COLORS.brownDark,
              opacity: uploading ? 0.5 : 1,
            }}
          >
            {uploading ? "Posting..." : "Post"}
          </button>
        </div>
        <div className="flex-1 p-4">
          <div className="flex gap-4 mb-6">
            {videoPreview && (
              <video
                src={videoPreview}
                className="w-24 h-32 rounded-xl object-cover"
              />
            )}
            <div className="flex-1 relative">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe your video... #Quebec #Joual"
                className="w-full h-32 p-4 rounded-xl resize-none"
                style={{
                  background: COLORS.leather,
                  border: `1px solid ${COLORS.gold}40`,
                  color: COLORS.text,
                }}
              />
              <button
                onClick={async () => {
                  if (!caption.trim() || isJoualizing) return;
                  setIsJoualizing(true);
                  try {
                    const response = await fetch("/api/v3/joualize", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: caption, style: "street" }),
                    });
                    if (response.ok) {
                      const data = await response.json();
                      setCaption(data.rewrittenText);
                    }
                  } catch (err) {
                    console.error("Joualizer error:", err);
                  } finally {
                    setIsJoualizing(false);
                  }
                }}
                disabled={!caption.trim() || isJoualizing}
                className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg"
                style={{
                  background: isJoualizing
                    ? "rgba(201, 162, 39, 0.3)"
                    : `linear-gradient(135deg, ${COLORS.gold} 0%, #B8860B 100%)`,
                  color: COLORS.brownDark,
                  opacity: !caption.trim() || isJoualizing ? 0.6 : 1,
                }}
              >
                {isJoualizing ? (
                  <div className="w-4 h-4 border-2 border-brown-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  "⚜️ Joualize it!"
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "#Quebec",
              "#Montreal",
              "#Joual",
              "#FleurDeLys",
              "#Poutine",
              "#Maple",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => setCaption((prev) => prev + " " + tag)}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  background: COLORS.leather,
                  border: `1px solid ${COLORS.gold}40`,
                  color: COLORS.gold,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: COLORS.brown }}
      >
        <div className="text-center p-8">
          <img
            src="/zyeute-beaver.svg"
            alt="Zyeuté"
            className="w-20 h-20 mx-auto mb-4"
            style={{ filter: `drop-shadow(0 0 20px ${COLORS.gold}40)` }}
          />
          <h2
            className="text-2xl mb-4"
            style={{
              color: COLORS.gold,
              fontFamily: COLORS.fontDisplay,
              fontWeight: 700,
            }}
          >
            Uploading...
          </h2>
          <div
            className="w-64 h-3 rounded-full mx-auto mb-4"
            style={{
              background: COLORS.leather,
              border: `1px solid ${COLORS.gold}30`,
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldLight})`,
                width: `${uploadProgress}%`,
              }}
            />
          </div>
          <p style={{ color: COLORS.textMuted, fontFamily: COLORS.fontBody }}>
            {uploadProgress}% complete
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ===== OTHER PAGES =====
function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: COLORS.gold }}>
          Discover
        </h1>
        <input
          type="text"
          placeholder="Search videos, creators, hashtags..."
          className="w-full px-4 py-3 rounded-xl mb-6"
          style={{
            background: COLORS.leather,
            border: `1px solid ${COLORS.gold}40`,
            color: COLORS.text,
          }}
        />
        <div className="grid grid-cols-2 gap-4">
          {[
            "#Quebec",
            "#Montreal",
            "#Joual",
            "#FleurDeLys",
            "#Poutine",
            "#Maple",
          ].map((tag) => (
            <button
              key={tag}
              className="p-4 rounded-2xl text-center font-bold stitched relative"
              style={{ background: COLORS.leather, color: COLORS.gold }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function Notifications() {
  const notifications = [
    { id: 1, text: "@marie_qc liked your video", time: "2m ago" },
    { id: 2, text: "@ti_guy started following you", time: "1h ago" },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: COLORS.gold }}>
          Notifications
        </h1>
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-4 rounded-2xl stitched relative"
              style={{ background: COLORS.leather }}
            >
              <p style={{ color: COLORS.text }}>{n.text}</p>
              <span className="text-sm" style={{ color: COLORS.textMuted }}>
                {n.time}
              </span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("videos");

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      <div className="p-6 text-center">
        {/* Avatar with stitching */}
        <div
          className="w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold relative"
          style={{
            background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brown} 100%)`,
            border: `3px solid ${COLORS.gold}`,
            boxShadow: `0 0 30px ${COLORS.gold}20`,
          }}
        >
          <span style={{ fontFamily: COLORS.fontDisplay }}>
            {user?.username?.[0]?.toUpperCase() || "?"}
          </span>
          {/* Inner stitching ring */}
          <div
            className="absolute inset-2 rounded-full border-2 border-dashed"
            style={{ borderColor: `${COLORS.gold}40` }}
          />
        </div>

        <h1
          className="text-3xl mb-1"
          style={{
            color: COLORS.gold,
            fontFamily: COLORS.fontDisplay,
            fontWeight: 700,
          }}
        >
          @{user?.username || "Guest"}
        </h1>
        <p
          className="mb-8 flex items-center justify-center gap-1"
          style={{
            color: COLORS.textMuted,
            fontFamily: COLORS.fontDisplay,
            fontStyle: "italic",
          }}
        >
          Quebec Creator
          <img src="/zyeute-icon.svg" alt="⚜️" className="w-4 h-4 inline" />
        </p>

        {/* Stats */}
        <div className="flex justify-around mb-8 px-4">
          <div className="text-center">
            <p
              className="text-2xl font-bold"
              style={{ color: COLORS.gold, fontFamily: COLORS.fontBody }}
            >
              12
            </p>
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: COLORS.textMuted }}
            >
              Videos
            </p>
          </div>
          <div className="text-center">
            <p
              className="text-2xl font-bold"
              style={{ color: COLORS.gold, fontFamily: COLORS.fontBody }}
            >
              1.2K
            </p>
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: COLORS.textMuted }}
            >
              Followers
            </p>
          </div>
          <div className="text-center">
            <p
              className="text-2xl font-bold"
              style={{ color: COLORS.gold, fontFamily: COLORS.fontBody }}
            >
              89
            </p>
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: COLORS.textMuted }}
            >
              Following
            </p>
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => navigate("/settings")}
          className="w-full max-w-xs py-4 rounded-xl font-bold mb-4 flex items-center justify-center gap-2 transition-all duration-300"
          style={{
            background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brownLight} 100%)`,
            border: `2px dashed ${COLORS.gold}40`,
            color: COLORS.gold,
            fontFamily: COLORS.fontDisplay,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <i className="ph ph-gear text-lg"></i>
          <span>Settings</span>
        </button>

        <button
          onClick={logout}
          className="w-full max-w-xs py-3 rounded-xl font-bold border flex items-center justify-center gap-2 transition-all duration-300"
          style={{
            borderColor: "#ff444480",
            color: "#ff6b6b",
            background: "transparent",
            fontFamily: COLORS.fontBody,
          }}
        >
          <i className="ph ph-sign-out text-lg"></i>
          <span>Logout</span>
        </button>

        {/* Tabs */}
        <div
          className="flex border-b mt-8"
          style={{ borderColor: `${COLORS.gold}30` }}
        >
          <button
            onClick={() => setActiveTab("videos")}
            className="flex-1 py-3 font-bold transition-all duration-300"
            style={{
              color: activeTab === "videos" ? COLORS.gold : COLORS.textMuted,
              borderBottom:
                activeTab === "videos" ? `2px solid ${COLORS.gold}` : "none",
              fontFamily: COLORS.fontDisplay,
              letterSpacing: "0.05em",
            }}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab("liked")}
            className="flex-1 py-3 font-bold transition-all duration-300"
            style={{
              color: activeTab === "liked" ? COLORS.gold : COLORS.textMuted,
              borderBottom:
                activeTab === "liked" ? `2px solid ${COLORS.gold}` : "none",
              fontFamily: COLORS.fontDisplay,
              letterSpacing: "0.05em",
            }}
          >
            Liked
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    setTimeout(() => navigate("/feed"), 1000);
  }, [navigate]);
  return <LoadingScreen />;
}

// ===== LOGOUT =====
function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  return <LoadingScreen message="Logging out..." />;
}

// ===== MANUS & GRAVITYCLAW PLACEHOLDERS =====
function ManusPage() {
  return (
    <div
      className="min-h-screen flex flex-col pt-12"
      style={{ background: COLORS.brown }}
    >
      <div className="p-8 text-center">
        <div className="text-6xl mb-6">🦾</div>
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: COLORS.gold, fontFamily: COLORS.fontDisplay }}
        >
          Manus AI Agent
        </h1>
        <p
          className="text-xl opacity-80 max-w-lg mx-auto mb-8"
          style={{ color: COLORS.text }}
        >
          The autonomous general-purpose agent is being integrated.
        </p>
        <div
          className="p-6 rounded-2xl border-2 border-dashed mx-auto max-w-md"
          style={{
            borderColor: COLORS.gold + "40",
            background: COLORS.leather,
          }}
        >
          <p className="font-mono text-sm" style={{ color: COLORS.gold }}>
            $ gh repo clone FoundationAgents/OpenManus
            <br />
            Status: INSTALLED & READY ⚜️
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function GravityClawPage() {
  return (
    <div
      className="min-h-screen flex flex-col pt-12"
      style={{ background: COLORS.brown }}
    >
      <div className="p-8 text-center">
        <div className="text-6xl mb-6">🦞</div>
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: COLORS.gold, fontFamily: COLORS.fontDisplay }}
        >
          GravityClaw Compliance
        </h1>
        <p
          className="text-xl opacity-80 max-w-lg mx-auto mb-8"
          style={{ color: COLORS.text }}
        >
          Bill 96 Forensic Compliance & Remediation Swarm.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="p-4 rounded-xl border border-gold/20 bg-black/40">
            <h3 className="font-bold mb-2" style={{ color: COLORS.gold }}>
              Audit Engine
            </h3>
            <p className="text-sm opacity-70">
              Live scanning of business assets.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-gold/20 bg-black/40">
            <h3 className="font-bold mb-2" style={{ color: COLORS.gold }}>
              Remediation Swarm
            </h3>
            <p className="text-sm opacity-70">Automated patch generation.</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function NullClawPage() {
  return (
    <div
      className="min-h-screen flex flex-col pt-12"
      style={{ background: "#000" }}
    >
      <div className="p-8 text-center">
        <div className="text-6xl mb-6">⚙️</div>
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: COLORS.gold, fontFamily: COLORS.fontDisplay }}
        >
          NullClaw Infrastructure
        </h1>
        <p
          className="text-xl opacity-80 max-w-lg mx-auto mb-8"
          style={{ color: COLORS.text }}
        >
          100% Zig. Null overhead. The smallest autonomous AI infrastructure.
        </p>
        <div
          className="p-6 rounded-2xl border-2 border-dashed mx-auto max-w-md"
          style={{
            borderColor: COLORS.gold + "40",
            background: COLORS.leather,
          }}
        >
          <p className="font-mono text-sm" style={{ color: COLORS.gold }}>
            $ gh repo clone nullclaw/nullclaw
            <br />
            Status: 678 KB BINARY · READY ⚡
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

// ===== APP =====
function AppContent() {
  const { isLoading, user } = useAuth();
  const {
    isOpen,
    isExpanded,
    openChat,
    closeChat,
    minimizeChat,
    expandChat,
    userId,
  } = useTIGuy(user?.id as any);

  // Beautiful black opening with gold emblem while auth loads
  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  return (
    <Router>
      <Suspense
        fallback={<LoadingScreen message="Initialisation du module..." />}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/feed" element={<LaZyeute />} />
          <Route path="/explore" element={<LaZyeute />} />
          <Route path="/search" element={<Search />} />
          <Route path="/create" element={<Create />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/manus" element={<ManusPage />} />
          <Route path="/gravityclaw" element={<GravityClawPage />} />
          <Route path="/nullclaw" element={<NullClawPage />} />
          <Route
            path="/admin/video-doctor"
            element={<VideoDoctorDashboard />}
          />
          <Route path="/admin/tiktok-curation" element={<TikTokCuration />} />
          <Route path="/ai-studio" element={<AIStudio />} />
          <Route
            path="/"
            element={<Navigate to={user ? "/feed" : "/login"} replace />}
          />
        </Routes>
      </Suspense>
      {/* 🦫 TI-GUY Chat - Available on all pages when logged in */}
      {user && (
        <>
          {!isOpen && <TIGuyButton onClick={openChat} />}
          <TIGuyFullScreen
            isOpen={isOpen}
            onClose={closeChat}
            userId={user.id}
            username={user?.username}
          />
        </>
      )}{" "}
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
