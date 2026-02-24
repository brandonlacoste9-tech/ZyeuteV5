/**
 * ZYEUTÉ - Quebec's TikTok
 * Full Search Feature + Upload + Everything
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
    { path: "/search", icon: "🔍", label: "Search" },
    { path: "/create", icon: "➕", label: "Create", isCenter: true },
    { path: "/notifications", icon: "🔔", label: "Notifications" },
    { path: "/profile", icon: "👤", label: "Profile" },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-4 z-50"
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

// ===== SEARCH PAGE =====
function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("videos"); // videos, creators, hashtags
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(["#Quebec", "@marie_qc", "poutine"]);

  // Trending hashtags
  const trendingHashtags = [
    { tag: "#Quebec", posts: "12.5K", trending: true },
    { tag: "#Montreal", posts: "8.2K", trending: true },
    { tag: "#Joual", posts: "5.1K", trending: false },
    { tag: "#FleurDeLys", posts: "3.8K", trending: true },
    { tag: "#Poutine", posts: "2.9K", trending: false },
    { tag: "#Maple", posts: "1.5K", trending: false },
    { tag: "#Winter", posts: "4.2K", trending: true },
    { tag: "#Hockey", posts: "6.7K", trending: true },
  ];

  // Mock creators
  const suggestedCreators = [
    { id: 1, username: "marie_qc", followers: "12.5K", avatar: "M", verified: true },
    { id: 2, username: "ti_guy_514", followers: "8.2K", avatar: "T", verified: false },
    { id: 3, username: "sarah_mtl", followers: "5.1K", avatar: "S", verified: true },
    { id: 4, username: "alex_quebec", followers: "3.8K", avatar: "A", verified: false },
  ];

  // Search handler
  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    
    // Simulate search delay
    setTimeout(() => {
      if (searchQuery.startsWith("#")) {
        // Hashtag search
        const filtered = trendingHashtags.filter(h => 
          h.tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setResults(filtered);
        setActiveTab("hashtags");
      } else if (searchQuery.startsWith("@")) {
        // User search
        const filtered = suggestedCreators.filter(c => 
          c.username.toLowerCase().includes(searchQuery.replace("@", "").toLowerCase())
        );
        setResults(filtered);
        setActiveTab("creators");
      } else {
        // Video search (mock)
        setResults([
          { id: 1, caption: `Results for "${searchQuery}"`, user: "zyeute_seed", views: "1.2K" },
          { id: 2, caption: `More about ${searchQuery}`, user: "marie_qc", views: "856" },
        ]);
        setActiveTab("videos");
      }
      setLoading(false);
      
      // Add to recent searches
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev].slice(0, 5));
      }
    }, 500);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      {/* Header with Search */}
      <div className="sticky top-0 z-40 p-4" style={{ background: COLORS.brownDark }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder="Search videos, creators, hashtags..."
              className="w-full px-4 py-3 pl-10 rounded-xl"
              style={{ 
                background: COLORS.leather, 
                border: `1px solid ${COLORS.gold}40`,
                color: COLORS.text,
              }}
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">🔍</span>
            {query && (
              <button 
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-lg"
                style={{ color: COLORS.textMuted }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mt-4 border-b" style={{ borderColor: `${COLORS.gold}30` }}>
          {["videos", "creators", "hashtags"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 font-bold capitalize"
              style={{ 
                color: activeTab === tab ? COLORS.gold : COLORS.textMuted,
                borderBottom: activeTab === tab ? `2px solid ${COLORS.gold}` : "none",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-spin">🐝</div>
            <p style={{ color: COLORS.textMuted }}>Searching...</p>
          </div>
        ) : query ? (
          // Search Results
          <div>
            {activeTab === "videos" && (
              <div className="grid grid-cols-2 gap-3">
                {results.map((video) => (
                  <div 
                    key={video.id}
                    className="aspect-[3/4] rounded-xl flex flex-col justify-end p-3 relative overflow-hidden"
                    style={{ background: COLORS.leather }}
                  >
                    <p className="text-sm line-clamp-2" style={{ color: COLORS.text }}>{video.caption}</p>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>@{video.user}</p>
                    <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full" style={{ background: COLORS.gold, color: COLORS.brownDark }}>
                      ▶ {video.views}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "creators" && (
              <div className="space-y-3">
                {results.map((creator) => (
                  <div 
                    key={creator.id}
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: COLORS.leather }}
                  >
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                      style={{ border: `2px solid ${COLORS.gold}` }}
                    >
                      {creator.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold flex items-center gap-2" style={{ color: COLORS.gold }}>
                        @{creator.username}
                        {creator.verified && <span className="text-blue-400">✓</span>}
                      </p>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>{creator.followers} followers</p>
                    </div>
                    <button 
                      className="px-4 py-2 rounded-full font-bold text-sm"
                      style={{ background: COLORS.gold, color: COLORS.brownDark }}
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "hashtags" && (
              <div className="space-y-3">
                {results.map((hashtag) => (
                  <div 
                    key={hashtag.tag}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: COLORS.leather }}
                  >
                    <div>
                      <p className="font-bold text-lg" style={{ color: COLORS.gold }}>{hashtag.tag}</p>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>{hashtag.posts} posts</p>
                    </div>
                    {hashtag.trending && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#ff4444", color: "white" }}>
                        🔥 Trending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Default View - Trending & Suggested
          <div>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold" style={{ color: COLORS.text }}>Recent</h3>
                  <button 
                    onClick={() => setRecentSearches([])}
                    className="text-sm"
                    style={{ color: COLORS.gold }}
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(search); handleSearch(search); }}
                      className="px-4 py-2 rounded-full text-sm flex items-center gap-2"
                      style={{ background: COLORS.leather, color: COLORS.text }}
                    >
                      🕐 {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Hashtags */}
            <div className="mb-6">
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
                <span>🔥</span> Trending in Quebec
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {trendingHashtags.slice(0, 6).map((hashtag) => (
                  <button
                    key={hashtag.tag}
                    onClick={() => { setQuery(hashtag.tag); handleSearch(hashtag.tag); }}
                    className="p-4 rounded-xl text-left relative overflow-hidden"
                    style={{ background: COLORS.leather, border: `1px solid ${COLORS.gold}30` }}
                  >
                    <p className="font-bold" style={{ color: COLORS.gold }}>{hashtag.tag}</p>
                    <p className="text-sm" style={{ color: COLORS.textMuted }}>{hashtag.posts} posts</p>
                    {hashtag.trending && (
                      <span className="absolute top-2 right-2 text-xs">🔥</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Creators */}
            <div>
              <h3 className="font-bold mb-3" style={{ color: COLORS.text }}>Creators to Follow</h3>
              <div className="space-y-3">
                {suggestedCreators.map((creator) => (
                  <div 
                    key={creator.id}
                    className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: COLORS.leather }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ border: `2px solid ${COLORS.gold}` }}
                    >
                      {creator.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: COLORS.gold }}>@{creator.username}</p>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>{creator.followers} followers</p>
                    </div>
                    <button 
                      className="px-4 py-2 rounded-full font-bold text-sm"
                      style={{ background: COLORS.gold, color: COLORS.brownDark }}
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

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
          <span className="text-8xl">🔥</span>
        </div>
      )}

      <div className="absolute right-4 bottom-32 flex flex-col gap-6">
        <button onClick={(e) => { e.stopPropagation(); onShowProfile(); }} className="flex flex-col items-center gap-1">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brown} 100%)`, border: `2px solid ${COLORS.gold}` }}
          >
            {post.user?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <span className="text-xs" style={{ color: COLORS.text }}>@{post.user?.username}</span>
        </button>

        <button onClick={(e) => { e.stopPropagation(); onDoubleTap(); }} className="flex flex-col items-center gap-1">
          <span className="text-4xl" style={{ filter: isLiked ? "drop-shadow(0 0 10px #FFBF00)" : "none" }}>🔥</span>
          <span className="text-sm font-bold" style={{ color: COLORS.text }}>{(post.fire_count || 0) + (isLiked ? 1 : 0)}</span>
        </button>

        <button onClick={(e) => { e.stopPropagation(); onShowComments(); }} className="flex flex-col items-center gap-1">
          <span className="text-4xl">💬</span>
          <span className="text-sm font-bold" style={{ color: COLORS.text }}>{post.comment_count || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <span className="text-4xl">↗️</span>
          <span className="text-sm font-bold" style={{ color: COLORS.text }}>Share</span>
        </button>
      </div>

      <div className="absolute left-4 bottom-32 right-24">
        <p className="text-lg mb-2" style={{ color: COLORS.text }}>{post.caption}</p>
        <p className="text-sm opacity-70" style={{ color: COLORS.textMuted }}>🎵 Original Sound - {post.user?.username}</p>
      </div>
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
        <h3 className="text-xl font-bold mb-4 text-center" style={{ color: COLORS.gold }}>Comments</h3>
        
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
        <p className="mb-6" style={{ color: COLORS.textMuted }}>Quebec Creator ⚜️</p>

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
          <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.gold }}>Create</h1>
          <p className="mb-6" style={{ color: COLORS.textMuted }}>Share your Quebec story 🦫⚜️</p>

          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 rounded-2xl flex flex-col items-center gap-3"
              style={{ background: COLORS.leather, border: `2px dashed ${COLORS.gold}60` }}
            >
              <span className="text-5xl">📹</span>
              <span className="font-bold" style={{ color: COLORS.gold }}>Record Video</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 rounded-2xl flex flex-col items-center gap-3"
              style={{ background: COLORS.leather, border: `2px dashed ${COLORS.gold}60` }}
            >
              <span className="text-5xl">🖼️</span>
              <span className="font-bold" style={{ color: COLORS.gold }}>Upload from Gallery</span>
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
          <button onClick={handleUpload} disabled={uploading} className="px-4 py-2 rounded-full font-bold" style={{ background: COLORS.gold, color: COLORS.brownDark, opacity: uploading ? 0.5 : 1 }}>{uploading ? "Posting..." : "Post"}</button>
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
          <div className="text-6xl mb-4">🐝</div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.gold }}>Uploading...</h2>
          <div className="w-64 h-3 rounded-full mx-auto mb-4" style={{ background: COLORS.leather }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldLight})`, width: `${uploadProgress}%` }} />
          </div>
          <p style={{ color: COLORS.textMuted }}>{uploadProgress}% complete</p>
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

function Notifications() {
  const notifications = [
    { id: 1, text: "@marie_qc liked your video", time: "2m ago", icon: "🔥" },
    { id: 2, text: "@ti_guy started following you", time: "1h ago", icon: "👤" },
    { id: 3, text: "Your video hit 100 views! 🔥", time: "3h ago", icon: "📈" },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: COLORS.gold }}>Notifications</h1>
        <div className="space-y-3">
          {notifications.map(notif => (
            <div key={notif.id} className="p-4 rounded-2xl flex items-center gap-3" style={{ background: COLORS.leather, border: `1px solid ${COLORS.gold}20` }}>
              <span className="text-2xl">{notif.icon}</span>
              <div className="flex-1">
                <p style={{ color: COLORS.text }}>{notif.text}</p>
                <span className="text-sm" style={{ color: COLORS.textMuted }}>{notif.time}</span>
              </div>
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
  const [activeTab, setActiveTab] = useState("videos");

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.brown }}>
      <div className="p-4 text-center">
        <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold" style={{ background: `linear-gradient(145deg, ${COLORS.leather} 0%, ${COLORS.brown} 100%)`, border: `3px solid ${COLORS.gold}`, boxShadow: `0 0 30px ${COLORS.gold}30` }}>
          {user?.username?.[0]?.toUpperCase() || "?"}
        </div>
        <h1 className="text-2xl font-bold" style={{ color: COLORS.gold }}>@{user?.username || "Guest"}</h1>
        <p className="mb-6" style={{ color: COLORS.textMuted }}>Quebec Creator ⚜️</p>
        <div className="flex justify-around mb-8">
          <div className="text-center"><p className="text-2xl font-bold" style={{ color: COLORS.gold }}>12</p><p className="text-sm" style={{ color: COLORS.textMuted }}>Videos</p></div>
          <div className="text-center"><p className="text-2xl font-bold" style={{ color: COLORS.gold }}>1.2K</p><p className="text-sm" style={{ color: COLORS.textMuted }}>Followers</p></div>
          <div className="text-center"><p className="text-2xl font-bold" style={{ color: COLORS.gold }}>89</p><p className="text-sm" style={{ color: COLORS.textMuted }}>Following</p></div>
        </div>
        <button onClick={logout} className="w-full max-w-xs py-3 rounded-xl font-bold border mb-6" style={{ borderColor: COLORS.gold, color: COLORS.gold }}>Logout</button>
        <div className="flex border-b" style={{ borderColor: `${COLORS.gold}40` }}>
          <button onClick={() => setActiveTab("videos")} className="flex-1 py-3 font-bold" style={{ color: activeTab === "videos" ? COLORS.gold : COLORS.textMuted, borderBottom: activeTab === "videos" ? `2px solid ${COLORS.gold}` : "none" }}>Videos</button>
          <button onClick={() => setActiveTab("liked")} className="flex-1 py-3 font-bold" style={{ color: activeTab === "liked" ? COLORS.gold : COLORS.textMuted, borderBottom: activeTab === "liked" ? `2px solid ${COLORS.gold}` : "none" }}>Liked</button>
        </div>
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: COLORS.brown }}>
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,191,0,0.15) 0%, transparent 70%)" }} />
      <div className="relative z-10 text-center">
        <div className="text-8xl mb-4">⚜️</div>
        <h1 className="text-5xl font-black mb-2" style={{ background: "linear-gradient(180deg, #FFD700 0%, #DAA520 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ZYEUTÉ</h1>
        <p className="mb-8" style={{ color: COLORS.textMuted }}>Quebec's TikTok 🦫⚜️</p>
        <div className="space-y-4 w-72">
          <button onClick={signInWithGoogle} className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3" style={{ background: COLORS.gold, color: COLORS.brownDark }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button onClick={() => navigate("/feed")} className="w-full py-4 rounded-xl font-bold border" style={{ borderColor: COLORS.gold, color: COLORS.gold }}>Continue as Guest</button>
        </div>
      </div>
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
