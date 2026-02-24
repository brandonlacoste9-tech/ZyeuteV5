/**
 * Debug mode - enable with ?debug=1 or localStorage.debug=true
 * Shows feed diagnostics and logs to console
 */
export function isDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") === "1") return true;
  return localStorage.getItem("debug") === "true";
}

export function debugLog(tag: string, ...args: unknown[]): void {
  if (isDebugMode()) {
    console.log(`[DEBUG ${tag}]`, ...args);
  }
}
