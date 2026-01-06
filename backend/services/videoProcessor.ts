import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import os from "os";

export interface VideoProcessingJob {
  videoUrl: string;
  userId: string;
  postId: string;
  visual_filter?: string;
}

export interface ProcessedVideoResult {
  videoHigh: string;
  videoMedium: string;
  videoLow: string;
  thumbnail: string;
}

interface TranscodeOptions {
  width: number;
  height: number;
  bitrate: string;
}

const TEMP_DIR = path.join(os.tmpdir(), "zyeute_processing");

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export async function downloadVideo(url: string): Promise<string> {
  const filename = `${uuidv4()}.mp4`;
  const filePath = path.join(TEMP_DIR, filename);

  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    timeout: 30000, // 30s timeout
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });
}

export async function validateVideo(filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const format = metadata.format;
      // Check file size (approx check via format.size)
      if (format.size && format.size > 100 * 1024 * 1024) {
        // 100MB
        return reject(new Error("File too large (max 100MB)"));
      }

      // Check duration
      if (format.duration && (format.duration < 3 || format.duration > 180)) {
        return reject(new Error("Duration must be between 3 and 180 seconds"));
      }

      resolve(true);
    });
  });
}

async function transcodeVideo(
  inputPath: string,
  outputPath: string,
  options: TranscodeOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec("libx264")
      .size(`${options.width}x${options.height}`)
      .videoBitrate(options.bitrate)
      .audioCodec("aac")
      .audioBitrate("128k")
      .autopad(true, "black") // Force aspect ratio with padding
      .fps(30)
      .preset("fast")
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

async function applyFilter(
  inputPath: string,
  outputPath: string,
  filterName?: string,
): Promise<void> {
  if (!filterName || filterName === "none") {
    await fs.promises.copyFile(inputPath, outputPath);
    return;
  }

  const videoFilters: string[] = [];

  switch (filterName) {
    case "vintage": // Sepia + Vignette
      videoFilters.push(
        "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
      );
      videoFilters.push("vignette");
      break;
    case "bright":
      videoFilters.push("eq=brightness=0.06:saturation=1.5");
      break;
    case "noir":
      videoFilters.push("hue=s=0");
      videoFilters.push("eq=contrast=1.5");
      break;
    case "warm":
      videoFilters.push("colorbalance=rs=.3");
      break;
    case "cool":
      videoFilters.push("colorbalance=bs=.3");
      break;
    // QC filters
    case "quebecois":
      videoFilters.push("colorbalance=bs=.4:gs=.1");
      break;
    default:
      await fs.promises.copyFile(inputPath, outputPath);
      return;
  }

  if (videoFilters.length === 0) {
    await fs.promises.copyFile(inputPath, outputPath);
    return;
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoFilters(videoFilters)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

export async function generateThumbnail(
  videoPath: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [1], // 1 second mark
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: "360x640",
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });
}

export async function processVideo(
  job: VideoProcessingJob,
): Promise<ProcessedVideoResult> {
  const { videoUrl, visual_filter, postId } = job;

  // 1. Download
  const rawInputPath = await downloadVideo(videoUrl);

  try {
    // 2. Validate
    await validateVideo(rawInputPath);

    const baseDir = path.dirname(rawInputPath);
    const id = uuidv4();
    const highPath = path.join(baseDir, `${id}_high.mp4`);
    const mediumPath = path.join(baseDir, `${id}_med.mp4`);
    const lowPath = path.join(baseDir, `${id}_low.mp4`);
    const thumbPath = path.join(baseDir, `${id}_thumb.jpg`);

    const masterPath = path.join(baseDir, `${id}_master.mp4`);

    // Transcode to Master High Quality
    await transcodeVideo(rawInputPath, masterPath, {
      width: 1080,
      height: 1920,
      bitrate: "5000k",
    });

    // Apply Filter to Master
    const filteredMasterPath = path.join(baseDir, `${id}_filtered.mp4`);
    await applyFilter(masterPath, filteredMasterPath, visual_filter);

    // Copy filtered master to highPath
    await fs.promises.copyFile(filteredMasterPath, highPath);

    // Transcode Medium from High
    await transcodeVideo(highPath, mediumPath, {
      width: 720,
      height: 1280,
      bitrate: "2500k",
    });

    // Transcode Low from High
    await transcodeVideo(highPath, lowPath, {
      width: 480,
      height: 854,
      bitrate: "1000k",
    });

    // Thumbnail
    await generateThumbnail(highPath, thumbPath);

    // Cleanup intermediates
    const toDelete = [rawInputPath, masterPath, filteredMasterPath];
    for (const f of toDelete) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    }

    return {
      videoHigh: highPath,
      videoMedium: mediumPath,
      videoLow: lowPath,
      thumbnail: thumbPath,
    };
  } catch (error) {
    if (fs.existsSync(rawInputPath)) fs.unlinkSync(rawInputPath);
    throw error;
  }
}
