/**
 * Video Card Component - Premium Leather Design
 * Stitched leather frame with gold accents
 */

import React, { Suspense } from "react";
import { AppConfig } from "../../config/factory";
import DOMPurify from "dompurify";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "../Avatar";
import { VideoPlayer } from "./VideoPlayer";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { useAuth } from "../../hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { usePresence } from "@/hooks/usePresence";
import { toast } from "../Toast";
import { cn } from "../../lib/utils";
import { InteractiveText } from "../InteractiveText";
import { useTranslation } from "@/i18n";

import { TiGuyInsight } from "../TiGuyInsight";
import { EphemeralBadge } from "../ui/EphemeralBadge";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";
import type { Post, User } from "../../types";

interface VideoCardProps {
  post: Post;
  user?: User;
  variant?: "horizontal" | "vertical";
  autoPlay?: boolean;
  muted?: boolean;
  onFireToggle?: (postId: string, currentFire: number) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onGift?: (postId: string, recipient: User) => void;
  priority?: boolean;
}

const VideoCardComponent: React.FC<VideoCardProps> = ({
  post,
  user,
  variant = "vertical",
  autoPlay = false,
  muted = true,
  onFireToggle,
  onComment,
  onShare,
  onGift,
  priority = false,
}) => {
  const navigate = useNavigate();
  const { tap } = useHaptics();
  const { t } = useTranslation();

  // Real-time Presence & Engagement
  const { viewerCount, engagement } = usePresence(post.id);
  const [isLiked, setIsLiked] = React.useState(false);

  // Handle missing user by using user from post relation
  const effectiveUser = user || post.user;

  if (!effectiveUser) {
    return (
      <div className="leather-card p-4 text-center text-stone-500 text-xs">
        {t("error_content_unavailable")}
      </div>
    );
  }

  const userToUse = effectiveUser;

  // Derive counts from props OR real-time updates
  const fireCount = engagement.fireCount ?? post.fire_count;
  const commentCount = engagement.commentCount ?? post.comment_count;

  const isHorizontal = variant === "horizontal";

  const handleCardClick = () => {
    tap();
    if (post.type === "video") {
      navigate(`/video/${post.id}`);
    } else {
      navigate(`/p/${post.id}`);
    }
  };

  const handleFire = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking fire button
    setIsLiked(!isLiked);
    onFireToggle?.(post.id, fireCount);
  };

  return (
    <div
      className={cn(
        "leather-card rounded-2xl overflow-hidden stitched transition-all duration-300 group shadow-xl",
        "hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,191,0,0.2)]",
        "hover:border-gold-500/50 cursor-pointer",
        isHorizontal ? "w-72 flex-shrink-0" : "w-full",
      )}
      onClick={handleCardClick}
    >
      {/* User Header */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-neutral-800 bg-black/20",
          isHorizontal ? "p-2" : "p-3",
        )}
      >
        <Link to={`/profile/${userToUse.username}`} className="relative">
          <div className="absolute inset-0 rounded-full border border-gold-500/30 blur-[1px]"></div>
          <Avatar
            src={userToUse.avatar_url}
            size="md"
            isVerified={userToUse.is_verified}
            className="ring-2 ring-gold-500/20"
            userId={userToUse.id}
          />
        </Link>
        <div className="flex-1">
          <Link
            to={`/profile/${userToUse.username}`}
            className="font-bold text-stone-200 hover:text-gold-400 transition-colors flex items-center gap-1"
          >
            {userToUse.display_name || userToUse.username}
            {userToUse.is_verified && (
              <span className="text-gold-500 drop-shadow-[0_0_2px_rgba(255,191,0,0.5)]">
                ✓
              </span>
            )}
          </Link>
          {post.region && (
            <p className="text-stone-500 text-xs flex items-center gap-1">
              <span>📍</span>
              <span>{post.city || post.region}</span>
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            tap();
            toast.info(t("toast_save_error"));
          }}
          className="text-stone-500 hover:text-gold-500 transition-colors p-2 rounded-full hover:bg-gold-500/5"
          aria-label="More options"
          title={t("toast_save_error")}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Media Container - Photos or Videos */}
      <div
        className={cn(
          "relative bg-black overflow-hidden",
          isHorizontal ? "aspect-video" : "aspect-[4/5] md:aspect-video",
        )}
      >
        {post.type === "video" ? (
          post.mux_playback_id ? (
            <MuxVideoPlayer
              playbackId={post.mux_playback_id}
              thumbnailUrl={
                getProxiedMediaUrl(post.thumbnail_url || post.media_url) ||
                post.thumbnail_url ||
                post.media_url
              }
              className="w-full h-full"
              autoPlay={autoPlay}
              muted={muted}
              loop
            />
          ) : post.processing_status === "pending" || post.processing_status === "processing" ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/80">
              <div className="animate-spin text-3xl mb-3">⚙️</div>
              <p className="text-white/60 text-xs">Traitement vidéo...</p>
              {post.thumbnail_url && (
                <img
                  src={getProxiedMediaUrl(post.thumbnail_url) || post.thumbnail_url}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10"
                />
              )}
            </div>
          ) : (
            <VideoPlayer
              src={getProxiedMediaUrl(post.media_url) || post.media_url}
              poster={
                getProxiedMediaUrl(post.thumbnail_url || post.media_url) ||
                post.thumbnail_url ||
                post.media_url
              }
              autoPlay={autoPlay}
              muted={muted}
              loop
              priority={priority}
            />
          )
        ) : (
          <div className="relative w-full h-full group/media">
            <img
              src={post.media_url}
              alt={post.caption || "Photo"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-105"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
            />
            {/* Photo hover overlay with subtle gold effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* Ephemeral Badge (Fire & Forget) */}
        <EphemeralBadge post={post} />

        {/* Live Viewer Indicator */}
        {viewerCount > 0 && (
          <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse border border-red-400/30">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_white]" />
            <span>{viewerCount} Live</span>
          </div>
        )}

        {/* Video indicator badge */}
        {post.type === "video" && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-white text-xs font-medium">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Vidéo</span>
          </div>
        )}

        {/* Québec Or emblem — top right of video screen, small */}
        {post.type === "video" && (
          <img
            src="/quebec-emblem.png"
            alt="Québec Or"
            className="absolute top-2 right-2 h-6 w-auto object-contain opacity-80 z-10 pointer-events-none"
            width={24}
            height={24}
            loading="lazy"
          />
        )}

        {/* Gold accent lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

        {/* Moderation Overlay (Phase 9) */}
        {post.is_moderated && !post.moderation_approved && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <span className="text-3xl">🛡️</span>
            </div>
            <h3 className="text-red-400 font-bold mb-2 uppercase tracking-widest text-sm">
              Contenu masqué
            </h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Cette publication ne respecte pas les standards de sécurité de
              Zyeuté.
            </p>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div
        className={cn(
          "space-y-3 bg-neutral-900/50",
          isHorizontal ? "p-2 space-y-2" : "p-4 space-y-3",
        )}
      >
        {/* Fire, Comment, Share */}
        <div
          className={cn("flex items-center", isHorizontal ? "gap-2" : "gap-5")}
        >
          <button
            onClick={handleFire}
            className={`flex items-center gap-2 transition-all duration-200 ${
              isLiked
                ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(255,100,0,0.5)] animate-pulse"
                : "text-stone-400 hover:text-gold-500 hover:scale-110 active:scale-95"
            }`}
          >
            <svg
              className="w-7 h-7"
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
              />
            </svg>
            <span className="font-bold text-lg font-mono">{fireCount}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onComment?.(post.id);
            }}
            className="flex items-center gap-2 text-stone-400 hover:text-gold-500 transition-colors"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-bold text-lg font-mono">{commentCount}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(post.id);
            }}
            className="flex items-center gap-2 text-stone-400 hover:text-gold-500 transition-colors"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>

          {/* Gift Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              tap();
              onGift?.(post.id, userToUse);
            }}
            className="flex items-center gap-1.5 text-stone-400 hover:text-gold-500 transition-all hover:scale-110"
            data-testid={`button-gift-${post.id}`}
            title="Envoyer un cadeau"
          >
            <span className="text-xl">{AppConfig.identity.giftEmoji}</span>
            {(post.gift_count ?? 0) > 0 && (
              <span className="font-bold text-sm font-mono text-gold-400">
                {post.gift_count}
              </span>
            )}
          </button>

          <div className="flex-1" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              tap();
              toast.info(t("toast_save_error"));
            }}
            className="text-stone-400 hover:text-gold-500 transition-colors opacity-60 cursor-not-allowed"
            aria-label={t("btn_save")}
            title={t("toast_save_error")}
            disabled
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
        </div>

        {/* Ti-Guy AI Insight */}
        {post.ai_description && (
          <div className="px-4 pb-1">
            <TiGuyInsight
              summary={post.ai_description}
              labels={post.ai_labels || []}
            />
          </div>
        )}

        {/* Promotion Bee - Discount Block */}
        {post.promo_url && (
          <div className="mx-4 mb-3 p-3 bg-stone-900 border border-gold-500/30 rounded-xl flex items-center justify-between shadow-lg">
            <div className="flex flex-col">
              <span className="text-[10px] text-gold-500 uppercase font-bold tracking-widest flex items-center gap-1">
                <span>🐝</span> Bee Discount Found
              </span>
              <span className="text-white text-xs font-semibold">
                Get{" "}
                <span className="text-gold-400">
                  {post.detected_items?.[0] || "this item"}
                </span>{" "}
                for less!
              </span>
            </div>
            <a
              href={post.promo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                tap();
              }}
              className="bg-gold-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-gold-sm"
            >
              SNIFF DEAL
            </a>
          </div>
        )}

        {/* Caption - sanitized for XSS protection */}
        {post.caption && (
          <div
            className={cn(
              "text-stone-300 leading-relaxed",
              isHorizontal ? "text-xs line-clamp-2" : "text-sm",
            )}
          >
            <Link
              to={`/profile/${userToUse.username}`}
              className="font-bold text-gold-400 hover:text-gold-300 mr-2"
            >
              {userToUse.username}
            </Link>
            <InteractiveText text={post.caption} className="text-stone-300" />
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.hashtags.map((tag) => (
              <Link
                key={tag}
                to={`/explore?tag=${tag}`}
                className="text-gold-500/80 hover:text-gold-400 text-xs font-medium transition-colors bg-gold-500/5 px-2 py-1 rounded-md border border-gold-500/10 hover:border-gold-500/30"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-stone-600 text-[10px] uppercase tracking-wider font-medium pt-2">
          {new Date(post.created_at).toLocaleDateString("fr-CA", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};

// Memoize VideoCard to prevent unnecessary re-renders
// Performance optimization: Focus on components that render per post/comment in main feed
// Only re-render if post, user, or callback functions change
// This is critical for infinite scroll/virtualized views performance
export const VideoCard = React.memo(
  VideoCardComponent,
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.fire_count === nextProps.post.fire_count &&
      prevProps.post.is_fired === nextProps.post.is_fired &&
      prevProps.post.ai_description === nextProps.post.ai_description &&
      prevProps.user?.id === nextProps.user?.id &&
      prevProps.variant === nextProps.variant &&
      prevProps.autoPlay === nextProps.autoPlay &&
      prevProps.muted === nextProps.muted &&
      prevProps.onFireToggle === nextProps.onFireToggle &&
      prevProps.onComment === nextProps.onComment &&
      prevProps.onShare === nextProps.onShare &&
      prevProps.onGift === nextProps.onGift &&
      prevProps.post.gift_count === nextProps.post.gift_count
    );
  },
);

export const VideoCardSkeleton: React.FC = () => (
  <div className="leather-card rounded-2xl overflow-hidden stitched w-full animate-pulse">
    <div className="flex items-center gap-3 p-3 border-b border-neutral-800">
      <div className="w-10 h-10 rounded-full bg-neutral-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 bg-neutral-800 rounded" />
        <div className="h-2 w-12 bg-neutral-800 rounded" />
      </div>
    </div>
    <div className="aspect-[4/5] bg-neutral-800" />
    <div className="p-4 space-y-3">
      <div className="flex gap-4">
        <div className="w-8 h-8 rounded bg-neutral-800" />
        <div className="w-8 h-8 rounded bg-neutral-800" />
        <div className="w-8 h-8 rounded bg-neutral-800" />
      </div>
      <div className="h-4 w-full bg-neutral-800 rounded" />
      <div className="h-4 w-2/3 bg-neutral-800 rounded" />
    </div>
  </div>
);

VideoCard.displayName = "VideoCard";

export default VideoCard;
