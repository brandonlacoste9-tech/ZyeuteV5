/**
 * Input sanitization utilities for security
 * Prevents XSS, SQL injection, and other common attacks
 */

import { logger } from "./logger";

const sanitizeLogger = logger.withContext("Sanitize");

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * IMPORTANT: This function strips ALL HTML tags for maximum security.
 * For user-generated content (comments, captions), use sanitizeText() instead.
 *
 * Note: CodeQL may flag regex patterns as incomplete, but this is a false positive
 * because we remove ALL HTML tags at the end (<[^>]*>) which catches any edge cases.
 * The intermediate steps are defense-in-depth layers.
 */
export function sanitizeHTML(input: string): string {
  if (!input) return "";

  let sanitized = input;

  // Defense layer 1: Remove script tags (multiple passes for nested tags)
  // Note: Final HTML strip catches any edge cases, this is defense-in-depth
  let previousLength = 0;
  while (sanitized.length !== previousLength) {
    previousLength = sanitized.length;
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/gi, "");
    sanitized = sanitized.replace(/<script[^>]*>/gi, "");
  }

  // Defense layer 2: Remove event handlers (multiple passes)
  // Note: Final HTML strip catches any edge cases, this is defense-in-depth
  previousLength = 0;
  while (sanitized.length !== previousLength) {
    previousLength = sanitized.length;
    sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/\bon\w+\s*=\s*[^\s>"']*/gi, "");
  }

  // Defense layer 3: Remove dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, "removed:");
  sanitized = sanitized.replace(/data:/gi, "removed:"); // Catches data:text/html and all data: URLs
  sanitized = sanitized.replace(/vbscript:/gi, "removed:");

  // Final defense: Remove ALL HTML tags for maximum safety
  // This catches any XSS attempts that bypassed previous layers
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  return sanitized.trim();
}

/**
 * Sanitize user input for plain text (captions, comments, etc.)
 * Escapes HTML entities
 */
export function sanitizeText(input: string): string {
  if (!input) return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

/**
 * Sanitize username - only allow alphanumeric, underscore, hyphen
 */
export function sanitizeUsername(input: string): string {
  if (!input) return "";

  // Remove any non-alphanumeric characters except underscore and hyphen
  const sanitized = input.replace(/[^a-zA-Z0-9_-]/g, "");

  // Limit length
  return sanitized.slice(0, 30);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
  if (!input) return "";

  // Basic email validation and sanitization
  const sanitized = input.toLowerCase().trim();

  // Check basic email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    sanitizeLogger.warn("Invalid email format:", input);
    return "";
  }

  return sanitized;
}

/**
 * Sanitize URL - ensure it's a valid HTTP/HTTPS URL
 */
export function sanitizeURL(input: string): string {
  if (!input) return "";

  try {
    const url = new URL(input);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(url.protocol)) {
      sanitizeLogger.warn("Invalid URL protocol:", input);
      return "";
    }

    return url.toString();
  } catch (error) {
    sanitizeLogger.warn("Invalid URL:", input);
    return "";
  }
}

/**
 * Sanitize file name - remove path traversal attempts
 */
export function sanitizeFileName(input: string): string {
  if (!input) return "";

  // Remove path traversal attempts
  let sanitized = input.replace(/\.\./g, "");
  sanitized = sanitized.replace(/[/\\]/g, "");

  // Only allow safe characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limit length
  return sanitized.slice(0, 255);
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhoneNumber(input: string): string {
  if (!input) return "";

  // Remove all non-digit characters except + at the start
  const sanitized = input.replace(/[^\d+]/g, "");

  // Ensure + is only at the start
  if (sanitized.includes("+")) {
    const parts = sanitized.split("+");
    return "+" + parts.join("");
  }

  return sanitized;
}

/**
 * Sanitize JSON input - parse and validate
 */
export function sanitizeJSON<T = any>(input: string): T | null {
  if (!input) return null;

  try {
    const parsed = JSON.parse(input);

    // Check for prototype pollution
    if (parsed.__proto__ || parsed.constructor || parsed.prototype) {
      sanitizeLogger.error("Potential prototype pollution detected");
      return null;
    }

    return parsed as T;
  } catch (error) {
    sanitizeLogger.error("Invalid JSON:", error);
    return null;
  }
}

/**
 * Validate file upload
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[]; // MIME types
    allowedExtensions?: string[];
  } = {},
): FileValidationResult {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
    ],
    allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".mp4",
      ".webm",
    ],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }

  return { isValid: true };
}

/**
 * Rate limiting helper (client-side)
 * Prevents rapid-fire requests
 */
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000, // 1 minute
): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];

  // Remove old timestamps outside the window
  const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

  // Check if limit exceeded
  if (validTimestamps.length >= maxRequests) {
    sanitizeLogger.warn(`Rate limit exceeded for key: ${key}`);
    return false;
  }

  // Add new timestamp
  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);

  return true;
}
