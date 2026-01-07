/**
 * Colony OS Metrics Bridge
 * Sends Zyeute metrics to Colony OS for monitoring and analysis
 */

export interface ZyeuteMetrics {
  timestamp: Date;
  tasksExecuted: number;
  imagesGenerated: number;
  videosGenerated: number;
  totalCost: number;
  averageTaskTime: number;
  activeUsers: number;
  apiCalls: {
    studio: number;
    total: number;
  };
}

// Metrics accumulator
let metrics: ZyeuteMetrics = {
  timestamp: new Date(),
  tasksExecuted: 0,
  imagesGenerated: 0,
  videosGenerated: 0,
  totalCost: 0,
  averageTaskTime: 0,
  activeUsers: 0,
  apiCalls: {
    studio: 0,
    total: 0,
  },
};

/**
 * Record a task execution
 */
export function recordTask(
  type: string,
  executionTime: number,
  cost: number = 0,
) {
  metrics.tasksExecuted++;

  if (type.includes("image")) {
    metrics.imagesGenerated++;
  } else if (type.includes("video")) {
    metrics.videosGenerated++;
  }

  metrics.totalCost += cost;

  // Update average task time (rolling average)
  const oldAvg = metrics.averageTaskTime;
  const oldCount = metrics.tasksExecuted - 1;
  metrics.averageTaskTime =
    (oldAvg * oldCount + executionTime) / metrics.tasksExecuted;
}

/**
 * Record an API call
 */
export function recordApiCall(endpoint: string) {
  metrics.apiCalls.total++;

  if (endpoint.startsWith("/api/studio")) {
    metrics.apiCalls.studio++;
  }
}

/**
 * Send metrics to Colony OS
 */
export async function sendMetricsToColony(): Promise<void> {
  const colonyOsUrl = process.env.COLONY_OS_URL || "http://localhost:3001";

  try {
    const response = await fetch(`${colonyOsUrl}/api/zyeute-metrics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.COLONY_API_KEY || "dev-key"}`,
      },
      body: JSON.stringify({
        ...metrics,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(
        `[Colony Bridge] Failed to send metrics: ${response.status}`,
      );
    } else {
      console.log("[Colony Bridge] Metrics sent successfully");
    }
  } catch (error) {
    console.error("[Colony Bridge] Failed to send metrics:", error);
    // Don't throw - metrics are best-effort
  }
}

/**
 * Reset metrics (after sending)
 */
function resetMetrics() {
  metrics = {
    timestamp: new Date(),
    tasksExecuted: 0,
    imagesGenerated: 0,
    videosGenerated: 0,
    totalCost: 0,
    averageTaskTime: 0,
    activeUsers: 0,
    apiCalls: {
      studio: 0,
      total: 0,
    },
  };
}

/**
 * Start periodic metrics reporting (every 5 minutes)
 */
export function startMetricsReporting() {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  setInterval(async () => {
    await sendMetricsToColony();
    resetMetrics();
  }, INTERVAL_MS);

  console.log("[Colony Bridge] Started metrics reporting (5 min interval)");
}

/**
 * Get current metrics snapshot
 */
export function getMetricsSnapshot(): ZyeuteMetrics {
  return { ...metrics };
}
