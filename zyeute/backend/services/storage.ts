import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";

const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE,
  projectId: process.env.GCS_PROJECT_ID,
});

const bucketName = process.env.GCS_BUCKET_NAME || "zyeute-videos";
const bucket = storage.bucket(bucketName);

export interface StorageUrls {
  videoHighUrl: string;
  videoMediumUrl: string;
  videoLowUrl: string;
  thumbnailUrl: string;
}

export interface ProcessedVideoFiles {
  videoHigh: string;
  videoMedium: string;
  videoLow: string;
  thumbnail: string;
}

export async function uploadToStorage(
  localPath: string,
  destination: string,
  contentType: string,
): Promise<string> {
  try {
    const [file] = await bucket.upload(localPath, {
      destination,
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000", // 1 year
      },
    });

    await file.makePublic();

    // Delete local file after successful upload
    try {
      await fs.promises.unlink(localPath);
    } catch (e) {
      console.warn(`Failed to delete local file ${localPath}:`, e);
    }

    return `https://storage.googleapis.com/${bucketName}/${destination}`;
  } catch (error) {
    console.error(`Failed to upload ${localPath} to ${destination}:`, error);
    throw error;
  }
}

export async function uploadProcessedVideo(
  files: ProcessedVideoFiles,
  postId: string | number,
): Promise<StorageUrls> {
  const timestamp = Date.now();
  const basePath = `posts/${postId}/${timestamp}`;

  const [videoHighUrl, videoMediumUrl, videoLowUrl, thumbnailUrl] =
    await Promise.all([
      uploadToStorage(files.videoHigh, `${basePath}/high.mp4`, "video/mp4"),
      uploadToStorage(files.videoMedium, `${basePath}/medium.mp4`, "video/mp4"),
      uploadToStorage(files.videoLow, `${basePath}/low.mp4`, "video/mp4"),
      uploadToStorage(
        files.thumbnail,
        `${basePath}/thumbnail.jpg`,
        "image/jpeg",
      ),
    ]);

  return {
    videoHighUrl,
    videoMediumUrl,
    videoLowUrl,
    thumbnailUrl,
  };
}

export async function deleteVideo(videoUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    // URL format: https://storage.googleapis.com/BUCKET_NAME/PATH/TO/FILE
    const urlParts = new URL(videoUrl);
    const pathParts = urlParts.pathname.split("/").slice(2); // Remove leading slash and bucket name
    const filePath = pathParts.join("/");

    if (!filePath) return;

    await bucket.file(filePath).delete();
  } catch (error) {
    console.error(`Failed to delete video ${videoUrl}:`, error);
    // Don't throw, just log
  }
}
