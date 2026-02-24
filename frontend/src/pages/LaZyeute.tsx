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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, togglePostFire } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { VideoPlaybackDiagnostic } from "@/components/video/VideoPlaybackDiagnostic";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";
import type { Post, User } from "@/types";

export const LaZyeute: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { edgeLighting } = useTheme();

  // Infinite scroll hook
  const { posts, loadMoreRef, isLoading, isFetchingNextPage, hasNextPage } =
    useInfiniteFeed("explore");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showEdgeGlow, setShowEdgeGlow] = useState(false);
  const [showTiGuyChat, setShowTiGuyChat] = useState(false);
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
            {/* Video Playback Diagnostic (?debug=1) */}
            {post.type === "video" && (
              <VideoPlaybackDiagnostic
                postId={post.id}
                postType={post.type}
                muxPlaybackId={(post as Post).mux_playback_id}
                mediaUrl={post.media_url}
                videoSrc={
                  (post as Post).mux_playback_id
                    ? null
                    : getProxiedMediaUrl(post.media_url) || post.media_url
                }
                playerPath={
                  (post as Post).mux_playback_id
                    ? "mux"
                    : post.media_url
                      ? "native"
                      : "none"
                }
                isActive={index === currentIndex}
              />
            )}
            {/* Media */}
            <div
              className="absolute inset-0 bg-black"
              onClick={
                (post.media_url || post.mediaUrl)?.includes(".mp4") ||
                (post.media_url || post.mediaUrl)?.includes("video")
                  ? togglePlayPause
                  : undefined
              }
            >
              {post.type === "video" ? (
                (post as Post).mux_playback_id ? (
                  <MuxVideoPlayer
                    playbackId={(post as Post).mux_playback_id || ""}
                    thumbnailUrl={
                      getProxiedMediaUrl(
                        post.thumbnail_url || post.media_url,
                      ) ||
                      post.thumbnail_url ||
                      post.media_url
                    }
                    className="w-full h-full object-cover"
                    autoPlay={index === currentIndex && isPlaying}
                    muted={isMuted}
                    loop
                  />
                ) : (
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(post.id, el);
                    }}
                    src={getProxiedMediaUrl(post.media_url) || post.media_url}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    muted={isMuted}
                    autoPlay={index === currentIndex && isPlaying}
                  />
                )
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={getProxiedMediaUrl(post.media_url) || post.media_url}
                    alt={post.caption || "Post image"}
                    className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-linear ${
                      index === currentIndex ? "scale-110" : "scale-100"
                    }`}
                  />
                </div>
              )}

              {/* Type Badge */}
              <div className="absolute top-20 left-4 z-30">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
                    (post.media_url || post.mediaUrl)?.includes(".mp4") ||
                    (post.media_url || post.mediaUrl)?.includes("video")
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
                {post.user?.isVerified && (
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

      {/* Right Side Actions - FIXED overlay, does not scroll with videos */}
      {posts.length > 0 && currentPost && (
        <div className="fixed right-3 bottom-32 flex flex-col items-center gap-5 z-30">
          {/* TI-GUY Chat Widget */}
          <button
            onClick={() => setShowTiGuyChat(true)}
            className="flex flex-col items-center gap-1 press-scale"
            data-testid="button-tiguy-chat"
            aria-label="Jase avec Ti-Guy"
          >
            <div
              className="w-12 h-12 rounded-full border-2 overflow-hidden flex items-center justify-center transition-all duration-300"
              style={{
                borderColor: edgeLighting,
                boxShadow: `0 0 12px ${edgeLighting}50, inset 0 0 8px ${edgeLighting}20`,
                background: "linear-gradient(145deg, #1A0F0A 0%, #2C1810 100%)",
              }}
            >
              <img
                src="/zyeute-beaver.svg"
                alt="Ti-Guy"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                  const fallback =
                    img.parentElement?.querySelector(".tiguy-fallback");
                  if (fallback) fallback.classList.remove("hidden");
                }}
              />
              <span
                className="tiguy-fallback hidden text-xl font-bold"
                style={{ color: edgeLighting }}
              >
                🦫
              </span>
            </div>
            <span
              className="text-xs font-bold"
              style={{
                color: edgeLighting,
                textShadow: `0 0 8px ${edgeLighting}50`,
              }}
            >
              Ti-Guy
            </span>
          </button>

          {/* Profile - current post's creator */}
          <Link
            to={`/profile/${currentPost.user?.username || currentPost.user?.id}`}
            className="relative press-scale flex flex-col items-center gap-1"
            data-testid={`link-profile-${currentPost.id}`}
          >
            <div
              className="w-12 h-12 rounded-full border-2 overflow-hidden transition-all duration-300"
              style={{
                borderColor: edgeLighting,
                boxShadow: `0 0 12px ${edgeLighting}50, inset 0 0 8px ${edgeLighting}20`,
              }}
            >
              <img
                src={currentPost.user?.avatar_url || "/default-avatar.png"}
                alt={currentPost.user?.displayName || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center border-2"
              style={{
                backgroundColor: edgeLighting,
                borderColor: edgeLighting,
              }}
            >
              <span className="text-black text-xs font-bold">+</span>
            </div>
          </Link>

          {/* Fire - larger flame with warm red/orange glow */}
          <button
            onClick={() => handleFireToggle(currentPost.id)}
            className="flex flex-col items-center gap-1 press-scale"
            data-testid={`button-fire-${currentPost.id}`}
          >
            <div
              className="p-2.5 rounded-full transition-all duration-300"
              style={{
                boxShadow: (currentPost as any).is_fired
                  ? "0 0 24px rgba(255,120,80,0.9), 0 0 32px rgba(255,80,40,0.7)"
                  : `0 0 12px ${edgeLighting}60`,
                background: (currentPost as any).is_fired
                  ? "radial-gradient(circle at 30% 10%, #FFE8C2 0%, #FF9F6E 35%, #FF5A3C 70%, rgba(0,0,0,0.8) 100%)"
                  : "radial-gradient(circle at 30% 10%, #2C1810 0%, #1A0F0A 60%, #0D0705 100%)",
              }}
            >
              <svg
                className="w-8 h-8"
                viewBox="0 0 24 24"
                fill={
                  (currentPost as any).is_fired ? "url(#flameGradient)" : "none"
                }
                stroke={(currentPost as any).is_fired ? "none" : edgeLighting}
                strokeWidth={(currentPost as any).is_fired ? 0 : 1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 4px ${edgeLighting}60)` }}
              >
                {/* warm red/orange gradient for active flame */}
                <defs>
                  <radialGradient id="flameGradient" cx="50%" cy="20%" r="70%">
                    <stop offset="0%" stopColor="#FFEFD5" />
                    <stop offset="35%" stopColor="#FFC26A" />
                    <stop offset="70%" stopColor="#FF5A3C" />
                    <stop offset="100%" stopColor="#C62828" />
                  </radialGradient>
                </defs>
                <path d="M12 2C10.5 4.5 8 7 8 10c0 2 1 3 2 4-1-1-3-3-3-6 0-4 3-6 5-6zm0 4c-1 1.5-2 3-2 5 0 3 2 5 4 5s4-2 4-5c0-2-1-3.5-2-5 0 0 1 2 1 3 0 2-1 3-2 3s-2-1-2-3c0-1 1-3 1-3z" />
              </svg>
            </div>
            <span
              className="text-xs font-bold"
              style={{
                color: edgeLighting,
                textShadow: `0 0 8px ${edgeLighting}50`,
              }}
            >
              {(currentPost as any).fireCount ??
                (currentPost as any).fire_count ??
                0}
            </span>
          </button>

          {/* Comments */}
          <Link
            to={`/p/${currentPost.id}`}
            className="flex flex-col items-center gap-1 press-scale"
            data-testid={`link-comments-${currentPost.id}`}
          >
            <div
              className="p-2 rounded-full transition-all duration-300"
              style={{ boxShadow: `0 0 10px ${edgeLighting}40` }}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke={edgeLighting}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                style={{ filter: `drop-shadow(0 0 4px ${edgeLighting}60)` }}
              >
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span
              className="text-xs font-bold"
              style={{
                color: edgeLighting,
                textShadow: `0 0 8px ${edgeLighting}50`,
              }}
            >
              {(currentPost as any).commentCount ??
                (currentPost as any).comment_count ??
                0}
            </span>
          </Link>

          {/* Share */}
          <button
            onClick={() => handleShare(currentPost.id)}
            className="flex flex-col items-center gap-1 press-scale"
            data-testid={`button-share-${currentPost.id}`}
          >
            <div
              className="p-2 rounded-full transition-all duration-300"
              style={{ boxShadow: `0 0 10px ${edgeLighting}40` }}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke={edgeLighting}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                style={{ filter: `drop-shadow(0 0 4px ${edgeLighting}60)` }}
              >
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <span
              className="text-xs font-bold"
              style={{
                color: edgeLighting,
                textShadow: `0 0 8px ${edgeLighting}50`,
              }}
            >
              Partager
            </span>
          </button>

          {/* Music */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="p-2 rounded-full transition-all duration-300"
              style={{ boxShadow: `0 0 10px ${edgeLighting}40` }}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke={edgeLighting}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                style={{ filter: `drop-shadow(0 0 4px ${edgeLighting}60)` }}
              >
                <path d="M9 18V5l12-2v13M9 9l12-2" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span
              className="text-xs font-bold"
              style={{
                color: edgeLighting,
                textShadow: `0 0 8px ${edgeLighting}50`,
              }}
            >
              Son
            </span>
          </div>
        </div>
      )}

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

      {/* Bottom Navigation - leather bar with 2 icons each side and center + */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
        style={{
          background:
            "linear-gradient(180deg, #2C1810 0%, #1A0F0A 60%, #0D0705 100%)",
          borderTop: `1px solid ${edgeLighting}30`,
          paddingInline: 24,
          paddingTop: 8,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        }}
      >
        {/* Home */}
        <button
          onClick={() => navigate("/feed")}
          className="flex flex-col items-center gap-1 press-scale"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill={location.pathname === "/feed" ? edgeLighting : "none"}
            stroke={edgeLighting}
            strokeWidth={2}
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span
            className="text-xs"
            style={{ color: edgeLighting, opacity: 0.9 }}
          >
            Home
          </span>
        </button>

        {/* Search */}
        <button
          onClick={() => navigate("/search")}
          className="flex flex-col items-center gap-1 press-scale"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke={edgeLighting}
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span
            className="text-xs"
            style={{ color: edgeLighting, opacity: 0.9 }}
          >
            Search
          </span>
        </button>

        {/* Center create (+) */}
        <button
          onClick={() => navigate("/create")}
          className="relative -top-3 press-scale"
          aria-label="Create"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(145deg, #F4E2A6 0%, #D4AF37 45%, #C9A227 70%, #8B6914 100%)",
              border: "2px solid #8B6914",
              boxShadow: "0 4px 15px rgba(201, 162, 39, 0.6)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="#1A0F0A"
              stroke="#1A0F0A"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate("/notifications")}
          className="flex flex-col items-center gap-1 press-scale"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill={
              location.pathname === "/notifications" ? edgeLighting : "none"
            }
            stroke={edgeLighting}
            strokeWidth={2}
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span
            className="text-xs"
            style={{ color: edgeLighting, opacity: 0.9 }}
          >
            Notifications
          </span>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate("/profile")}
          className="flex flex-col items-center gap-1 press-scale"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill={location.pathname === "/profile" ? edgeLighting : "none"}
            stroke={edgeLighting}
            strokeWidth={2}
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span
            className="text-xs"
            style={{ color: edgeLighting, opacity: 0.9 }}
          >
            Profile
          </span>
        </button>
      </div>

      {/* TI-GUY Chat Widget Modal - leather aesthetic */}
      {showTiGuyChat && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowTiGuyChat(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, #2C1810 0%, #1A0F0A 50%, #0D0705 100%)",
              border: `2px dashed ${edgeLighting}40`,
              boxShadow: `0 0 30px ${edgeLighting}20, inset 0 0 60px rgba(0,0,0,0.5)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-5"
              style={{
                background: "linear-gradient(180deg, #3D2418 0%, #2C1810 100%)",
                borderBottom: `1px dashed ${edgeLighting}40`,
              }}
            >
              <span className="text-sm" style={{ color: "#A68B7C" }}>
                Chats/DMs
              </span>
              <div className="text-center">
                <h2
                  className="text-lg font-bold"
                  style={{
                    color: edgeLighting,
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  Ti-Guy
                </h2>
                <span className="text-xs" style={{ color: "#4ade80" }}>
                  EN LIGNE
                </span>
              </div>
              <div className="flex gap-2">
                <span
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    border: `1px solid ${edgeLighting}60`,
                    color: edgeLighting,
                  }}
                >
                  MODE
                </span>
                <span
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    border: `1px solid ${edgeLighting}60`,
                    color: edgeLighting,
                  }}
                >
                  VIP
                </span>
              </div>
            </div>

            {/* Central Ti-Guy emblem */}
            <div className="flex justify-center py-8">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center border-2"
                style={{
                  borderColor: edgeLighting,
                  boxShadow: `0 0 20px ${edgeLighting}50, inset 0 0 20px rgba(0,0,0,0.8)`,
                  background: "#1A0F0A",
                }}
              >
                <img
                  src="/zyeute-beaver.svg"
                  alt="Ti-Guy"
                  className="w-14 h-14 object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = "none";
                    const fallback = img.parentElement?.querySelector(
                      ".tiguy-modal-fallback",
                    );
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
                <span className="tiguy-modal-fallback hidden text-4xl">🦫</span>
              </div>
            </div>

            {/* Chat input - leather strap style */}
            <div
              className="flex items-center gap-2 p-4"
              style={{
                background:
                  "linear-gradient(180deg, #4A2E20 0%, #3D2418 50%, #2C1810 100%)",
                borderTop: `1px dashed ${edgeLighting}40`,
              }}
            >
              <button
                className="p-2 rounded-lg"
                style={{
                  background: "#1A0F0A",
                  border: `1px solid ${edgeLighting}40`,
                }}
              >
                <span className="text-lg">🦫</span>
              </button>
              <button
                className="p-2 rounded-lg"
                style={{
                  background: "#1A0F0A",
                  border: `1px solid ${edgeLighting}40`,
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke={edgeLighting}
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Jase avec moi..."
                className="flex-1 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "#1A0F0A",
                  border: `2px solid ${edgeLighting}40`,
                  color: "#F5E6D3",
                }}
              />
              <button
                onClick={() => setShowTiGuyChat(false)}
                className="p-2 rounded-full"
                style={{
                  border: `2px solid ${edgeLighting}`,
                  color: edgeLighting,
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaZyeute;
