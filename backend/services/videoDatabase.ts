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
    hlsUrl?: string;
  },
): Promise<void> {
  const set: Record<string, unknown> = {
    mediaUrl: urls.videoHighUrl,
    processingStatus: "completed",
  };
  if (urls.hlsUrl) set.hlsUrl = urls.hlsUrl;
  if (urls.thumbnailUrl) set.thumbnailUrl = urls.thumbnailUrl;

  await db.update(posts).set(set).where(eq(posts.id, postId));
}

export async function saveHLSUrls(
  postId: string,
  urls: { hlsUrl: string; thumbnailUrl: string },
): Promise<void> {
  await db
    .update(posts)
    .set({
      hlsUrl: urls.hlsUrl,
      thumbnailUrl: urls.thumbnailUrl,
      mediaUrl: urls.hlsUrl, // Fallback: HLS manifest as primary playable URL
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
