/**
 * Zyeuté -> Colony OS Bridge
 * Sends metrics to the Colony OS Architect View
 */

// Native fetch is available in Node 18+

export async function sendMetricsToColony(metrics: Record<string, any>) {
  const COLONY_URL = process.env.COLONY_OS_URL || "http://localhost:3000";
  const ENDPOINT = `${COLONY_URL}/api/zyeute-metrics`;

  console.log(`[Colony Bridge] Sending metrics to ${ENDPOINT}...`);

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
    });

    if (!response.ok) {
      throw new Error(
        `Colony OS returned ${response.status} ${response.statusText}`,
      );
    }

    console.log("[Colony Bridge] Metrics sent successfully");
    return true;
  } catch (error: any) {
    console.error("[Colony Bridge] Failed to send metrics:", error.message);
    return false;
  }
}
