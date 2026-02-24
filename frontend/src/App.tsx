/**
 * ZYEUTÉ - Quebec Leather Design
 * Rich brown leather, gold accents, premium luxury feel
 * Static styles - no dynamic rendering that causes blinking
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";

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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// ===== STATIC STYLES - NO DYNAMIC RENDERING =====
const leatherBackground = {
  background: "linear-gradient(135deg, #1a1510 0%, #251a15 50%, #1a1210 100%)",
  minHeight: "100vh",
};

const leatherTexture = {
  position: "absolute",
  inset: 0,
  opacity: 0.4,
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  pointerEvents: "none",
};

const goldGlow = {
  position: "absolute",
  top: "25%",
  left: "50%",
  transform: "translateX(-50%)",
  width: "600px",
  height: "600px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(255,191,0,0.15) 0%, rgba(255,191,0,0.05) 40%, transparent 70%)",
  pointerEvents: "none",
};

const loginCard = {
  background: `radial-gradient(ellipse at 30% 20%, rgba(80, 60, 45, 0.15) 0%, transparent 50%), 
               radial-gradient(ellipse at 70% 80%, rgba(60, 45, 35, 0.15) 0%, transparent 50%), 
               linear-gradient(145deg, #3a2a22 0%, #251a15 50%, #1a1210 100%)`,
  border: "1px solid rgba(139, 90, 43, 0.4)",
  boxShadow: `0 25px 50px rgba(0,0,0,0.6), 
              0 0 30px rgba(255,191,0,0.1), 
              inset 0 1px 0 rgba(255,255,255,0.08), 
              inset 0 -1px 0 rgba(0,0,0,0.5)`,
  borderRadius: "24px",
  padding: "32px",
};

const goldStitching = {
  position: "absolute",
  inset: "8px",
  border: "2px dashed rgba(218, 165, 32, 0.7)",
  borderRadius: "16px",
  boxShadow: "0 0 8px rgba(255, 215, 0, 0.4), inset 0 0 6px rgba(255, 215, 0, 0.2)",
  pointerEvents: "none",
};

const fleurDeLysGradient = "linear-gradient(180deg, #FFF8DC 0%, #FFE55C 15%, #FFD700 30%, #DAA520 60%, #B8860B 85%, #8B6914 100%)";

// ===== PAGES =====

function PageLoader() {
  return (
    <div style={leatherBackground} className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div style={leatherTexture} />
      <div className="text-center relative z-10">
        <div className="animate-spin text-4xl mb-4">🐝</div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (user) navigate("/feed");
  }, [user, navigate]);

  return (
    <div style={leatherBackground} className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Leather Texture */}
      <div style={leatherTexture} />
      
      {/* Gold Ambient Glow */}
      <div style={goldGlow} />

      <div className="w-full max-w-md relative z-10">
        {/* Fleur-de-lys Logo */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div
              className="absolute inset-0 blur-xl opacity-60"
              style={{
                background: "radial-gradient(circle, rgba(255,191,0,0.6) 0%, transparent 70%)",
                transform: "scale(1.5)",
              }}
            />

            <div
              className="relative w-28 h-28 mx-auto rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)",
                border: "3px solid transparent",
                backgroundClip: "padding-box",
                boxShadow: "0 0 40px rgba(255,191,0,0.3), 0 0 80px rgba(255,191,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  border: "2px solid rgba(255,191,0,0.6)",
                  boxShadow: "0 0 20px rgba(255,191,0,0.4), inset 0 0 20px rgba(255,191,0,0.1)",
                }}
              />

              <svg
                viewBox="0 0 100 100"
                className="w-16 h-16 relative z-10"
                style={{
                  filter: "drop-shadow(0 0 10px rgba(255,191,0,0.8)) drop-shadow(0 0 20px rgba(255,191,0,0.4))",
                }}
              >
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFC125" />
                    <stop offset="100%" stopColor="#DAA520" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 5 C50 5 45 15 45 22 C45 27 47 30 50 32 C53 30 55 27 55 22 C55 15 50 5 50 5 Z M50 32 L50 45 M35 35 C25 30 20 35 20 42 C20 48 25 52 32 50 C38 48 42 44 45 40 M65 35 C75 30 80 35 80 42 C80 48 75 52 68 50 C62 48 58 44 55 40 M50 45 L50 75 M50 55 L35 70 C30 75 25 78 25 85 C25 90 30 92 35 90 M50 55 L65 70 C70 75 75 78 75 85 C75 90 70 92 65 90 M40 75 L60 75 L55 85 L45 85 Z"
                  fill="none"
                  stroke="url(#goldGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <h1
            className="text-5xl font-black mt-6 tracking-wide"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              background: fleurDeLysGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 10px rgba(255,215,0,0.6)) drop-shadow(0 3px 6px rgba(0,0,0,0.9))",
              lineHeight: "1.2",
              paddingTop: "0.25rem",
              letterSpacing: "0.03em",
            }}
          >
            ZYEUTÉ
          </h1>
          <p className="text-sm font-bold tracking-[0.3em] mt-2 uppercase" style={{ color: "#FFBF00" }}>
            The Quebec Swarm ⚜️
          </p>
        </div>

        {/* Login Card */}
        <div style={loginCard} className="relative">
          {/* Gold Stitching */}
          <div style={goldStitching} />

          <h2 className="text-2xl font-bold mb-6 relative z-10" style={{ color: "#E8DCC4" }}>
            Welcome Back
          </h2>

          <div className="space-y-4 relative z-10">
            <button
              onClick={signInWithGoogle}
              className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #FFC125 50%, #DAA520 100%)",
                color: "#1a1a1a",
                boxShadow: "0 4px 20px rgba(255,191,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,191,0,0.3), transparent)" }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm" style={{ background: "#1a1210", color: "#8B7355" }}>
                  or
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/feed")}
              className="w-full py-4 rounded-xl font-semibold transition-all border-2"
              style={{ 
                color: "#FFBF00", 
                borderColor: "rgba(255,191,0,0.3)",
                background: "transparent",
              }}
            >
              Continue as Guest
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: "#5C4D3C" }}>
          Made in Quebec 🦫⚜️
        </p>
      </div>
    </div>
  );
}

function Feed() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/explore?page=0&limit=10&hive=quebec")
      .then(r => r.json())
      .then(data => {
        const postsArray = Array.isArray(data) ? data : data?.posts || [];
        setPosts(postsArray);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div style={leatherBackground} className="min-h-screen text-white relative">
      <div style={leatherTexture} />
      
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur border-b border-yellow-500/20 p-4 flex justify-between items-center relative z-10">
        <h1 className="text-xl font-bold" style={{ 
          background: fleurDeLysGradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          🐝 Zyeuté
        </h1>
        <div className="flex gap-4 items-center">
          {user && <span className="text-yellow-500/80">{user.username}</span>}
          <button 
            onClick={logout} 
            className="text-sm px-4 py-2 rounded-lg border border-yellow-500/30 text-yellow-500/80 hover:bg-yellow-500/10 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="divide-y divide-yellow-500/10 relative z-10 pb-20">
        {posts.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "#8B7355" }}>
            <p className="text-lg">Nothing to see yet!</p>
            <p className="text-sm mt-2">Check back later 🦫</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="p-4">
              {/* Post Card with Leather Style */}
              <div 
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, rgba(58,42,34,0.6) 0%, rgba(37,26,21,0.8) 100%)",
                  border: "1px solid rgba(139, 90, 43, 0.3)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {/* User Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{
                      background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)",
                      border: "2px solid rgba(255,191,0,0.4)",
                      color: "#FFBF00",
                      boxShadow: "0 0 10px rgba(255,191,0,0.2)",
                    }}
                  >
                    {post.user?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="font-semibold text-yellow-100">{post.user?.username || "Anonymous"}</span>
                </div>

                {/* Media */}
                {post.media_url && (
                  <video
                    src={post.media_url}
                    className="w-full rounded-xl bg-black/50"
                    controls
                    preload="metadata"
                    style={{ border: "1px solid rgba(255,191,0,0.1)" }}
                  />
                )}

                {/* Caption */}
                <p className="mt-3 text-yellow-100/90">{post.caption}</p>

                {/* Actions */}
                <div className="flex gap-6 mt-4 text-sm">
                  <button className="flex items-center gap-1 transition-colors hover:text-yellow-400" style={{ color: "#FFBF00" }}>
                    <span>🔥</span>
                    <span>{post.fire_count || 0}</span>
                  </button>
                  <button className="flex items-center gap-1 transition-colors hover:text-yellow-400" style={{ color: "#B8A88A" }}>
                    <span>💬</span>
                    <span>{post.comment_count || 0}</span>
                  </button>
                  <button className="flex items-center gap-1 transition-colors hover:text-yellow-400" style={{ color: "#B8A88A" }}>
                    <span>↗️</span>
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => navigate("/feed"), 1000);
  }, [navigate]);

  return <PageLoader />;
}

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/" element={<Navigate to="/feed" />} />
        <Route path="*" element={<Navigate to="/feed" />} />
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
