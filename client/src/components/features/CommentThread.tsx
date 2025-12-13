/**
 * CommentThread - Nested comment replies component
 */

import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { supabase } from '../../lib/supabase';
import { toast } from '../Toast';
import { moderateContent } from '../../services/moderationService';
import { getTimeAgo, formatNumber } from '../../lib/utils';
import { validateComment, sanitizeText } from '../../lib/validation';
import { checkRateLimit, RATE_LIMITS } from '../../lib/rateLimiter';
import type { Comment as CommentType, User } from '../../types';
import { logger } from '../../lib/logger';

const commentThreadLogger = logger.withContext('CommentThread');


interface CommentThreadProps {
  comment: CommentType;
  postId: string;
  currentUser: User | null;
  onReply?: (parentId: string, text: string) => Promise<void>;
  depth?: number;
  maxDepth?: number;
}

const CommentThreadComponent: React.FC<CommentThreadProps> = ({
  comment,
  postId,
  currentUser,
  onReply,
  depth = 0,
  maxDepth = 3,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replies, setReplies] = useState<CommentType[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(0);
  const [likes, setLikes] = useState(comment.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);

  // Fetch replies
  React.useEffect(() => {
    const fetchReplies = async () => {
      if (!showReplies) return;

      const { data, error } = await supabase
        .from('comments')
        .select('*, user:user_profiles!user_id(*)')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      if (error) {
        commentThreadLogger.error('Error fetching replies:', error);
        return;
      }

      if (data) {
        setReplies(data);
        setReplyCount(data.length);
      }
    };

    fetchReplies();
  }, [comment.id, showReplies]);

  // Get reply count on mount
  React.useEffect(() => {
    const getReplyCount = async () => {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', comment.id);

      if (!error && count !== null) {
        setReplyCount(count);
      }
    };

    getReplyCount();
  }, [comment.id]);

  // Handle submit reply
  const handleSubmitReply = async () => {
    if (!replyText.trim() || !currentUser) return;

    // Rate limiting - prevent spam
    if (!checkRateLimit(`comment-${currentUser.id}`, RATE_LIMITS.COMMENT_CREATE)) {
      return;
    }

    // Validate input before processing
    const validation = validateComment(replyText);
    if (!validation.valid) {
      toast.error(validation.error || 'Commentaire invalide');
      return;
    }

    // Sanitize input
    const sanitizedText = sanitizeText(replyText.trim());

    setIsSubmitting(true);
    try {
      // AI Moderation Check
      const moderationResult = await moderateContent(
        { text: sanitizedText },
        'comment',
        currentUser.id
      );

      // Block if violation
      if (moderationResult.action === 'ban' || moderationResult.action === 'remove') {
        toast.error(`❌ ${moderationResult.reason}`);
        toast.warning('Ton commentaire viole nos directives');
        setIsSubmitting(false);
        return;
      }

      if (moderationResult.action === 'flag') {
        toast.warning('⚠️ Ton commentaire sera révisé');
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          text: sanitizedText,
          parent_id: comment.id,
        } as any)
        .select('*, user:user_profiles!user_id(*)')
        .single() as { data: CommentType | null; error: any };

      if (error) throw error;

      if (data) {
        // Log moderation with content ID
        await moderateContent(
          { text: sanitizedText },
          'comment',
          currentUser.id,
          data.id
        );

        setReplies([...replies, data as CommentType]);
        setReplyCount(replyCount + 1);
        setReplyText('');
        setIsReplying(false);
        setShowReplies(true);
        toast.success('Réponse ajoutée! 💬');
        onReply?.(comment.id, replyText);
      }
    } catch (error) {
      commentThreadLogger.error('Error posting reply:', error);
      toast.error('Erreur lors de la réponse');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle like comment
  const handleLike = async () => {
    if (!currentUser) return;

    setHasLiked(!hasLiked);
    setLikes(hasLiked ? likes - 1 : likes + 1);

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', currentUser.id);
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: currentUser.id,
          } as any);
      }
    } catch (error) {
      commentThreadLogger.error('Error liking comment:', error);
      // Revert optimistic update
      setHasLiked(!hasLiked);
      setLikes(hasLiked ? likes + 1 : likes - 1);
    }
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-8' : ''}`}>
      {/* Avatar */}
      {comment.user && (
        <Avatar
          src={comment.user.avatar_url}
          size="sm"
          isVerified={comment.user.is_verified}
          className="flex-shrink-0"
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Author and timestamp */}
        <div className="flex items-center gap-2 mb-1">
          {comment.user && (
            <span className="text-white font-semibold text-sm">
              {comment.user.display_name || comment.user.username}
            </span>
          )}
          <span className="text-white/40 text-xs">
            {getTimeAgo(new Date(comment.created_at))}
          </span>
        </div>

        {/* Comment text - sanitized for XSS protection */}
        <p 
          className="text-white text-sm mb-2 break-words"
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(comment.content || comment.text || '', {
              ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
              ALLOWED_ATTR: []
            })
          }}
        />

        {/* Actions */}
        <div className="flex items-center gap-4 text-xs">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${
              hasLiked ? 'text-gold-400' : 'text-white/60 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {likes > 0 && <span>{formatNumber(likes)}</span>}
          </button>

          {/* Reply button */}
          {depth < maxDepth && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-white/60 hover:text-white transition-colors"
            >
              Répondre
            </button>
          )}

          {/* Show replies button */}
          {replyCount > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-gold-400 hover:underline"
            >
              {showReplies ? 'Masquer' : `${replyCount} réponse${replyCount > 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Ta réponse..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-gold-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitReply();
                }
                if (e.key === 'Escape') {
                  setIsReplying(false);
                }
              }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitReply}
              isLoading={isSubmitting}
              disabled={!replyText.trim()}
            >
              ✓
            </Button>
          </div>
        )}

        {/* Nested replies */}
        {showReplies && replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {replies.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                postId={postId}
                currentUser={currentUser}
                onReply={onReply}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize CommentThread to prevent unnecessary re-renders in feed
// Performance optimization: Focus on components that render per post/comment
export const CommentThread = React.memo(CommentThreadComponent, (prevProps, nextProps) => {
  // Custom comparison - only re-render if comment data or user changes
  return (
    prevProps.comment.id === nextProps.comment.id &&
    prevProps.comment.likes === nextProps.comment.likes &&
    prevProps.comment.text === nextProps.comment.text &&
    prevProps.currentUser?.id === nextProps.currentUser?.id &&
    prevProps.postId === nextProps.postId &&
    prevProps.depth === nextProps.depth &&
    prevProps.onReply === nextProps.onReply
  );
});

CommentThread.displayName = 'CommentThread';

export default CommentThread;

