/**
 * Security Utilities
 * Resource-level authorization and data sanitization
 * 
 * Protects sensitive post data (originalUrl, jobId) from unauthorized access
 */

import { storage } from "../storage.js";
import type { Post } from "../../shared/schema.js";

/**
 * Sanitize post data based on ownership
 * Hides sensitive fields (originalUrl, jobId) from non-owners
 */
export function sanitizePostForUser(
  post: Post & { user?: any },
  requestingUserId?: string,
): Partial<Post & { user?: any }> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'security.ts:15',message:'sanitizePostForUser called',data:{postId:post.id,requestingUserId,postUserId:post.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const isOwner = requestingUserId && post.userId === requestingUserId;

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'security.ts:20',message:'Ownership check result',data:{isOwner,hasOriginalUrl:!!post.originalUrl,hasJobId:!!post.jobId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Create a shallow copy to avoid mutating the original
  const sanitized: any = { ...post };

  // Hide sensitive fields from non-owners
  if (!isOwner) {
    delete sanitized.originalUrl;
    delete sanitized.jobId;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'security.ts:28',message:'Sensitive fields removed',data:{originalUrlRemoved:!sanitized.originalUrl,jobIdRemoved:!sanitized.jobId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Keep enhancedUrl and mediaUrl visible (these are the processed/public versions)
  }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'security.ts:32',message:'sanitizePostForUser returning',data:{hasOriginalUrl:!!sanitized.originalUrl,hasJobId:!!sanitized.jobId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return sanitized;
}

/**
 * Sanitize an array of posts efficiently
 * Optimized for feed/explore responses with many posts
 */
export function sanitizePostsForUser(
  posts: (Post & { user?: any })[],
  requestingUserId?: string,
): Partial<Post & { user?: any }>[] {
  return posts.map(post => sanitizePostForUser(post, requestingUserId));
}

/**
 * Verify that a user owns a post
 * Throws error if verification fails
 */
export async function verifyPostOwnership(
  postId: string,
  userId: string,
): Promise<Post> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'security.ts:49',message:'verifyPostOwnership called',data:{postId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const post = await storage.getPost(postId);

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'security.ts:53',message:'Post fetched from DB',data:{postFound:!!post,postUserId:post?.userId,requestingUserId:userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  if (!post) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'security.ts:56',message:'Post not found error',data:{postId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw new Error("Post not found");
  }

  if (post.userId !== userId) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'security.ts:60',message:'Ownership mismatch - unauthorized',data:{postUserId:post.userId,requestingUserId:userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw new Error("Unauthorized: You do not own this post");
  }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/0d128d48-02d4-4bda-a46f-00b55ffbc551',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'security.ts:65',message:'Ownership verified successfully',data:{postId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  return post;
}

/**
 * Check if user owns a post (non-throwing version)
 */
export async function checkPostOwnership(
  postId: string,
  userId: string,
): Promise<boolean> {
  try {
    await verifyPostOwnership(postId, userId);
    return true;
  } catch {
    return false;
  }
}
