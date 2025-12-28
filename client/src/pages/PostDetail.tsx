/**
 * PostDetail Page - Full post view with comments and fire rating
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { FireRating } from '../components/features/FireRating';
import { VideoPlayer } from '../components/features/VideoPlayer';
import { VirtualCommentList } from '../components/features/VirtualCommentList';
import { GiftModal } from '../components/features/GiftModal';
import { supabase } from '../lib/supabase';
import { getPostById } from '../services/api';
import { formatNumber, getTimeAgo } from '../lib/utils';
import { toast } from '../components/Toast';
import type { Post, Comment as CommentType, User } from '../types';
import { logger } from '../lib/logger';
import { PostDetailSkeleton } from '@/components/ui/Skeleton';
import { usePrefetchVideo } from '@/hooks/usePrefetchVideo';
import { Image } from '@/components/Image';

const postDetailLogger = logger.withContext('PostDetail');


export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = React.useState<Post | null>(null);
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [newComment, setNewComment] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = React.useState(false);

  // Fetch current user
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
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
        // Use centralized API function instead of direct query
        const postData = await getPostById(id);
        if (postData) {
          // Fetch fire data separately if needed
          const { data: fireData } = await supabase
            .from('fires')
            .select('fire_level')
            .eq('post_id', id)
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .single();

          setPost({
            ...postData,
            user_fire: fireData ? { 
              fire_level: fireData.fire_level,
              user_id: (await supabase.auth.getUser()).data.user?.id || '',
              post_id: id,
              created_at: new Date().toISOString()
            } : undefined,
          });
        }
      } catch (error) {
        postDetailLogger.error('Error fetching post:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  // Fetch comments
  React.useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;

      const { data } = await supabase
        .from('comments')
        .select('*, user:users(*)')
        .eq('post_id', id)
        .is('parent_id', null) // Only fetch top-level comments
        .order('created_at', { ascending: true });

      if (data) setComments(data);
    };

    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`post_${id}_comments`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${id}`,
        },
        (payload: { new: CommentType }) => {
          setComments(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Handle fire rating
  const handleRate = async (level: number) => {
    if (!currentUser || !post) return;

    const { error } = await supabase
      .from('fires')
      .upsert({
        user_id: currentUser.id,
        post_id: post.id,
        fire_level: level,
      });

    if (!error && post) {
      setPost({ ...post, user_fire: { fire_level: level } as any });
    }
  };

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !currentUser || !post) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: currentUser.id,
          text: newComment.trim(),
        })
        .select('*, user:user_profiles!user_id(*)')
        .single();

      if (error) throw error;

      if (data) {
        // Optimistically add comment to list (realtime might be delayed)
        setComments(prev => [...prev, data as CommentType]);
        setNewComment('');
        // Update post comment count
        if (post) {
          setPost({ ...post, comment_count: (post.comment_count || 0) + 1 });
        }
        toast.success('Commentaire publié! 💬');
      }
    } catch (error) {
      postDetailLogger.error('Error posting comment:', error);
      toast.error('Erreur lors de la publication du commentaire');
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

      <div className="max-w-4xl mx-auto px-4 py-6">
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
                <p className="text-white">{post.caption}</p>
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
                averageRating={post.fire_count / Math.max(1, (post as any).fire_ratings_count || 1)}
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
              className="py-4"
            />

            {/* Comment input */}
            <form onSubmit={handleSubmitComment} className="pt-4 border-t border-white/10">
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
    </div>
  );
};

const PostDetailMedia = ({ post }: { post: Post }) => {
    // Always prefetch full video for detail view (Tier 2)
    const videoUrl = post.type === 'video' ? (post.media_url) : '';
    const { source } = usePrefetchVideo(videoUrl, 2);

    if (post.type === 'video') {
         return (
            <VideoPlayer
                src={post.media_url}
                poster={post.media_url}
                autoPlay={true}
                muted={false}
                loop={true}
                className="w-full h-full"
                priority={true}
                preload="auto"
                videoSource={source}
            />
         );
    }
    
    return (
        <Image
            src={post.media_url}
            alt={post.caption || 'Post'}
            className="w-full h-full object-cover"
            fetchPriority="high"
            loading="eager"
        />
    );
};

export default PostDetail;
