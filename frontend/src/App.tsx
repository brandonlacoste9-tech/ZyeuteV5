/**
 * ZYEUTÉ - Simple French-Only Version
 * No i18n, no locale switching, no blinking
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useState, useEffect } from "react";
import { createContext, useContext } from "react";

// ===== SIMPLE AUTH CONTEXT =====
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session once
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

// ===== SIMPLE PAGES =====

// Loading Screen
function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">🐝</div>
        <p className="text-gray-400">Ça charge...</p>
      </div>
    </div>
  );
}

// Login Page - French Only
function Login() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (user) navigate("/feed");
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-yellow-500 mb-2">🐝 ZYEUTÉ</h1>
      <p className="text-gray-400 mb-8">Le Swarm Québécois ⚜️</p>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={signInWithGoogle}
          className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </button>

        <button
          onClick={() => navigate("/feed")}
          className="w-full py-4 border border-yellow-500/30 text-yellow-500 rounded-xl"
        >
          Continuer en tant qu'invité
        </button>
      </div>
    </div>
  );
}

// Simple Feed Page
function Feed() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch posts once
    fetch("/api/explore?page=0&limit=10&hive=quebec")
      .then(r => r.json())
      .then(data => {
        // Handle different response formats
        const postsArray = Array.isArray(data) ? data : data?.posts || [];
        setPosts(postsArray);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur border-b border-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-yellow-500">🐝 Zyeuté</h1>
        <div className="flex gap-4">
          {user && <span className="text-gray-400">{user.username}</span>}
          <button onClick={logout} className="text-sm text-gray-400">
            Déconnexion
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="divide-y divide-gray-800">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Rien à zyeuter pour l'instant!</p>
            <p className="text-sm mt-2">Reviens plus tard 🦫</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  {post.user?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="font-semibold">{post.user?.username || "Anonyme"}</span>
              </div>
              {post.media_url && (
                <video
                  src={post.media_url}
                  className="w-full rounded-lg bg-gray-900"
                  controls
                  preload="metadata"
                />
              )}
              <p className="mt-2 text-gray-300">{post.caption}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <button>🔥 {post.fire_count || 0}</button>
                <button>💬 {post.comment_count || 0}</button>
                <button>↗️ Partager</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Auth Callback
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the callback automatically
    setTimeout(() => navigate("/feed"), 1000);
  }, [navigate]);

  return <PageLoader />;
}

// ===== ROUTER SETUP =====
import { useNavigate } from "react-router-dom";

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

// ===== MAIN APP =====
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
