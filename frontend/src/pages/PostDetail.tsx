/**
 * PostDetail Page - Full post view with comments and fire rating
 * FIXED: Wrong table names (fires→reactions, comments→commentaires)
 *        Wrong column names (post_id→publication_id, text→content, fire_level→type)
 *        Wrong relation join (user:users→user:user_profiles!user_id)
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { FireRating } from "../components/features/FireRating";
import { VideoPlayer } from "../components/features/VideoPlayer";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { VirtualCommentList } from "../components/features/VirtualCommentList";
import { GiftModal } from "../components/features/GiftModal";
import { supabase } from "../lib/supabase";
import { getPostById } from "../services/api";
import { formatNumber, getTimeAgo } from "../lib/utils";
import { toast } from "../components/Toast";
import type { Post, Comment as CommentType, User } from "../types";
import { logger } from "../lib/logger";
import { PostDetailSkeleton } from "@/components/ui/Skeleton";
import { usePrefetchVideo } from "@/hooks/usePrefetchVideo";
import { Image } from "@/components/Image";
import { InteractiveText } from "@/components/InteractiveText";
import VideoDebugOverlay from "@/components/video/VideoDebugOverlay";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";
import { useOpenGraph } from "@/hooks/useOpenGraph";

const postDetailLogger = logger.withContext("PostDetail");

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = React.useState<Post | null>(null);
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [newComment, setNewComment] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = React.useState(false);

  useOpenGraph(post);

  // Fetch current user
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) setCurrentUser(data);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch post
  React.useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const postData = await getPostById(id);
        if (postData) {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();

          // Check if current user already reacted to this post
          // reactions table: publication_id (not post_id), type (not fire_level)
          const { data: reactionData } = authUser
            ? await supabase
                .from("reactions")
                .select("type")
                .eq("publication_id", id)
                .eq("user_id", authUser.id)
                .is("deleted_at", null)
                .maybeSingle()
            : { data: null };

          setPost({
            ...postData,
            user_fire: reactionData
              ? {
                  fire_level: 1, // reactions table doesn't store fire_level, just presence
                  user_id: authUser?.id || "",
                  post_id: id,
                  created_at: new Date().toISOString(),
                }
              : undefined,
          });
        }
      } catch (error) {
        postDetailLogger.error("Error fetching post:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  // Fetch comments from commentaires table
  React.useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;

      // commentaires table: publication_id (not post_id), content (not text)
      // no parent_id column — fetch all top-level comments
      const { data } = await supabase
        .from("commentaires")
        .select("*, user:user_profiles!user_id(*)")
        .eq("publication_id", id)
        .order("created_at", { ascending: true });

      if (data) setComments(data as unknown as CommentType[]);
    };

    fetchComments();

    // Subscribe to new comments on the commentaires table
    const channel = supabase
      .channel(`post_${id}_comments`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "commentaires",
          filter: `publication_id=eq.${id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          setComments((prev) => [
            ...prev,
            payload.new as unknown as CommentType,
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Handle fire rating — upsert into reactions table
  const handleRate = async (_level: number) => {
    if (!currentUser || !post) return;

    // reactions table uses: publication_id, user_id, type
    const { error } = await supabase.from("reactions").upsert(
      {
        publication_id: post.id,
        user_id: currentUser.id,
        type: "fire",
      },
      { onConflict: "publication_id,user_id" },
    );

    if (!error && post) {
      setPost({
        ...post,
        user_fire: {
          fire_level: 1,
          user_id: currentUser.id,
          post_id: post.id,
          created_at: new Date().toISOString(),
        },
      });
    }
  };

  // Handle comment submission — insert into commentaires table
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !currentUser || !post) return;

    setIsSubmitting(true);
    try {
      // commentaires columns: publication_id, user_id, content
      const { data, error } = await supabase
        .from("commentaires")
        .insert({
          publication_id: post.id,
          user_id: currentUser.id,
          content: newComment.trim(),
        })
        .select("*, user:user_profiles!user_id(*)")
        .single();

      if (error) throw error;

      if (data) {
        setComments((prev) => [...prev, data as unknown as CommentType]);
        setNewComment("");
        // Update post comment count
        setPost((p) =>
          p ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p,
        );
        toast.success("Commentaire publié! 💬");
      }
    } catch (error) {
      postDetailLogger.error("Error posting comment:", error);
      toast.error("Erreur lors de la publication du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !post) {
    return <PostDetailSkeleton />;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header showBack={true} />

      <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Media */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-900 edge-glow">
            <PostDetailMedia post={post} />
          </div>

          {/* Content */}
          <div className="flex flex-col">
            {/* Author */}
            {post.user && (
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <Avatar
                  src={post.user.avatar_url}
                  size="md"
                  isVerified={post.user.is_verified}
                  userId={post.user.id}
                />
                <div className="flex-1">
                  <p className="text-white font-semibold">
                    {post.user.display_name || post.user.username}
                  </p>
                  <p className="text-white/60 text-sm">
                    {getTimeAgo(new Date(post.created_at))}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Suivre
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsGiftModalOpen(true)}
                  >
                    🎁
                  </Button>
                </div>
              </div>
            )}

            {/* Caption */}
            {post.caption && (
              <div className="py-4 border-b border-white/10">
                <InteractiveText text={post.caption} className="text-white" />
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="text-gold-400 text-sm hover:underline cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fire Rating */}
            <div className="py-4 border-b border-white/10">
              <FireRating
                postId={post.id}
                currentRating={post.user_fire?.fire_level || 0}
                averageRating={
                  post.fire_count /
                  Math.max(1, (post as any).fire_ratings_count || 1)
                }
                totalRatings={(post as any).fire_ratings_count || 0}
                onRate={handleRate}
                size="lg"
              />
              <p className="text-white/60 text-sm mt-2">
                {formatNumber(post.fire_count)} feux au total
              </p>
            </div>

            {/* Comments */}
            <VirtualCommentList
              comments={comments}
              postId={id!}
              currentUser={currentUser}
              className="py-4 max-h-72 overflow-y-auto"
            />

            {/* Comment input */}
            <form
              onSubmit={handleSubmitComment}
              className="sticky bottom-0 bg-black/90 backdrop-blur-sm border-t border-white/10 pt-3 pb-3 z-10"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ajoute un commentaire..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-gold-400"
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={!newComment.trim()}
                >
                  Publier
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Gift Modal */}
      {post?.user && (
        <GiftModal
          recipient={post.user}
          postId={post.id}
          isOpen={isGiftModalOpen}
          onClose={() => setIsGiftModalOpen(false)}
        />
      )}

      <BottomNav />
    </div>
  );
};

const PostDetailMedia = ({ post }: { post: Post }) => {
  // Hooks must be called unconditionally at the top of the component
  // For Mux videos these will be empty strings and the hook will be a no-op
  const proxiedVideo =
    post.type === "video" && !post.mux_playback_id
      ? getProxiedMediaUrl(post.media_url) || post.media_url
      : "";
  const proxiedPoster =
    getProxiedMediaUrl(post.thumbnail_url || undefined) || post.thumbnail_url;
  const { source } = usePrefetchVideo(proxiedVideo, 2);

  // --- Mux videos: use MuxVideoPlayer directly (handles its own HLS streaming)
  if (post.type === "video" && post.mux_playback_id) {
    return (
      <div className="relative w-full h-full bg-black">
        <MuxVideoPlayer
          playbackId={post.mux_playback_id}
          thumbnailUrl={post.thumbnail_url || undefined}
          className="w-full h-full"
          autoPlay={true}
          muted={false}
          loop={true}
        />
        <VideoDebugOverlay
          isVisible={false}
          videoId={post.id}
          mediaUrl={post.media_url}
          thumbnailUrl={post.thumbnail_url}
        />
      </div>
    );
  }

  if (post.type === "video") {
    return (
      <div className="relative w-full h-full bg-black">
        <VideoPlayer
          src={proxiedVideo}
          poster={proxiedPoster || undefined}
          autoPlay={true}
          muted={false}
          loop={true}
          className="w-full h-full"
          priority={true}
          preload="auto"
          videoSource={source}
        />
        <VideoDebugOverlay
          isVisible={false}
          videoId={post.id}
          mediaUrl={post.media_url}
          thumbnailUrl={post.thumbnail_url}
        />
      </div>
    );
  }

  return (
    <Image
      src={post.media_url}
      alt={post.caption || "Post"}
      className="w-full h-full object-cover"
      fetchPriority="high"
      loading="eager"
    />
  );
};

export default PostDetail;
