/**
 * BugBot Security & Privacy
 * Handles PII redaction, access control, and data retention
 */

import { logger } from "../utils/logger.js";
import type { BugReport } from "./bugbot.js";

export interface RedactionConfig {
  fields: string[]; // Fields to redact (e.g., ["email", "password", "token"])
  patterns: RegExp[]; // Regex patterns to redact (e.g., email, credit card)
  replacement: string; // What to replace with (default: "[REDACTED]")
}

const DEFAULT_REDACTION_CONFIG: RedactionConfig = {
  fields: [
    "password",
    "token",
    "apiKey",
    "secret",
    "authorization",
    "cookie",
    "session",
    "email",
    "phone",
    "ssn",
    "creditCard",
  ],
  patterns: [
    /password[=:]\s*["']?[^"'\s]+/gi,
    /token[=:]\s*["']?[^"'\s]+/gi,
    /api[_-]?key[=:]\s*["']?[^"'\s]+/gi,
    /email[=:]\s*["']?[^\s"']+@[^\s"']+/gi,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  ],
  replacement: "[REDACTED]",
};

/**
 * BugBot Security Manager
 * Handles PII redaction and access control
 */
export class BugBotSecurity {
  private redactionConfig: RedactionConfig = DEFAULT_REDACTION_CONFIG;

  /**
   * Redact sensitive information from bug report
   */
  redactBugReport(bug: BugReport): BugReport {
    const redacted = { ...bug };

    // Redact context
    if (redacted.context) {
      redacted.context = this.redactObject(redacted.context);
    }

    // Redact description
    redacted.description = this.redactString(redacted.description);

    // Redact stack trace
    if (redacted.stackTrace) {
      redacted.stackTrace = this.redactString(redacted.stackTrace);
    }

    return redacted;
  }

  /**
   * Redact sensitive fields from object
   */
  private redactObject(obj: Record<string, any>): Record<string, any> {
    const redacted: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if field should be redacted
      if (this.redactionConfig.fields.some((field) => lowerKey.includes(field.toLowerCase()))) {
        redacted[key] = this.redactionConfig.replacement;
        continue;
      }

      // Recursively redact nested objects
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        redacted[key] = this.redactObject(value);
      } else if (Array.isArray(value)) {
        redacted[key] = value.map((item) =>
          typeof item === "object" && item !== null ? this.redactObject(item) : this.redactString(String(item))
        );
      } else {
        redacted[key] = this.redactString(String(value));
      }
    }

    return redacted;
  }

  /**
   * Redact sensitive patterns from string
   */
  private redactString(str: string): string {
    let redacted = str;

    // Apply regex patterns
    for (const pattern of this.redactionConfig.patterns) {
      redacted = redacted.replace(pattern, this.redactionConfig.replacement);
    }

    return redacted;
  }

  /**
   * Update redaction configuration
   */
  updateRedactionConfig(config: Partial<RedactionConfig>): void {
    this.redactionConfig = {
      ...this.redactionConfig,
      ...config,
    };
    logger.info("[BugBotSecurity] Redaction config updated");
  }

  /**
   * Get redaction configuration
   */
  getRedactionConfig(): RedactionConfig {
    return { ...this.redactionConfig };
  }
}

export const bugBotSecurity = new BugBotSecurity();
