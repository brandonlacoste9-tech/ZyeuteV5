/**
 * ZYEUTÉ - Quebec's TikTok
 * Full Login & Settings Feature Added
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext, useRef, useCallback } from "react";

// ===== AUTH CONTEXT =====
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email,
            username: data.session.user.user_metadata?.username || data.session.user.email?.split('@')[0],
            avatar: data.session.user.user_metadata?.avatar_url,
          });
        }
      } catch (e) {
        console.error("Auth error:", e);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signInWithGoogle = async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signInWithEmail = async (email, password) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
        avatar: data.user.user_metadata?.avatar_url,
      });
    }
  };

  const signUpWithEmail = async (email, password, username) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error:", e);
    }
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

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
function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: COLORS.brown }}>
      <div className="text-center">
        <div className="text-6xl mb-4">⚜️</div>
        <p style={{ color: COLORS.textMuted }}>Loading...</p>
      </div>
    </div>
  );
}

// ===== LOGIN PAGE =====
function Login() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate("/feed");
  }, [user, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email, password);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email, password, username);
      setMode('login');
      setError('Account created! Please sign in.');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    navigate('/feed');
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />
      <div 
        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,191,0,0.15) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo - Louis Vuitton meets Fleur-de-lis */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4" style={{ filter: 'drop-shadow(0 4px 8px rgba(201, 162, 39, 0.3))' }}>⚜️</div>
          <h1 
            className="mb-3"
            style={{ 
              fontFamily: COLORS.fontDisplay,
              fontSize: '3.5rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              background: "linear-gradient(180deg, #E8D5A3 0%, #C9A227 50%, #8B6914 100%)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent",
              textShadow: '0 2px 10px rgba(201, 162, 39, 0.2)',
            }}
          >
            Zyeuté
          </h1>
          <p style={{ 
            fontFamily: COLORS.fontDisplay,
            fontSize: '1.125rem',
            fontStyle: 'italic',
            color: COLORS.textMuted,
            letterSpacing: '0.05em'
          }}>L'app sociale du Québec ⚜️</p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-4 p-4 rounded-xl text-center text-sm"
            style={{ 
              background: error.includes('created') ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 68, 68, 0.2)',
              border: `1px solid ${error.includes('created') ? '#4ade80' : '#ff4444'}`,
              color: error.includes('created') ? '#4ade80' : '#ff4444'
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
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
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03)',
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
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03)',
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
                  ? 'linear-gradient(145deg, #6B4E14 0%, #4A3410 100%)'
                  : 'linear-gradient(180deg, #D4AF37 0%, #C9A227 50%, #A68317 100%)',
                color: '#1A0F0A',
                fontFamily: COLORS.fontDisplay,
                fontSize: '1.125rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                border: '2px solid #6B4E14',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                opacity: loading ? 0.8 : 1,
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </span>
            </button>

            <div className="flex justify-between text-sm pt-2" style={{ color: COLORS.textMuted }}>
              <button 
                type="button" 
                onClick={() => setMode('forgot')}
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
                onClick={() => setMode('signup')}
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
        {mode === 'signup' && (
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
                  color: COLORS.text 
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
                  color: COLORS.text 
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
                  color: COLORS.text 
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
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div className="text-center text-sm">
              <button 
                type="button" 
                onClick={() => setMode('login')}
                className="hover:underline"
                style={{ color: COLORS.gold }}
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password */}
        {mode === 'forgot' && (
          <form className="space-y-4">
            <p className="text-center text-sm" style={{ color: COLORS.textMuted }}>
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
                  color: COLORS.text 
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
                onClick={() => setMode('login')}
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
                letterSpacing: '0.2em',
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Guest Button */}
          <button 
            onClick={handleGuest} 
            className="w-full py-5 rounded-xl transition-all duration-300"
            style={{ 
              background: 'transparent',
              border: `2px dashed ${COLORS.gold}50`,
              color: COLORS.gold,
              fontFamily: COLORS.fontDisplay,
              fontSize: '1rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
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
            letterSpacing: '0.02em',
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
    { path: "/feed", icon: "ph-house", iconFill: "ph-fill ph-house", label: "Home" },
    { path: "/search", icon: "ph-magnifying-glass", iconFill: "ph-fill ph-magnifying-glass", label: "Search" },
    { path: "/create", icon: "ph-plus", iconFill: "ph-fill ph-plus", label: "Create", isCenter: true },
    { path: "/notifications", icon: "ph-bell", iconFill: "ph-fill ph-bell", label: "Notifications" },
    { path: "/profile", icon: "ph-user", iconFill: "ph-fill ph-user", label: "Profile" },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-6 z-50 edge-light edge-bottom stitched stitched-double"
      style={{ 
        background: `linear-gradient(180deg, ${COLORS.leather} 0%, ${COLORS.brownLight} 50%, ${COLORS.brown} 100%)`,
        height: "90px",
        paddingBottom: "24px",
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
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${COLORS.goldLight} 0%, ${COLORS.gold} 50%, ${COLORS.goldDark} 100%)`,
                border: `2px solid ${COLORS.goldDark}`,
                boxShadow: `0 4px 15px rgba(201, 162, 39, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)`,
              }}
            >
              <i className={`${item.iconFill} text-2xl`} style={{ color: COLORS.brownDark }}></i>
            </div>
          ) : (
            <>
              <i className={`${currentPath === item.path ? item.iconFill : item.icon} text-2xl mb-1 transition-all duration-300`} style={{ 
                color: currentPath === item.path ? COLORS.gold : COLORS.textMuted,
                filter: currentPath === item.path ? 'drop-shadow(0 0 6px rgba(201, 162, 39, 0.6))' : 'none',
              }}></i>
              <span className="text-xs transition-all duration-300" style={{ 
                fontFamily: COLORS.fontBody,
                letterSpacing: '0.02em',
                fontWeight: currentPath === item.path ? 600 : 400,
                color: currentPath === item.path ? COLORS.gold : COLORS.textMuted,
              }}>{item.label}</span>
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
    const savedColor = localStorage.getItem('edgeColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--edge-color', savedColor);
      const r = parseInt(savedColor.slice(1, 3), 16);
      const g = parseInt(savedColor.slice(3, 5), 16);
      const b = parseInt(savedColor.slice(5, 7), 16);
      document.documentElement.style.setProperty('--edge-glow', `rgba(${r}, ${g}, ${b}, 0.6)`);
    }
  }, []);
  
  const [settings, setSettings] = useState({
    username: user?.username || "",
    email: user?.email || "",
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

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
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
                style={{ background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brown} 100%)`, border: `3px solid ${COLORS.gold}`, boxShadow: `0 0 30px ${COLORS.gold}30` }}
              >
                {user?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <button className="text-sm" style={{ color: COLORS.gold }}>Change Photo</button>
            </div>

            <div className="p-4 rounded-2xl stitched relative" style={{ background: COLORS.leather }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: COLORS.textMuted }}>Username</label>
                  <input 
                    type="text" 
                    value={settings.username}
                    onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ background: COLORS.brown, border: `1px solid ${COLORS.gold}40`, color: COLORS.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: COLORS.textMuted }}>Email</label>
                  <input 
                    type="email" 
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ background: COLORS.brown, border: `1px solid ${COLORS.gold}40`, color: COLORS.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: COLORS.textMuted }}>Phone Number</label>
                  <input 
                    type="tel" 
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Add phone number"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ background: COLORS.brown, border: `1px solid ${COLORS.gold}40`, color: COLORS.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: COLORS.textMuted }}>Bio</label>
                  <textarea 
                    value={settings.bio}
                    onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl resize-none"
                    rows={3}
                    style={{ background: COLORS.brown, border: `1px solid ${COLORS.gold}40`, color: COLORS.text }}
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
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.gold }}>Privacy Settings</h2>
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
            <div className="pt-6 border-t" style={{ borderColor: `${COLORS.gold}30` }}>
              <button className="w-full py-3 rounded-xl font-bold border mb-3" style={{ borderColor: "#ff4444", color: "#ff4444" }}>
                Blocked Users
              </button>
              <button className="w-full py-3 rounded-xl font-bold border" style={{ borderColor: "#ff4444", color: "#ff4444" }}>
                Restricted Accounts
              </button>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.gold }}>Notification Settings</h2>
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
            <div className="pt-4 border-t" style={{ borderColor: `${COLORS.gold}30` }}>
              <h3 className="font-bold mb-4" style={{ color: COLORS.textMuted }}>Activity Notifications</h3>
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
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.gold }}>Appearance</h2>
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
            <div className="pt-4 border-t" style={{ borderColor: `${COLORS.gold}30` }}>
              <h3 className="font-bold mb-4" style={{ color: COLORS.textMuted }}>Edge Lighting Color</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { color: '#C9A227', name: 'Gold' },
                  { color: '#0066CC', name: 'Blue' },
                  { color: '#00AA44', name: 'Green' },
                  { color: '#CC0000', name: 'Red' },
                  { color: '#8833CC', name: 'Purple' },
                  { color: '#CC3377', name: 'Pink' },
                  { color: '#FF6600', name: 'Orange' },
                  { color: '#00AAAA', name: 'Teal' },
                ].map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => {
                      document.documentElement.style.setProperty('--edge-color', color);
                      const r = parseInt(color.slice(1, 3), 16);
                      const g = parseInt(color.slice(3, 5), 16);
                      const b = parseInt(color.slice(5, 7), 16);
                      document.documentElement.style.setProperty('--edge-glow', `rgba(${r}, ${g}, ${b}, 0.6)`);
                      localStorage.setItem('edgeColor', color);
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
                        boxShadow: `0 0 10px ${color}60`
                      }}
                    />
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "language":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.gold }}>Language</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: COLORS.leather }}>
                <label className="block text-sm mb-2" style={{ color: COLORS.textMuted }}>App Language</label>
                <select 
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl"
                  style={{ background: COLORS.brown, border: `1px solid ${COLORS.gold}40`, color: COLORS.text }}
                >
                  <option>English</option>
                  <option>Français (French)</option>
                </select>
              </div>
              <div className="p-4 rounded-xl" style={{ background: COLORS.leather }}>
                <label className="block text-sm mb-2" style={{ color: COLORS.textMuted }}>Content Language</label>
                <select 
                  value={settings.contentLanguage}
                  onChange={(e) => setSettings(prev => ({ ...prev, contentLanguage: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl"
                  style={{ background: COLORS.brown, border: `1px solid ${COLORS.gold}40`, color: COLORS.text }}
                >
                  <option>All Languages</option>
                  <option>English</option>
                  <option>Français</option>
                  <option>Español</option>
                </select>
              </div>
            </div>
            <div className="p-4 rounded-xl mt-6" style={{ background: `${COLORS.gold}20`, border: `1px solid ${COLORS.gold}40` }}>
              <p className="text-sm" style={{ color: COLORS.text }}>
                🇨🇦 <strong>Quebec Pride!</strong> Zyeute celebrates French-Canadian culture and the Joual language.
              </p>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.gold }}>Help & Support</h2>
            <HelpItem icon="ph-book-open" title="Help Center" description="Find answers to common questions" />
            <HelpItem icon="ph-chat-circle" title="Contact Us" description="Get in touch with our support team" />
            <HelpItem icon="ph-bug" title="Report a Problem" description="Let us know if something's not working" />
            <HelpItem icon="ph-lightbulb" title="Feature Request" description="Suggest new features for Zyeute" />
            <HelpItem icon="ph-scroll" title="Community Guidelines" description="Rules for keeping Zyeute safe" />
            <HelpItem icon="ph-scales" title="Terms of Service" description="Legal terms and conditions" />
            <HelpItem icon="ph-shield" title="Privacy Policy" description="How we handle your data" />
          </div>
        );

      case "about":
        return (
          <div className="text-center py-8">
            <img src="/zyeute-beaver.svg" alt="Zyeuté" className="w-24 h-24 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.gold, fontFamily: COLORS.fontDisplay }}>Zyeuté</h2>
            <p className="mb-6" style={{ color: COLORS.textMuted, fontFamily: COLORS.fontDisplay, fontStyle: 'italic' }}>L'app sociale du Québec</p>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.gold}20` }}>
                <span style={{ color: COLORS.textMuted }}>Version</span>
                <span style={{ color: COLORS.text }}>1.0.0</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.gold}20` }}>
                <span style={{ color: COLORS.textMuted }}>Build</span>
                <span style={{ color: COLORS.text }}>2024.02.24</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.gold}20` }}>
                <span style={{ color: COLORS.textMuted }}>Platform</span>
                <span style={{ color: COLORS.text }}>Web</span>
              </div>
            </div>
            <p className="mt-8 text-sm flex items-center justify-center gap-2" style={{ color: COLORS.textMuted }}>
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
      <div className="sticky top-0 z-40 p-4 flex items-center gap-4" style={{ background: COLORS.brownDark }}>
        <button 
          onClick={() => navigate("/profile")}
          className="text-2xl"
          style={{ color: COLORS.text }}
        >
          ←
        </button>
        <h1 className="text-xl font-bold" style={{ color: COLORS.gold }}>Settings</h1>
      </div>

      <div className="flex">
        <div className="hidden md:block w-64 p-4 border-r" style={{ borderColor: `${COLORS.gold}20`, minHeight: "calc(100vh - 140px)" }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-colors"
              style={{ 
                background: activeSection === item.id ? `${COLORS.gold}15` : "transparent",
                color: activeSection === item.id ? COLORS.gold : COLORS.text,
                border: activeSection === item.id ? `2px dashed ${COLORS.gold}40` : "2px dashed transparent",
              }}
            >
              <i className={`ph ${item.icon} text-lg`}></i>
              <span className="font-medium" style={{ fontFamily: COLORS.fontBody }}>{item.label}</span>
            </button>
          ))}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: `${COLORS.gold}20` }}>
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
            style={{ background: COLORS.leather, border: `1px solid ${COLORS.gold}40`, color: COLORS.text }}
          >
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>{item.icon} {item.label}</option>
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
function ToggleItem({ icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-5 rounded-xl" style={{ background: COLORS.leather, border: `2px dashed ${COLORS.gold}20` }}>
      <div className="flex items-center gap-4">
        <i className={`ph ${icon} text-2xl`} style={{ color: COLORS.gold }}></i>
        <div>
          <p className="font-medium" style={{ color: COLORS.text, fontFamily: COLORS.fontBody }}>{title}</p>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>{description}</p>
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
function HelpItem({ icon, title, description }) {
  return (
    <button className="w-full flex items-center gap-4 p-5 rounded-xl text-left transition-colors" style={{ background: COLORS.leather, border: `2px dashed ${COLORS.gold}20` }}>
      <i className={`ph ${icon} text-2xl`} style={{ color: COLORS.gold }}></i>
      <div className="flex-1">
        <p className="font-medium" style={{ color: COLORS.text, fontFamily: COLORS.fontBody }}>{title}</p>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>{description}</p>
      </div>
      <span style={{ color: COLORS.textMuted }}>→</span>
    </button>
  );
}

// ... rest of the app components (VideoFeed, Search, Create, etc.) ...
// [Previous components remain the same]

// ===== VIDEO FEED =====
function VideoFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showHeart, setShowHeart] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch("/api/explore?page=0&limit=20&hive=quebec")
      .then(r => r.json())
      .then(data => {
        const postsArray = Array.isArray(data) ? data : data?.posts || [];
        setPosts(postsArray);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / windowHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, posts.length]);

  const handleDoubleTap = (postId) => {
    setShowHeart(postId);
    setTimeout(() => setShowHeart(null), 800);
    
    if (!likedPosts.has(postId)) {
      setLikedPosts(prev => new Set(prev).add(postId));
      fetch(`/api/posts/${postId}/fire`, { method: "POST" }).catch(() => {});
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollBehavior: "smooth" }}
      onScroll={handleScroll}
    >
      {posts.map((post, index) => (
        <VideoCard
          key={post.id}
          post={post}
          isActive={index === currentIndex}
          onDoubleTap={() => handleDoubleTap(post.id)}
          onShowComments={() => setShowComments(post.id)}
          onShowProfile={() => setShowProfile(post.user)}
          isLiked={likedPosts.has(post.id)}
          showHeart={showHeart === post.id}
        />
      ))}

      {showComments && (
        <CommentsModal postId={showComments} onClose={() => setShowComments(false)} />
      )}

      {showProfile && (
        <ProfileModal user={showProfile} onClose={() => setShowProfile(null)} />
      )}

      <style>{`
        @keyframes heartPop {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function VideoCard({ post, isActive, onDoubleTap, onShowComments, onShowProfile, isLiked, showHeart }) {
  const videoRef = useRef(null);
  const [lastTap, setLastTap] = useState(0);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      onDoubleTap();
    }
    setLastTap(now);
  };

  return (
    <div className="h-screen w-full relative snap-start snap-always" onClick={handleTap}>
      <video
        ref={videoRef}
        src={post.media_url || post.video_url}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={false}
        poster={post.thumbnail_url}
      />

      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7) 100%)" }}
      />

      {showHeart && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ animation: "heartPop 0.8s ease-out forwards" }}
        >
          <i className="ph-fill ph-fire text-8xl" style={{ color: COLORS.gold, filter: `drop-shadow(0 0 20px ${COLORS.gold})` }}></i>
        </div>
      )}

      <div className="absolute right-4 bottom-32 flex flex-col gap-5 items-center">
        {/* Music - Outline style */}
        <button className="flex flex-col items-center">
          <i className="ph ph-music-note text-3xl" style={{ color: COLORS.gold, filter: `drop-shadow(0 0 4px ${COLORS.gold}60)` }}></i>
        </button>

        {/* User Avatar - No text label */}
        <button onClick={(e) => { e.stopPropagation(); onShowProfile(); }} className="flex flex-col items-center">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold stitched relative"
            style={{ background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brown} 100%)`, border: `2px solid ${COLORS.gold}` }}
          >
            {post.user?.username?.[0]?.toUpperCase() || "?"}
          </div>
        </button>

        {/* Fire/Like - Filled gold when active */}
        <button onClick={(e) => { e.stopPropagation(); onDoubleTap(); }} className="flex flex-col items-center gap-1">
          <i className={`${isLiked ? 'ph-fill' : 'ph'} ph-fire text-4xl transition-all duration-300`} style={{ 
            color: isLiked ? COLORS.gold : COLORS.text,
            filter: isLiked ? `drop-shadow(0 0 8px ${COLORS.gold})` : "none"
          }}></i>
          <span className="text-xs font-medium" style={{ color: isLiked ? COLORS.gold : COLORS.text }}>{(post.fire_count || 0) + (isLiked ? 1 : 0)}</span>
        </button>

        {/* Comments - Filled */}
        <button onClick={(e) => { e.stopPropagation(); onShowComments(); }} className="flex flex-col items-center gap-1">
          <i className="ph-fill ph-chat-circle text-4xl" style={{ color: COLORS.gold, filter: `drop-shadow(0 0 6px ${COLORS.gold}60)` }}></i>
          <span className="text-xs font-medium" style={{ color: COLORS.text }}>{post.comment_count || 0}</span>
        </button>

        {/* Share - Filled */}
        <button className="flex flex-col items-center gap-1">
          <i className="ph-fill ph-share-fat text-4xl" style={{ color: COLORS.gold, filter: `drop-shadow(0 0 6px ${COLORS.gold}60)` }}></i>
          <span className="text-xs font-medium" style={{ color: COLORS.text }}>Share</span>
        </button>
      </div>

      <div className="absolute left-4 bottom-32 right-24">
        <p className="text-lg mb-2" style={{ color: COLORS.text }}>{post.caption}</p>
        <p className="text-sm flex items-center gap-1" style={{ color: COLORS.textMuted }}>
          <i className="ph-fill ph-music-note" style={{ color: COLORS.gold }}></i>
          Original Sound - {post.user?.username}
        </p>
      </div>
    </div>
  );
}

// ===== COMMENTS MODAL =====
function CommentsModal({ postId, onClose }) {
  const [comments, setComments] = useState([
    { id: 1, user: "marie_qc", text: "C'est ben beau!", avatar: "M" },
    { id: 2, user: "ti_guy_514", text: "Tabarnac c'est nice", avatar: "T" },
    { id: 3, user: "sarah_mtl", text: "Love this!", avatar: "S" },
  ]);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments(prev => [...prev, { id: Date.now(), user: "You", text: newComment, avatar: "Y" }]);
    setNewComment("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div 
        className="w-full rounded-t-3xl p-4"
        style={{ background: `linear-gradient(145deg, ${COLORS.brown} 0%, ${COLORS.brownDark} 100%)`, borderTop: `2px solid ${COLORS.gold}40`, maxHeight: "70vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: COLORS.gold }} />
        <h3 className="text-xl font-bold mb-4 text-center" style={{ color: COLORS.gold, fontFamily: COLORS.fontDisplay }}>Comments</h3>
        
        <div className="overflow-y-auto mb-4" style={{ maxHeight: "40vh" }}>
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ background: COLORS.leather, border: `1px solid ${COLORS.gold}` }}>
                {comment.avatar}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: COLORS.gold }}>@{comment.user}</p>
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
            style={{ background: COLORS.leather, border: `1px solid ${COLORS.gold}40`, color: COLORS.text }}
          />
          <button type="submit" className="px-6 py-3 rounded-full font-bold" style={{ background: COLORS.gold, color: COLORS.brownDark }}>Post</button>
        </form>
      </div>
    </div>
  );
}

// ===== PROFILE MODAL =====
function ProfileModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }} onClick={onClose}>
      <div 
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: `linear-gradient(145deg, ${COLORS.brown} 0%, ${COLORS.brownDark} 100%)`, border: `2px solid ${COLORS.gold}40` }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
          style={{ background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brown} 100%)`, border: `3px solid ${COLORS.gold}`, boxShadow: `0 0 30px ${COLORS.gold}30` }}
        >
          {user?.username?.[0]?.toUpperCase() || "?"}
        </div>

        <h2 className="text-2xl font-bold mb-1" style={{ color: COLORS.gold }}>@{user?.username}</h2>
        <p className="mb-6 flex items-center justify-center gap-1" style={{ color: COLORS.textMuted }}>
          Quebec Creator
          <img src="/zyeute-icon.svg" alt="⚜️" className="w-4 h-4 inline" />
        </p>

        <div className="flex justify-around mb-6">
          <div className="text-center"><p className="text-2xl font-bold" style={{ color: COLORS.gold }}>1.2K</p><p className="text-sm" style={{ color: COLORS.textMuted }}>Followers</p></div>
          <div className="text-center"><p className="text-2xl font-bold" style={{ color: COLORS.gold }}>89</p><p className="text-sm" style={{ color: COLORS.textMuted }}>Following</p></div>
          <div className="text-center"><p className="text-2xl font-bold" style={{ color: COLORS.gold }}>456</p><p className="text-sm" style={{ color: COLORS.textMuted }}>Likes</p></div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-xl font-bold" style={{ background: COLORS.gold, color: COLORS.brownDark }}>Follow</button>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold border" style={{ borderColor: COLORS.gold, color: COLORS.gold }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ===== UPLOAD / CREATE PAGE =====
function Create() {
  const navigate = useNavigate();
  const [step, setStep] = useState("select");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
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
    if (!videoFile) return;
    setUploading(true);
    setStep("uploading");

    try {
      const formData = new FormData();
      formData.append("video", videoFile);
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
        if (xhr.status === 200) {
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
            Create
          </h1>
          <p 
            className="mb-8 flex items-center justify-center gap-1"
            style={{ 
              color: COLORS.textMuted,
              fontFamily: COLORS.fontDisplay,
              fontStyle: 'italic',
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
              <i className="ph ph-video-camera text-5xl" style={{ color: COLORS.gold }}></i>
              <span 
                className="font-bold"
                style={{ 
                  color: COLORS.gold,
                  fontFamily: COLORS.fontDisplay,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
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
              <i className="ph ph-image text-5xl" style={{ color: COLORS.gold }}></i>
              <span 
                className="font-bold"
                style={{ 
                  color: COLORS.gold,
                  fontFamily: COLORS.fontDisplay,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Upload from Gallery
              </span>
            </button>

            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: COLORS.brown }}>
        <div className="flex justify-between items-center p-4">
          <button onClick={() => setStep("select")} style={{ color: COLORS.text }}>Cancel</button>
          <span className="font-bold" style={{ color: COLORS.gold }}>Preview</span>
          <button onClick={() => setStep("caption")} className="px-4 py-2 rounded-full font-bold" style={{ background: COLORS.gold, color: COLORS.brownDark }}>Next</button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          {videoPreview && <video src={videoPreview} className="max-h-full max-w-full rounded-2xl" controls autoPlay loop style={{ maxHeight: "70vh" }} />}
        </div>
      </div>
    );
  }

  if (step === "caption") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: COLORS.brown }}>
        <div className="flex justify-between items-center p-4">
          <button onClick={() => setStep("preview")} style={{ color: COLORS.text }}>Back</button>
          <span className="font-bold" style={{ color: COLORS.gold }}>Caption</span>
          <button onClick={handleUpload} disabled={uploading} className="px-4 py-2 rounded-full font-bold" style={{ background: COLORS.gold, color: COLORS.brownDark, opacity: loading ? 0.5 : 1 }}>{uploading ? "Posting..." : "Post"}</button>
        </div>
        <div className="flex-1 p-4">
          <div className="flex gap-4 mb-6">
            {videoPreview && <video src={videoPreview} className="w-24 h-32 rounded-xl object-cover" />}
            <div className="flex-1">
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Describe your video... #Quebec #Joual" className="w-full h-32 p-4 rounded-xl resize-none" style={{ background: COLORS.leather, border: `1px solid ${COLORS.gold}40`, color: COLORS.text }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["#Quebec", "#Montreal", "#Joual", "#FleurDeLys", "#Poutine", "#Maple"].map(tag => (
              <button key={tag} onClick={() => setCaption(prev => prev + " " + tag)} className="px-3 py-1 rounded-full text-sm" style={{ background: COLORS.leather, border: `1px solid ${COLORS.gold}40`, color: COLORS.gold }}>{tag}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.brown }}>
        <div className="text-center p-8">
          <img src="/zyeute-beaver.svg" alt="Zyeuté" className="w-20 h-20 mx-auto mb-4" style={{ filter: `drop-shadow(0 0 20px ${COLORS.gold}40)` }} />
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
          <div className="w-64 h-3 rounded-full mx-auto mb-4" style={{ background: COLORS.leather, border: `1px solid ${COLORS.gold}30` }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldLight})`, width: `${uploadProgress}%` }} />
          </div>
          <p style={{ color: COLORS.textMuted, fontFamily: COLORS.fontBody }}>{uploadProgress}% complete</p>
        </div>
      </div>
    );
  }

  return null;
}

// ===== OTHER PAGES =====
function Feed() {
  return (
    <div className="relative h-screen" style={{ background: COLORS.brown }}>
      <VideoFeed />
      <BottomNav />
    </div>
  );
}

function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  
  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: COLORS.gold }}>Discover</h1>
        <input
          type="text"
          placeholder="Search videos, creators, hashtags..."
          className="w-full px-4 py-3 rounded-xl mb-6"
          style={{ background: COLORS.leather, border: `1px solid ${COLORS.gold}40`, color: COLORS.text }}
        />
        <div className="grid grid-cols-2 gap-4">
          {["#Quebec", "#Montreal", "#Joual", "#FleurDeLys", "#Poutine", "#Maple"].map(tag => (
            <button key={tag} className="p-4 rounded-2xl text-center font-bold stitched relative" style={{ background: COLORS.leather, color: COLORS.gold }}>{tag}</button>
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
        <h1 className="text-2xl font-bold mb-4" style={{ color: COLORS.gold }}>Notifications</h1>
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className="p-4 rounded-2xl stitched relative" style={{ background: COLORS.leather }}>
              <p style={{ color: COLORS.text }}>{n.text}</p>
              <span className="text-sm" style={{ color: COLORS.textMuted }}>{n.time}</span>
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
          <span style={{ fontFamily: COLORS.fontDisplay }}>{user?.username?.[0]?.toUpperCase() || "?"}</span>
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
            fontStyle: 'italic',
          }}
        >
          Quebec Creator
          <img src="/zyeute-icon.svg" alt="⚜️" className="w-4 h-4 inline" />
        </p>

        {/* Stats */}
        <div className="flex justify-around mb-8 px-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold, fontFamily: COLORS.fontBody }}>12</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Videos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold, fontFamily: COLORS.fontBody }}>1.2K</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold, fontFamily: COLORS.fontBody }}>89</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Following</p>
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
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
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
            background: 'transparent',
            fontFamily: COLORS.fontBody,
          }}
        >
          <i className="ph ph-sign-out text-lg"></i>
          <span>Logout</span>
        </button>

        {/* Tabs */}
        <div className="flex border-b mt-8" style={{ borderColor: `${COLORS.gold}30` }}>
          <button 
            onClick={() => setActiveTab("videos")} 
            className="flex-1 py-3 font-bold transition-all duration-300"
            style={{ 
              color: activeTab === "videos" ? COLORS.gold : COLORS.textMuted, 
              borderBottom: activeTab === "videos" ? `2px solid ${COLORS.gold}` : "none",
              fontFamily: COLORS.fontDisplay,
              letterSpacing: '0.05em',
            }}
          >
            Videos
          </button>
          <button 
            onClick={() => setActiveTab("liked")} 
            className="flex-1 py-3 font-bold transition-all duration-300"
            style={{ 
              color: activeTab === "liked" ? COLORS.gold : COLORS.textMuted, 
              borderBottom: activeTab === "liked" ? `2px solid ${COLORS.gold}` : "none",
              fontFamily: COLORS.fontDisplay,
              letterSpacing: '0.05em',
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
  useEffect(() => { setTimeout(() => navigate("/feed"), 1000); }, [navigate]);
  return <LoadingScreen />;
}

// ===== APP =====
function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/search" element={<Search />} />
        <Route path="/create" element={<Create />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/feed" />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
