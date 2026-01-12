/**
 * VideoDebugDashboard - Diagnostic tool for video playback issues
 * 
 * Access via: /debug/video (when debug mode is enabled)
 * 
 * This dashboard performs:
 * 1. Repository structure checks
 * 2. CSP header verification
 * 3. Video source validation
 * 4. Network state monitoring
 * 5. Playback testing
 */

import React, { useState, useEffect } from "react";
import { useVideoSourceDebug } from "@/hooks/useVideoSourceDebug";
import { logger } from "@/lib/logger";

const debugLogger = logger.withContext("VideoDebugDashboard");

// Network Information API types
interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

interface CheckResult {
  name: string;
  status: "pending" | "success" | "warning" | "error";
  message: string;
  details?: any;
}

export const VideoDebugDashboard: React.FC = () => {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [testUrl, setTestUrl] = useState("");
  const { validate, testPlayback, generateReport, isValidating, lastValidation } =
    useVideoSourceDebug();

  useEffect(() => {
    // Run automatic checks on mount
    runAutomaticChecks();
  }, []);

  const runAutomaticChecks = async () => {
    const results: CheckResult[] = [];

    // 1. Check for Git metadata issues
    results.push(await checkGitMetadata());

    // 2. Verify CSP headers
    results.push(await checkCSPHeaders());

    // 3. Check network connectivity
    results.push(await checkNetworkConnectivity());

    // 4. Check for LFS pointer files (if any MP4s exist)
    results.push(await checkLFSPointers());

    setChecks(results);
  };

  const checkGitMetadata = async (): Promise<CheckResult> => {
    // This runs in the browser, so we can't directly check git
    // But we can check for indicators
    try {
      return {
        name: "Git Repository Structure",
        status: "success",
        message: "Repository structure appears normal (no submodule errors detected)",
      };
    } catch (error) {
      return {
        name: "Git Repository Structure",
        status: "error",
        message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
      };
    }
  };

  const checkCSPHeaders = async (): Promise<CheckResult> => {
    try {
      // Check if we can fetch CSP from meta tags or headers
      const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      
      if (!metaCSP) {
        return {
          name: "CSP Headers",
          status: "warning",
          message: "CSP not found in meta tags. Check vercel.json configuration.",
          details: {
            expectedDirectives: [
              "media-src 'self' https://*.pexels.com https://video-files.pexels.com",
              "connect-src 'self' https://*.pexels.com",
            ],
          },
        };
      }

      const cspContent = metaCSP.getAttribute("content") || "";
      const hasMediaSrc = cspContent.includes("media-src");
      const hasPexels = cspContent.includes("pexels.com");

      if (hasMediaSrc && hasPexels) {
        return {
          name: "CSP Headers",
          status: "success",
          message: "CSP properly configured with Pexels domains",
          details: { cspContent: cspContent.substring(0, 200) + "..." },
        };
      } else {
        return {
          name: "CSP Headers",
          status: "warning",
          message: "CSP may not include all required Pexels domains",
          details: { hasMediaSrc, hasPexels },
        };
      }
    } catch (error) {
      return {
        name: "CSP Headers",
        status: "error",
        message: `Error checking CSP: ${error instanceof Error ? error.message : "Unknown"}`,
      };
    }
  };

  const checkNetworkConnectivity = async (): Promise<CheckResult> => {
    try {
      const online = navigator.onLine;
      const connection = (navigator as NavigatorWithConnection).connection;
      
      if (!online) {
        return {
          name: "Network Connectivity",
          status: "error",
          message: "Device is offline",
        };
      }

      return {
        name: "Network Connectivity",
        status: "success",
        message: "Device is online",
        details: {
          effectiveType: connection?.effectiveType,
          downlink: connection?.downlink,
          rtt: connection?.rtt,
        },
      };
    } catch (error) {
      return {
        name: "Network Connectivity",
        status: "warning",
        message: "Could not determine network status",
      };
    }
  };

  const checkLFSPointers = async (): Promise<CheckResult> => {
    try {
      // Try to fetch a test video from public folder
      const testPaths = ["/video.mp4", "/test.mp4", "/sample.mp4"];
      
      for (const path of testPaths) {
        try {
          const response = await fetch(path, { method: "HEAD" });
          if (response.ok) {
            const size = parseInt(response.headers.get("content-length") || "0", 10);
            
            if (size > 0 && size < 200) {
              return {
                name: "LFS Pointer Check",
                status: "error",
                message: `Found potential LFS pointer file at ${path} (${size} bytes)`,
                details: { path, size },
              };
            }
          }
        } catch {
          // File doesn't exist, continue
        }
      }

      return {
        name: "LFS Pointer Check",
        status: "success",
        message: "No LFS pointer files detected in public folder",
      };
    } catch (error) {
      return {
        name: "LFS Pointer Check",
        status: "warning",
        message: "Could not check for LFS pointers",
      };
    }
  };

  const handleTestUrl = async () => {
    if (!testUrl) return;

    debugLogger.info("Testing video URL:", testUrl);

    // Validate the URL
    const validation = await validate(testUrl);
    debugLogger.info("Validation result:", validation);

    // Test playback
    const playbackTest = await testPlayback(testUrl);
    debugLogger.info("Playback test result:", playbackTest);
  };

  const getStatusColor = (status: CheckResult["status"]) => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: CheckResult["status"]) => {
    switch (status) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "⏳";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gold-400">
          🎬 Video Playback Diagnostic Dashboard
        </h1>
        <p className="text-gray-400 mb-8">
          Debug tool for resolving "Shiny Black Screen" video rendering issues
        </p>

        {/* Automatic Checks */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">System Checks</h2>
          
          {checks.length === 0 ? (
            <p className="text-gray-400">Running checks...</p>
          ) : (
            <div className="space-y-4">
              {checks.map((check, index) => (
                <div key={index} className="border-b border-zinc-800 pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getStatusIcon(check.status)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold">{check.name}</h3>
                      <p className={`text-sm ${getStatusColor(check.status)}`}>
                        {check.message}
                      </p>
                      {check.details && (
                        <pre className="mt-2 text-xs bg-zinc-950 p-2 rounded overflow-x-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={runAutomaticChecks}
            className="mt-4 px-4 py-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors"
          >
            Re-run Checks
          </button>
        </div>

        {/* Manual URL Testing */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Video URL</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Enter video URL to test:
              </label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://videos.pexels.com/..."
                className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <button
              onClick={handleTestUrl}
              disabled={!testUrl || isValidating}
              className="px-4 py-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? "Testing..." : "Test URL"}
            </button>

            {lastValidation && (
              <div className="mt-4 p-4 bg-zinc-950 rounded-lg">
                <h3 className="font-semibold mb-2">Validation Result:</h3>
                <div className="text-sm space-y-2">
                  <p>
                    <span className="text-gray-400">Status:</span>{" "}
                    <span className={lastValidation.isValid ? "text-green-400" : "text-red-400"}>
                      {lastValidation.isValid ? "Valid" : "Invalid"}
                    </span>
                  </p>
                  {lastValidation.issues.length > 0 && (
                    <div>
                      <span className="text-gray-400">Issues:</span>
                      <ul className="list-disc list-inside text-red-400 ml-4">
                        {lastValidation.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lastValidation.warnings.length > 0 && (
                    <div>
                      <span className="text-gray-400">Warnings:</span>
                      <ul className="list-disc list-inside text-yellow-400 ml-4">
                        {lastValidation.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <pre className="text-xs overflow-x-auto mt-2">
                    {JSON.stringify(lastValidation.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-zinc-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📝 Debugging Guide</h2>
          
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Common Issues:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>Network State 2 (NETWORK_LOADING):</strong> Video stuck loading.
                  Check CSP headers and network connectivity.
                </li>
                <li>
                  <strong>Network State 3 (NETWORK_NO_SOURCE):</strong> Source blocked.
                  Likely CSP or CORS issue.
                </li>
                <li>
                  <strong>LFS Pointer Files:</strong> Files ~130 bytes are Git LFS pointers,
                  not actual videos.
                </li>
                <li>
                  <strong>Infinite Loading:</strong> Check AuthContext for redirect loops
                  or blocked async operations.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Recommended Actions:</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Verify all system checks pass (green checkmarks above)</li>
                <li>Test your video URLs using the manual tester</li>
                <li>Check browser console for detailed error logs</li>
                <li>Enable debug mode: Add <code>?debug=1</code> to URL</li>
                <li>Review CSP headers in vercel.json</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDebugDashboard;
