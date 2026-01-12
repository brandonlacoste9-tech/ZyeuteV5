/**
 * useVideoSourceDebug - Hook for debugging video source issues
 * 
 * Usage:
 * ```tsx
 * const { validate, report } = useVideoSourceDebug();
 * 
 * // Validate a single source
 * const result = await validate('https://...');
 * 
 * // Generate a full diagnostic report
 * const report = await generateReport([...sources]);
 * ```
 */

import { useState, useCallback } from "react";
import {
  validateVideoSource,
  testVideoPlayback,
  generateDiagnosticReport,
  VideoSourceValidationResult,
  DiagnosticReport,
} from "@/utils/videoSourceValidator";
import { logger } from "@/lib/logger";

const hookLogger = logger.withContext("useVideoSourceDebug");

export function useVideoSourceDebug() {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] =
    useState<VideoSourceValidationResult | null>(null);

  const validate = useCallback(async (src: string) => {
    setIsValidating(true);
    try {
      const result = await validateVideoSource(src);
      setLastValidation(result);
      
      if (!result.isValid) {
        hookLogger.error(`Validation failed for ${src}:`, result.issues);
      }
      
      return result;
    } catch (error) {
      hookLogger.error("Validation error:", error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const testPlayback = useCallback(async (src: string) => {
    setIsValidating(true);
    try {
      const result = await testVideoPlayback(src);
      
      if (!result.canPlay) {
        hookLogger.error(`Playback test failed for ${src}:`, {
          error: result.error,
          networkState: result.networkState,
        });
      }
      
      return result;
    } catch (error) {
      hookLogger.error("Playback test error:", error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const generateReport = useCallback(async (sources: string[]) => {
    setIsValidating(true);
    try {
      const report = await generateDiagnosticReport(sources);
      hookLogger.info("Diagnostic report generated:", report);
      return report;
    } catch (error) {
      hookLogger.error("Report generation error:", error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validate,
    testPlayback,
    generateReport,
    isValidating,
    lastValidation,
  };
}

export type { VideoSourceValidationResult, DiagnosticReport };
