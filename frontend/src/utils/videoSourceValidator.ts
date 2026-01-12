/**
 * Video Source Validator - Diagnostic tool for debugging video playback issues
 * 
 * This utility helps identify:
 * - CSP violations
 * - Invalid video URLs
 * - LFS pointer files (130 bytes)
 * - Network connectivity issues
 * - CORS problems
 */

import { logger } from "@/lib/logger";

const validatorLogger = logger.withContext("VideoSourceValidator");

// Constants for video validation
const LFS_POINTER_MAX_SIZE = 200; // LFS pointer files are typically ~130 bytes

// Network Information API types
interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

/**
 * Safely checks if a hostname belongs to a specific domain
 * Prevents incomplete URL substring sanitization vulnerabilities
 */
function isValidDomain(hostname: string, domain: string): boolean {
  // Exact match
  if (hostname === domain) {
    return true;
  }
  // Subdomain match (must end with .domain)
  if (hostname.endsWith(`.${domain}`)) {
    return true;
  }
  return false;
}

export interface VideoSourceValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  details: {
    url: string;
    isValidUrl: boolean;
    domain: string | null;
    isPexels: boolean;
    isMux: boolean;
    isLocal: boolean;
    isBlob: boolean;
    estimatedSize?: number;
  };
}

/**
 * Validates a video source URL and checks for common issues
 */
export async function validateVideoSource(
  src: string
): Promise<VideoSourceValidationResult> {
  const result: VideoSourceValidationResult = {
    isValid: true,
    issues: [],
    warnings: [],
    details: {
      url: src,
      isValidUrl: false,
      domain: null,
      isPexels: false,
      isMux: false,
      isLocal: false,
      isBlob: false,
    },
  };

  // Check if URL is valid
  try {
    const url = new URL(src);
    result.details.isValidUrl = true;
    result.details.domain = url.hostname;

    // Check for Pexels domains (secure subdomain validation)
    if (
      isValidDomain(url.hostname, "pexels.com") ||
      isValidDomain(url.hostname, "video-files.pexels.com") ||
      isValidDomain(url.hostname, "videos.pexels.com") ||
      isValidDomain(url.hostname, "images.pexels.com")
    ) {
      result.details.isPexels = true;
    }

    // Check for Mux domains (secure subdomain validation)
    if (
      isValidDomain(url.hostname, "mux.com") ||
      isValidDomain(url.hostname, "stream.mux.com") ||
      isValidDomain(url.hostname, "image.mux.com")
    ) {
      result.details.isMux = true;
    }
  } catch (e) {
    // Check if it's a relative URL or blob
    if (src.startsWith("/")) {
      result.details.isLocal = true;
      result.details.isValidUrl = true;
    } else if (src.startsWith("blob:")) {
      result.details.isBlob = true;
      result.details.isValidUrl = true;
    } else {
      result.issues.push(`Invalid URL format: ${src.substring(0, 50)}`);
      result.isValid = false;
    }
  }

  // Check for LFS pointer files (local files only)
  if (result.details.isLocal && !src.startsWith("blob:")) {
    try {
      const response = await fetch(src, { method: "HEAD" });
      const contentLength = response.headers.get("content-length");
      
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        result.details.estimatedSize = size;
        
        // LFS pointer files are typically around 130 bytes
        if (size < LFS_POINTER_MAX_SIZE) {
          result.issues.push(
            `File appears to be an LFS pointer (${size} bytes). Video files should be much larger.`
          );
          result.isValid = false;
        }
      }
    } catch (e) {
      result.warnings.push(
        `Could not verify file size: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
  }

  // Check CSP compliance for external URLs
  if (result.details.isPexels || result.details.isMux) {
    const cspCheck = checkCSPCompliance(src);
    if (!cspCheck.allowed) {
      result.issues.push(
        `CSP may block this domain. Ensure ${result.details.domain} is in media-src directive.`
      );
      result.warnings.push(cspCheck.message);
    }
  }

  return result;
}

/**
 * Check if a URL is allowed by the expected CSP policy
 */
function checkCSPCompliance(src: string): { allowed: boolean; message: string } {
  // Expected media-src domains from vercel.json
  const allowedDomains = [
    "pexels.com",
    "video-files.pexels.com",
    "videos.pexels.com",
    "images.pexels.com",
    "mux.com",
    "stream.mux.com",
  ];

  try {
    const url = new URL(src);
    const hostname = url.hostname;

    const isAllowed = allowedDomains.some(
      (domain) =>
        hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (isAllowed) {
      return {
        allowed: true,
        message: `Domain ${hostname} is in CSP whitelist`,
      };
    } else {
      return {
        allowed: false,
        message: `Domain ${hostname} is NOT in CSP whitelist. Add it to media-src in vercel.json`,
      };
    }
  } catch {
    return { allowed: true, message: "Local or blob URL, CSP check skipped" };
  }
}

/**
 * Test video playback capability
 */
export async function testVideoPlayback(
  src: string
): Promise<{ canPlay: boolean; error?: string; networkState?: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.playsInline = true;

    const timeout = setTimeout(() => {
      resolve({
        canPlay: false,
        error: "Timeout waiting for video to load",
        networkState: video.networkState,
      });
      video.remove();
    }, 10000);

    video.addEventListener("canplay", () => {
      clearTimeout(timeout);
      resolve({ canPlay: true, networkState: video.networkState });
      video.remove();
    });

    video.addEventListener("error", (e) => {
      clearTimeout(timeout);
      const error = video.error;
      resolve({
        canPlay: false,
        error: error?.message || "Unknown error",
        networkState: video.networkState,
      });
      video.remove();
    });

    video.load();
  });
}

/**
 * Batch validate multiple video sources
 */
export async function batchValidateVideoSources(
  sources: string[]
): Promise<Map<string, VideoSourceValidationResult>> {
  const results = new Map<string, VideoSourceValidationResult>();

  validatorLogger.info(`Validating ${sources.length} video sources...`);

  for (const src of sources) {
    try {
      const result = await validateVideoSource(src);
      results.set(src, result);

      if (!result.isValid) {
        validatorLogger.error(`Validation failed for ${src}:`, result.issues);
      } else if (result.warnings.length > 0) {
        validatorLogger.warn(`Warnings for ${src}:`, result.warnings);
      }
    } catch (e) {
      validatorLogger.error(`Error validating ${src}:`, e);
      results.set(src, {
        isValid: false,
        issues: [`Validation error: ${e instanceof Error ? e.message : "Unknown"}`],
        warnings: [],
        details: {
          url: src,
          isValidUrl: false,
          domain: null,
          isPexels: false,
          isMux: false,
          isLocal: false,
          isBlob: false,
        },
      });
    }
  }

  return results;
}

/**
 * Generate a diagnostic report for video playback issues
 */
export interface DiagnosticReport {
  timestamp: string;
  userAgent: string;
  cspHeader?: string;
  videoSourcesChecked: number;
  validSources: number;
  invalidSources: number;
  issues: Array<{ source: string; issue: string }>;
  networkState: {
    online: boolean;
    effectiveType?: string;
  };
}

export async function generateDiagnosticReport(
  sources: string[]
): Promise<DiagnosticReport> {
  const results = await batchValidateVideoSources(sources);

  const issues: Array<{ source: string; issue: string }> = [];
  let validCount = 0;
  let invalidCount = 0;

  results.forEach((result, source) => {
    if (result.isValid) {
      validCount++;
    } else {
      invalidCount++;
      result.issues.forEach((issue) => {
        issues.push({ source, issue });
      });
    }
  });

  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    videoSourcesChecked: sources.length,
    validSources: validCount,
    invalidSources: invalidCount,
    issues,
    networkState: {
      online: navigator.onLine,
      effectiveType: (navigator as NavigatorWithConnection).connection?.effectiveType,
    },
  };

  validatorLogger.info("Diagnostic report generated:", report);

  return report;
}
