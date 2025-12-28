import { db } from "../storage.js";
import { posts, users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export async function updatePostStatus(
  postId: string,
  status: 'processing' | 'completed' | 'failed'
): Promise<void> {
  await db.update(posts)
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
  }
): Promise<void> {
    
    await db.update(posts)
        .set({ 
            mediaUrl: urls.videoHighUrl,
            // Original URL is kept as backup or previously set
            // In future, we can add columns for resolutions if schema migration is possible
            processingStatus: 'completed',
        })
        .where(eq(posts.id, postId));
}
export async function isTiGuyCommentEnabled(userId: string): Promise<boolean> {
  const result = await db.select({ enabled: users.tiGuyCommentsEnabled })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    
  return result[0]?.enabled ?? true;
}
