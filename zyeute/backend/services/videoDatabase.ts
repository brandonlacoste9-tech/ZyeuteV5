import { db } from "../storage.js";
import { posts, users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export async function updatePostStatus(
  postId: string,
  status: "processing" | "completed" | "failed",
): Promise<void> {
  await db
    .update(posts)
    .set({ processingStatus: status })
    .where(eq(posts.id, postId));
}

export async function saveVideoUrls(
  postId: string,
  urls: {
    videoHighUrl: string;
    videoMediumUrl: string;
    videoLowUrl: string;
    thumbnailUrl: string;
  },
): Promise<void> {
  // First, get the current post to preserve originalUrl
  const [currentPost] = await db
    .select({ originalUrl: posts.originalUrl, mediaUrl: posts.mediaUrl })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  await db
    .update(posts)
    .set({
      mediaUrl: urls.videoHighUrl,
      enhancedUrl: urls.videoHighUrl, // Store enhanced URL separately
      originalUrl: currentPost?.originalUrl || currentPost?.mediaUrl, // Preserve original
      thumbnailUrl: urls.thumbnailUrl,
      processingStatus: "completed",
    })
    .where(eq(posts.id, postId));
}
export async function isTiGuyCommentEnabled(userId: string): Promise<boolean> {
  const result = await db
    .select({ enabled: users.tiGuyCommentsEnabled })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0]?.enabled ?? true;
}
