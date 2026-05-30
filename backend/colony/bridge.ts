/**
 * Zyeuté -> Colony OS Bridge
 * Sends metrics to the Colony OS Architect View
 * Silently no-ops when Colony OS is not available
 */

// Native fetch is available in Node 18+

let _colonyAvailable: boolean | null = null;
let _lastCheckTime = 0;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Re-check availability every 5 minutes

export async function sendMetricsToColony(metrics: Record<string, any>) {
  const COLONY_URL = process.env.COLONY_OS_URL;

  // If COLONY_OS_URL is not explicitly set, silently skip
  if (!COLONY_URL) {
    return false;
  }

  // If we recently confirmed Colony OS is down, skip until next check window
  const now = Date.now();
  if (_colonyAvailable === false && now - _lastCheckTime < CHECK_INTERVAL_MS) {
    return false;
  }

  const ENDPOINT = `${COLONY_URL}/api/zyeute-metrics`;

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-source": "zyeute-v3",
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        ...metrics,
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      _colonyAvailable = false;
      _lastCheckTime = now;
      return false;
    }

    _colonyAvailable = true;
    _lastCheckTime = now;
    return true;
  } catch {
    // Silently mark as unavailable — no log spam
    _colonyAvailable = false;
    _lastCheckTime = now;
    return false;
  }
}
