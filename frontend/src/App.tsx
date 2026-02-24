/**
 * ZYEUTÉ - Quebec's TikTok
 * Full-screen vertical video, leather aesthetic, freeze-proof
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

// ===== CONSTANTS =====
const COLORS = {
  gold: "#FFBF00",
  goldLight: "#FFD700",
  goldDark: "#B8860B",
  brown: "#1a1510",
  brownLight: "#251a15",
  brownDark: "#0d0c0b",
  leather: "#3a2a22",
  text: "#E8DCC4",
  textMuted: "#B8A88A",
};

// ===== COMPONENTS =====

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: COLORS.brown }}>
      <div className="text-center">
        <div className="text-6xl mb-4">🐝</div>
        <p style={{ color: COLORS.textMuted }}>Loading...</p>
      </div>
    </div>
  );
}

// ===== BOTTOM NAVIGATION =====
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: "/feed", icon: "🏠", label: "Home" },
    { path: "/discover", icon: "🔍", label: "Discover" },
    { path: "/create", icon: "➕", label: "Create", isCenter: true },
    { path: "/notifications", icon: "🔔", label: "Notifications" },
    { path: "/profile", icon: "👤", label: "Profile" },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-4 pb-safe z-50"
      style={{ 
        background: `linear-gradient(to top, ${COLORS.brownDark} 0%, ${COLORS.brownDark}ee 80%, transparent 100%)`,
        height: "80px",
        paddingBottom: "20px",
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center justify-center ${item.isCenter ? "relative -top-4" : ""}`}
          style={{ 
            color: currentPath === item.path ? COLORS.gold : COLORS.textMuted,
            opacity: currentPath === item.path ? 1 : 0.7,
          }}
        >
          {item.isCenter ? (
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                boxShadow: `0 4px 20px ${COLORS.gold}50`,
              }}
            >
              {item.icon}
            </div>
          ) : (
            <>
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// ===== FULL-SCREEN VIDEO FEED =====
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

  // Handle scroll to change current video
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / windowHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, posts.length]);

  // Double tap to like
  const handleDoubleTap = (postId) => {
    setShowHeart(postId);
    setTimeout(() => setShowHeart(null), 800);
    
    if (!likedPosts.has(postId)) {
      setLikedPosts(prev => new Set(prev).add(postId));
      // API call to like
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

      {/* Comments Modal */}
      {showComments && (
        <CommentsModal 
          postId={showComments} 
          onClose={() => setShowComments(false)} 
        />
      )}

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal 
          user={showProfile} 
          onClose={() => setShowProfile(null)} 
        />
      )}
    </div>
  );
}

// ===== VIDEO CARD (Full Screen) =====
function VideoCard({ post, isActive, onDoubleTap, onShowComments, onShowProfile, isLiked, showHeart }) {
  const videoRef = useRef(null);
  const [lastTap, setLastTap] = useState(0);

  // Auto play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  // Handle tap for double-tap detection
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      onDoubleTap();
    }
    setLastTap(now);
  };

  return (
    <div 
      className="h-screen w-full relative snap-start snap-always"
      onClick={handleTap}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={post.media_url || post.video_url}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={false}
        poster={post.thumbnail_url}
      />

      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Double Tap Heart Animation */}
      {showHeart && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            animation: "heartPop 0.8s ease-out forwards",
          }}
        >
          <span className="text-8xl">🔥</span>
        </div>
      )}

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-6">
        {/* Profile */}
        <button 
          onClick={(e) => { e.stopPropagation(); onShowProfile(); }}
          className="flex flex-col items-center gap-1"
        >
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{
              background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brown} 100%)`,
              border: `2px solid ${COLORS.gold}`,
            }}
          >
            {post.user?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <span className="text-xs" style={{ color: COLORS.text }}>@{post.user?.username}</span>
        </button>

        {/* Like */}
        <button 
          onClick={(e) => { e.stopPropagation(); onDoubleTap(); }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-4xl" style={{ filter: isLiked ? "drop-shadow(0 0 10px #FFBF00)" : "none" }}>
            {isLiked ? "🔥" : "🔥"}
          </span>
          <span className="text-sm font-bold" style={{ color: COLORS.text }}>
            {(post.fire_count || 0) + (isLiked ? 1 : 0)}
          </span>
        </button>

        {/* Comments */}
        <button 
          onClick={(e) => { e.stopPropagation(); onShowComments(); }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-4xl">💬</span>
          <span className="text-sm font-bold" style={{ color: COLORS.text }}>{post.comment_count || 0}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <span className="text-4xl">↗️</span>
          <span className="text-sm font-bold" style={{ color: COLORS.text }}>Share</span>
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute left-4 bottom-32 right-24">
        <p className="text-lg mb-2" style={{ color: COLORS.text }}>{post.caption}</p>
        <p className="text-sm opacity-70" style={{ color: COLORS.textMuted }}>
          🎵 Original Sound - {post.user?.username}
        </p>
      </div>

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

// ===== COMMENTS MODAL =====
function CommentsModal({ postId, onClose }) {
  const [comments, setComments] = useState([
    { id: 1, user: "marie_qc", text: "C'est ben beau! 🔥", avatar: "M" },
    { id: 2, user: "ti_guy_514", text: "Tabarnac c'est nice", avatar: "T" },
    { id: 3, user: "sarah_mtl", text: "Love this! ⚜️", avatar: "S" },
  ]);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setComments(prev => [...prev, {
      id: Date.now(),
      user: "You",
      text: newComment,
      avatar: "Y",
    }]);
    setNewComment("");
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      <div 
        className="w-full rounded-t-3xl p-4"
        style={{
          background: `linear-gradient(145deg, ${COLORS.brown} 0%, ${COLORS.brownDark} 100%)`,
          borderTop: `2px solid ${COLORS.gold}40`,
          maxHeight: "70vh",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: COLORS.gold }} />
        
        <h3 className="text-xl font-bold mb-4 text-center" style={{ color: COLORS.gold }}>Comments</h3>
        
        {/* Comments List */}
        <div className="overflow-y-auto mb-4" style={{ maxHeight: "40vh" }}>
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                style={{ background: COLORS.leather, border: `1px solid ${COLORS.gold}` }}
              >
                {comment.avatar}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: COLORS.gold }}>@{comment.user}</p>
                <p style={{ color: COLORS.text }}>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
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
function ProfileModal({ user, onClose }) {
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
        onClick={e => e.stopPropagation()}
      >
        {/* Avatar */}
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

        <h2 className="text-2xl font-bold mb-1" style={{ color: COLORS.gold }}>@{user?.username}</h2>
        <p className="mb-6" style={{ color: COLORS.textMuted }}>Quebec Creator ⚜️</p>

        {/* Stats */}
        <div className="flex justify-around mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>1.2K</p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>89</p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>Following</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>456</p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>Likes</p>
          </div>
        </div>

        {/* Buttons */}
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

// ===== PAGES =====

function Feed() {
  return (
    <div className="relative h-screen" style={{ background: COLORS.brown }}>
      <VideoFeed />
      <BottomNav />
    </div>
  );
}

function Discover() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: COLORS.gold }}>Discover</h1>
        <div className="grid grid-cols-2 gap-4">
          {["#Quebec", "#Montreal", "#Joual", "#Maple", "#FleurDeLys", "#Poutine"].map(tag => (
            <button 
              key={tag}
              className="p-4 rounded-2xl text-center font-bold"
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
      <BottomNav />
    </div>
  );
}

function Create() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      navigate("/feed");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-24" style={{ background: COLORS.brown }}>
      <div 
        className="w-full max-w-sm rounded-3xl p-8 text-center"
        style={{
          background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brown} 100%)`,
          border: `2px dashed ${COLORS.gold}60`,
        }}
      >
        <div className="text-6xl mb-4">📹</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.gold }}>Create Video</h2>
        <p className="mb-6" style={{ color: COLORS.textMuted }}>Share your Quebec story with the world</p>
        
        <button 
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-4 rounded-xl font-bold"
          style={{ 
            background: uploading ? COLORS.goldDark : COLORS.gold,
            color: COLORS.brownDark,
          }}
        >
          {uploading ? "Uploading..." : "Select Video"}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

function Notifications() {
  const notifications = [
    { id: 1, text: "@marie_qc liked your video", time: "2m ago" },
    { id: 2, text: "@ti_guy started following you", time: "1h ago" },
    { id: 3, text: "Your video hit 100 views! 🔥", time: "3h ago" },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: COLORS.gold }}>Notifications</h1>
        <div className="space-y-3">
          {notifications.map(notif => (
            <div 
              key={notif.id}
              className="p-4 rounded-2xl flex justify-between items-center"
              style={{ 
                background: COLORS.leather,
                border: `1px solid ${COLORS.gold}20`,
              }}
            >
              <p style={{ color: COLORS.text }}>{notif.text}</p>
              <span className="text-sm" style={{ color: COLORS.textMuted }}>{notif.time}</span>
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

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      <div className="p-4 text-center">
        {/* Avatar */}
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

        <h1 className="text-2xl font-bold" style={{ color: COLORS.gold }}>@{user?.username || "Guest"}</h1>
        <p className="mb-6" style={{ color: COLORS.textMuted }}>Quebec Creator ⚜️</p>

        {/* Stats */}
        <div className="flex justify-around mb-8">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>12</p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>Videos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>1.2K</p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>89</p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>Following</p>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={logout}
          className="w-full max-w-xs py-3 rounded-xl font-bold border"
          style={{ borderColor: COLORS.gold, color: COLORS.gold }}
        >
          Logout
        </button>
      </div>
      <BottomNav />
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
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: COLORS.brown }}
    >
      {/* Leather Texture */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gold Glow */}
      <div 
        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,191,0,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center">
        {/* Fleur-de-lys */}
        <div className="text-8xl mb-4">⚜️</div>
        
        <h1 
          className="text-5xl font-black mb-2"
          style={{ 
            background: "linear-gradient(180deg, #FFD700 0%, #DAA520 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ZYEUTÉ
        </h1>
        <p className="mb-8" style={{ color: COLORS.textMuted }}>Quebec's TikTok 🦫⚜️</p>

        <div className="space-y-4 w-72">
          <button
            onClick={signInWithGoogle}
            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3"
            style={{
              background: COLORS.gold,
              color: COLORS.brownDark,
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

          <button
            onClick={() => navigate("/feed")}
            className="w-full py-4 rounded-xl font-bold border"
            style={{ borderColor: COLORS.gold, color: COLORS.gold }}
          >
            Continue as Guest
          </button>
        </div>
      </div>
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

// ===== APP =====
function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/create" element={<Create />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
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
