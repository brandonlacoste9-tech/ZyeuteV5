/**
 * La Zyeute - TikTok-style Vertical Swipe Feed
 * Full-screen vertical scroll experience with snap scrolling
 * Edge lighting effects when content is playing
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, togglePostFire } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import type { Post, User } from "@/types";

export const LaZyeute: React.FC = () => {
  const navigate = useNavigate();
  const { edgeLighting } = useTheme();

  // Infinite scroll hook
  const { posts, loadMoreRef, isLoading, isFetchingNextPage, hasNextPage } =
    useInfiniteFeed("explore");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showEdgeGlow, setShowEdgeGlow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  // Current post for edge lighting
  const currentPost = useMemo(() => posts[currentIndex], [posts, currentIndex]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // Pre-fetch next page when user is 3 videos from the end
  useEffect(() => {
    if (
      posts.length > 0 &&
      currentIndex >= posts.length - 3 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      // Trigger will load more automatically via Intersection Observer
      console.log("Near end of feed, pre-fetching...");
    }
  }, [currentIndex, posts.length, hasNextPage, isFetchingNextPage]);

  // Video playback control and edge lighting
  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      const postIndex = posts.findIndex((p) => p.id === id);
      if (postIndex === currentIndex) {
        video.currentTime = 0;
        if (isPlaying) {
          video.play().catch(() => {});
          setShowEdgeGlow(true);
        } else {
          video.pause();
          setShowEdgeGlow(false);
        }
      } else {
        video.pause();
      }
    });

    // Show edge glow for photos too (after a brief delay)
    if (currentPost?.type !== "video") {
      const timer = setTimeout(() => setShowEdgeGlow(true), 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, posts, isPlaying, currentPost]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const viewportHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / viewportHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
      setShowEdgeGlow(false); // Reset glow on scroll
    }
  }, [currentIndex, posts.length]);

  // Touch gesture handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    touchStartY.current = y;
    touchEndY.current = y; // Initialize to same value to prevent false swipes on taps
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Use changedTouches for accurate end position
      const endY = e.changedTouches[0]?.clientY ?? touchEndY.current;
      const diff = touchStartY.current - endY;
      const threshold = 50;

      // Only swipe if there was actual movement (not a tap)
      if (Math.abs(diff) > threshold) {
        if (diff > 0 && currentIndex < posts.length - 1) {
          // Swipe up - next post
          setCurrentIndex((prev) => prev + 1);
          containerRef.current?.scrollTo({
            top: (currentIndex + 1) * window.innerHeight,
            behavior: "smooth",
          });
        } else if (diff < 0 && currentIndex > 0) {
          // Swipe down - previous post
          setCurrentIndex((prev) => prev - 1);
          containerRef.current?.scrollTo({
            top: (currentIndex - 1) * window.innerHeight,
            behavior: "smooth",
          });
        }
      }
    },
    [currentIndex, posts.length],
  );

  const handleFireToggle = async (postId: string) => {
    if (!currentUser) return;
    try {
      await togglePostFire(postId, currentUser.id);
      // The infinite feed hook will automatically refetch and update
    } catch (error) {
      console.error("Error toggling fire:", error);
    }
  };

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/p/${postId}`;
    if (navigator.share) {
      await navigator.share({ title: "Regarde ça sur Zyeuté!", url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-4" />
          <p className="text-white">Chargement de La Zyeute...</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🦫</div>
          <h2 className="text-gold-400 text-xl font-bold mb-2">
            Rien à zyeuter!
          </h2>
          <p className="text-stone-400 mb-6">
            Suis des créateurs pour voir leur contenu ici
          </p>
          <Link
            to="/explore"
            className="bg-gold-500 text-black px-6 py-3 rounded-xl font-bold"
          >
            Découvrir
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Dynamic Edge Lighting Effect */}
      <div
        className={`fixed inset-0 pointer-events-none z-40 transition-opacity duration-500 ${
          showEdgeGlow ? "opacity-100" : "opacity-0"
        }`}
        style={{
          boxShadow: `
            inset 0 0 60px ${edgeLighting}40,
            inset 0 0 120px ${edgeLighting}20,
            inset 0 0 200px ${edgeLighting}10
          `,
        }}
      />

      {/* Animated Edge Border */}
      <div
        className={`fixed inset-0 pointer-events-none z-40 transition-opacity duration-500 ${
          showEdgeGlow && currentPost?.type === "video"
            ? "opacity-100"
            : "opacity-0"
        }`}
        style={{
          border: `2px solid ${edgeLighting}60`,
          boxShadow: `
            0 0 20px ${edgeLighting}50,
            0 0 40px ${edgeLighting}30,
            0 0 60px ${edgeLighting}20
          `,
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => navigate(-1)}
          className="text-white p-2 press-scale"
          data-testid="button-back"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-gold-400 font-black text-lg">La Zyeute</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayPause}
            className="text-white p-2 press-scale"
            data-testid="button-playpause"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-white p-2 press-scale"
            data-testid="button-mute"
          >
            {isMuted ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Vertical Snap Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="h-screen w-full snap-start snap-always relative flex items-center justify-center"
            data-testid={`post-slide-${post.id}`}
          >
            {/* Media */}
            <div
              className="absolute inset-0 bg-black"
              onClick={post.type === "video" ? togglePlayPause : undefined}
            >
              {post.type === "video" ? (
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(post.id, el);
                  }}
                  src={post.media_url}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  muted={isMuted}
                  autoPlay={index === currentIndex && isPlaying}
                />
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={post.media_url}
                    alt={post.caption || "Post image"}
                    className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-linear ${
                      index === currentIndex ? "scale-110" : "scale-100"
                    }`}
                  />
                  {/* Subtle Ken Burns effect for photos */}
                </div>
              )}

              {/* Type Badge */}
              <div className="absolute top-20 left-4 z-30">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
                    post.type === "video"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  {post.type === "video" ? "▶ Vidéo" : "📷 Photo"}
                </div>
              </div>

              {/* Play/Pause Indicator for Videos */}
              {post.type === "video" &&
                !isPlaying &&
                index === currentIndex && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                      <svg
                        className="w-10 h-10 text-white ml-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            {/* Right Side Actions */}
            <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20">
              {/* Profile */}
              <Link
                to={`/profile/${post.user?.username || post.user?.id}`}
                className="relative press-scale"
                data-testid={`link-profile-${post.id}`}
              >
                <div
                  className="w-12 h-12 rounded-full border-2 overflow-hidden shadow-lg transition-all duration-300"
                  style={{
                    borderColor: edgeLighting,
                    boxShadow: showEdgeGlow
                      ? `0 0 15px ${edgeLighting}50`
                      : "none",
                  }}
                >
                  <img
                    src={post.user?.avatar_url || "/default-avatar.png"}
                    alt={post.user?.display_name || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: edgeLighting }}
                >
                  <span className="text-black text-xs font-bold">+</span>
                </div>
              </Link>

              {/* Fire */}
              <button
                onClick={() => handleFireToggle(post.id)}
                className="flex flex-col items-center gap-1 press-scale"
                data-testid={`button-fire-${post.id}`}
              >
                <div
                  className={`p-2 rounded-full transition-all duration-300 ${
                    post.is_fired
                      ? "bg-orange-500/30 scale-110"
                      : "bg-black/40 hover:bg-black/60"
                  }`}
                  style={
                    post.is_fired
                      ? { boxShadow: "0 0 20px rgba(255,100,0,0.5)" }
                      : {}
                  }
                >
                  <span
                    className={`text-2xl transition-transform duration-200 ${
                      post.is_fired ? "animate-bounce" : ""
                    }`}
                  >
                    🔥
                  </span>
                </div>
                <span className="text-white text-xs font-bold">
                  {post.fire_count || 0}
                </span>
              </button>

              {/* Comments */}
              <Link
                to={`/p/${post.id}`}
                className="flex flex-col items-center gap-1 press-scale"
                data-testid={`link-comments-${post.id}`}
              >
                <div className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <span className="text-white text-xs font-bold">
                  {post.comment_count || 0}
                </span>
              </Link>

              {/* Share */}
              <button
                onClick={() => handleShare(post.id)}
                className="flex flex-col items-center gap-1 press-scale"
                data-testid={`button-share-${post.id}`}
              >
                <div className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </div>
                <span className="text-white text-xs font-bold">Partager</span>
              </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-6 left-4 right-20 z-20">
              {/* Username */}
              <Link
                to={`/profile/${post.user?.username || post.user?.id}`}
                className="flex items-center gap-2 mb-2"
                data-testid={`link-user-${post.id}`}
              >
                <span className="text-white font-bold text-base">
                  @{post.user?.username}
                </span>
                {post.user?.is_verified && (
                  <span
                    className="drop-shadow-lg"
                    style={{ color: edgeLighting }}
                  >
                    ✓
                  </span>
                )}
              </Link>

              {/* Caption */}
              {post.caption && (
                <p className="text-white text-sm mb-2 line-clamp-3">
                  {post.caption}
                </p>
              )}

              {/* Hashtags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.slice(0, 4).map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs"
                      style={{ color: edgeLighting }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Region Badge */}
              {post.region && (
                <div className="mt-2 inline-flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                  <span className="text-xs">📍</span>
                  <span className="text-white text-xs capitalize">
                    {post.region}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-30">
              {posts
                .slice(
                  Math.max(0, index - 2),
                  Math.min(posts.length, index + 3),
                )
                .map((_, i) => {
                  const realIndex = Math.max(0, index - 2) + i;
                  return (
                    <div
                      key={realIndex}
                      className="w-1 rounded-full transition-all"
                      style={{
                        height: realIndex === currentIndex ? "16px" : "8px",
                        backgroundColor:
                          realIndex === currentIndex
                            ? edgeLighting
                            : "rgba(255,255,255,0.3)",
                        boxShadow:
                          realIndex === currentIndex
                            ? `0 0 8px ${edgeLighting}`
                            : "none",
                      }}
                    />
                  );
                })}
            </div>
          </div>
        ))}

        {/* Infinite Scroll Trigger & Loading Indicator */}
        {hasNextPage && (
          <div
            ref={loadMoreRef}
            className="h-screen snap-start snap-always flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-4" />
              <p className="text-white text-lg">Chargement...</p>
              <p className="text-white/60 text-sm">
                Encore plus de contenu québécois! 🍁
              </p>
            </div>
          </div>
        )}

        {/* End of Feed Message */}
        {!hasNextPage && posts.length > 0 && (
          <div className="h-screen snap-start snap-always flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🍁</div>
              <h2 className="text-gold-400 text-xl font-bold mb-2">
                C'est tout pour le moment!
              </h2>
              <p className="text-white/60 mb-6">
                Revenez plus tard pour plus de contenu
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gold-500 text-black px-6 py-3 rounded-xl font-bold press-scale"
              >
                Recharger le fil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Swipe Hint (shows briefly on first load) */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce opacity-70">
        <div className="flex flex-col items-center text-white/60">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
          <span className="text-xs">Glisse vers le haut</span>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 p-4 flex justify-center">
        <Link
          to="/"
          className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border text-sm font-medium press-scale transition-all"
          style={{
            borderColor: `${edgeLighting}50`,
            color: edgeLighting,
          }}
          data-testid="link-home"
        >
          ← Retour au fil
        </Link>
      </div>
    </div>
  );
};

export default LaZyeute;
