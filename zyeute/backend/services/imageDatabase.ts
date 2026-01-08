import { db } from "./storage.js";
import { posts } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export async function saveImageUrls(
  postId: string,
  urls: {
    processedUrl: string;
    thumbnailUrl: string;
    width: number;
    height: number;
  },
): Promise<void> {
  // Get current post to preserve originalUrl
  const [currentPost] = await db
    .select({ originalUrl: posts.originalUrl, mediaUrl: posts.mediaUrl })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  await db
    .update(posts)
    .set({
      mediaUrl: urls.processedUrl,
      enhancedUrl: urls.processedUrl,
      originalUrl: currentPost?.originalUrl || currentPost?.mediaUrl, // Preserve original
      thumbnailUrl: urls.thumbnailUrl,
      processingStatus: "completed",
      mediaMetadata: {
        width: urls.width,
        height: urls.height,
      },
    })
    .where(eq(posts.id, postId));
}
