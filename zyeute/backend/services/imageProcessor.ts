/**
 * Image Processor - Apply visual filters to images using Sharp
 * Mirrors video filter names for consistency across the platform
 */

import sharp from "sharp";
import { logger } from "../utils/logger.js";

const imageProcessorLogger = logger.withContext("ImageProcessor");

// Set Sharp concurrency to prevent CPU contention when multiple workers run
sharp.concurrency(1);

export interface ProcessedImageResult {
  processedBuffer: Buffer;
  width: number;
  height: number;
  format: string;
}

export async function processImage(
  imageBuffer: Buffer,
  filterName?: string,
): Promise<ProcessedImageResult> {
  try {
    let pipeline = sharp(imageBuffer);
    
    // Get image metadata
    const metadata = await pipeline.metadata();
    const width = metadata.width || 1080;
    const height = metadata.height || 1920;

    // Apply filter based on filterName (mirroring video filters)
    switch (filterName) {
      case "prestige":
        // Cinematic look: enhanced colors and contrast
        pipeline = pipeline
          .modulate({ brightness: 1.1, saturation: 1.2 })
          .normalize();
        break;
      
      case "nordic":
        // Cool blue tones with crisp clarity
        pipeline = pipeline
          .tint({ r: 200, g: 220, b: 255 })
          .modulate({ brightness: 1.05, saturation: 1.1 });
        break;
      
      case "quebecois":
        // Warm Quebec atmosphere
        pipeline = pipeline
          .modulate({ brightness: 1.05, saturation: 1.15 })
          .tint({ r: 255, g: 240, b: 220 });
        break;
      
      case "vintage":
        // Retro Montreal aesthetic (sepia)
        pipeline = pipeline.sepia(0.8).modulate({ brightness: 0.95 });
        break;
      
      case "noir":
        // Dark moody atmosphere
        pipeline = pipeline
          .greyscale()
          .modulate({ brightness: 0.9, contrast: 1.3 });
        break;
      
      case "warm":
        // Warm inviting colors
        pipeline = pipeline
          .modulate({ brightness: 1.1, saturation: 1.3 })
          .tint({ r: 255, g: 245, b: 235 });
        break;
      
      case "cool":
        // Winter atmosphere
        pipeline = pipeline
          .tint({ r: 180, g: 200, b: 255 })
          .modulate({ brightness: 1.05, saturation: 0.9 });
        break;
      
      case "bright":
        // Maximum brightness and vibrancy
        pipeline = pipeline
          .modulate({ brightness: 1.2, saturation: 1.4 })
          .normalize();
        break;
      
      default:
        // No filter - just optimize
        pipeline = pipeline.normalize();
    }

    // Convert to optimized format (WebP for better compression)
    const processedBuffer = await pipeline
      .webp({ quality: 90, effort: 4 })
      .toBuffer();

    imageProcessorLogger.info(`Image processed with filter: ${filterName || "none"}`);

    return {
      processedBuffer,
      width,
      height,
      format: "webp",
    };
  } catch (error: any) {
    imageProcessorLogger.error("Image processing error:", error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Generate thumbnail from image
 */
export async function generateImageThumbnail(
  imageBuffer: Buffer,
  size: number = 400,
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(size, size, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer();
}
