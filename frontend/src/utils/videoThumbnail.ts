/**
 * Video Thumbnail Generator
 * Generates a client-side thumbnail from a video file using Canvas API
 */

export async function generateVideoThumbnail(
  file: File,
  seekTime: number = 1,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a video element to load the file
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      // Set to seek time
      video.currentTime = Math.min(seekTime, video.duration);
    };

    video.onseeked = () => {
      // Create canvas and draw the frame
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

      // Cleanup
      URL.revokeObjectURL(url);
      video.remove();
      canvas.remove();

      resolve(dataUrl);
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
  });
}
