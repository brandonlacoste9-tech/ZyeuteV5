/**
 * CommentBottomSheet — TikTok-style comment panel
 * - Mobile: slides up from the bottom (drag-to-dismiss)
 * - Desktop (≥1024px): right-side fixed panel, video stays visible
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { getPostComments, addComment } from "@/services/api";
import { triggerBadgeCheck } from "@/services/gamificationService";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Comment, User } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface CommentBottomSheetProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  commentCount?: number;
}

/** Returns true if we're on a desktop-sized viewport (≥1024px). */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export const CommentBottomSheet: React.FC<CommentBottomSheetProps> = ({
  postId,
  isOpen,
  onClose,
  commentCount = 0,
}) => {
  const { user: currentUser } = useAuth();
  const isDesktop = useIsDesktop();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  // Fetch comments when opened
  useEffect(() => {
    if (!isOpen || !postId) return;

    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const data = await getPostComments(postId);
        setComments(data || []);
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [isOpen, postId]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!newComment.trim() || isSending) return;

    setIsSending(true);
    try {
      const comment = await addComment(postId, newComment.trim());
      if (comment) {
        // Ensure user is populated for immediate display — backend may return
        // null on a race condition; fall back to the auth context user.
        const commentWithUser = (comment as any).user
          ? comment
          : {
              ...comment,
              user: currentUser
                ? {
                    id: currentUser.id,
                    username: currentUser.username,
                    display_name: currentUser.display_name,
                    avatar_url: currentUser.avatar_url,
                    username_color:
                      (currentUser as any).username_color ?? "#FFFFFF",
                  }
                : null,
            };
        setComments((prev) => [...prev, commentWithUser as any]);
        setNewComment("");
        // Fire-and-forget badge check
        triggerBadgeCheck("comment_created").catch(() => {});
        // Scroll to bottom
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSending(false);
    }
  }, [newComment, postId, isSending]);

  // Drag handlers for swipe-to-dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow drag from the handle area (top 50px of the sheet)
    const touch = e.touches[0];
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeY = touch.clientY - rect.top;
    if (relativeY > 50) return; // Only drag from handle

    dragStartY.current = touch.clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const delta = e.touches[0].clientY - dragStartY.current;
      if (delta > 0) {
        setDragY(delta);
      }
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    // If dragged more than 120px, dismiss
    if (dragY > 120) {
      onClose();
    }
    setDragY(0);
  }, [isDragging, dragY, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Desktop: right-side fixed panel ──────────────────────────────────────
  if (isDesktop) {
    return (
      <>
        {/* Light backdrop — doesn't cover the video fully */}
        <div
          className="fixed inset-0 z-[60]"
          onClick={onClose}
          style={{ background: "rgba(0,0,0,0.25)" }}
        />

        {/* Right Panel */}
        <div
          className={cn(
            "fixed right-0 top-0 bottom-0 z-[61]",
            "w-96 bg-neutral-900 border-l border-white/10",
            "flex flex-col",
            "shadow-2xl",
          )}
          style={{
            animation: "slideInRight 0.25s ease-out",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-none">
            <h3 className="text-white font-bold text-base">
              {comments.length || commentCount} commentaire
              {(comments.length || commentCount) !== 1 ? "s" : ""}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-white/70" />
            </button>
          </div>

          {/* Comments List */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-white/40 text-sm">Chargement...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-3xl mb-2">💬</span>
                <p className="text-white/50 text-sm">Pas encore de commentaires.</p>
                <p className="text-white/30 text-xs mt-1">Sois le premier à commenter!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar
                    src={(comment as any).user?.avatar_url}
                    alt={(comment as any).user?.username || "Utilisateur"}
                    size="sm"
                    className="flex-shrink-0 mt-0.5"
                    userId={(comment as any).user?.id}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-semibold text-sm"
                        style={{
                          color:
                            (comment as any).user?.username_color &&
                            (comment as any).user?.username_color !== "#FFFFFF"
                              ? (comment as any).user.username_color
                              : "#ffffff",
                        }}
                      >
                        {(comment as any).user?.display_name ||
                          (comment as any).user?.username ||
                          "Anonyme"}
                      </span>
                      <span className="text-white/30 text-xs">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm mt-0.5 break-words">
                      {comment.content || (comment as any).text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-white/10 bg-neutral-900/95 backdrop-blur-sm flex-none">
            {currentUser && (
              <Avatar
                src={currentUser.avatar_url}
                alt="Toi"
                size="sm"
                className="flex-shrink-0"
                userId={currentUser.id}
              />
            )}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  currentUser
                    ? "Ajoute un commentaire..."
                    : "Connecte-toi pour commenter"
                }
                disabled={!currentUser}
                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-white text-sm placeholder-white/40 focus:outline-none focus:border-gold-400/50 transition-colors disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSending || !currentUser}
              className={cn(
                "p-2.5 rounded-full transition-all",
                newComment.trim() && currentUser
                  ? "bg-gold-500 text-black hover:bg-gold-400"
                  : "bg-white/5 text-white/30",
              )}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to   { transform: translateX(0); }
          }
        `}</style>
      </>
    );
  }

  // ── Mobile: bottom sheet ─────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300"
        onClick={onClose}
        style={{ opacity: isDragging ? 1 - dragY / 400 : 1 }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed left-0 right-0 bottom-0 z-[61]",
          "bg-neutral-900 rounded-t-2xl",
          "flex flex-col",
          "max-h-[60vh] min-h-[40vh]",
          "transition-transform duration-300 ease-out",
          !isDragging && "animate-slide-up",
        )}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle Bar */}
        <div className="flex items-center justify-center pt-3 pb-1 cursor-grab">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <h3 className="text-white font-bold text-base">
            {comments.length || commentCount} commentaire
            {(comments.length || commentCount) !== 1 ? "s" : ""}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-white/70" />
          </button>
        </div>

        {/* Comments List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white/40 text-sm">Chargement...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-3xl mb-2">💬</span>
              <p className="text-white/50 text-sm">
                Pas encore de commentaires.
              </p>
              <p className="text-white/30 text-xs mt-1">
                Sois le premier à commenter!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar
                  src={(comment as any).user?.avatar_url}
                  alt={(comment as any).user?.username || "Utilisateur"}
                  size="sm"
                  className="flex-shrink-0 mt-0.5"
                  userId={(comment as any).user?.id}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-semibold text-sm"
                      style={{
                        color:
                          (comment as any).user?.username_color &&
                          (comment as any).user?.username_color !== "#FFFFFF"
                            ? (comment as any).user.username_color
                            : "#ffffff",
                      }}
                    >
                      {(comment as any).user?.display_name ||
                        (comment as any).user?.username ||
                        "Anonyme"}
                    </span>
                    <span className="text-white/30 text-xs">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <p className="text-white/90 text-sm mt-0.5 break-words">
                    {comment.content || (comment as any).text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-white/10 bg-neutral-900/95 backdrop-blur-sm">
          {currentUser && (
            <Avatar
              src={currentUser.avatar_url}
              alt="Toi"
              size="sm"
              className="flex-shrink-0"
              userId={currentUser.id}
            />
          )}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                currentUser
                  ? "Ajoute un commentaire..."
                  : "Connecte-toi pour commenter"
              }
              disabled={!currentUser}
              className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-white text-sm placeholder-white/40 focus:outline-none focus:border-gold-400/50 transition-colors disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSending || !currentUser}
            className={cn(
              "p-2.5 rounded-full transition-all",
              newComment.trim() && currentUser
                ? "bg-gold-500 text-black hover:bg-gold-400"
                : "bg-white/5 text-white/30",
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

export default CommentBottomSheet;
