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
 * Silently no-ops when COLONY_OS_URL is not set
 */
let _metricsColonyAvailable: boolean | null = null;
let _metricsLastCheck = 0;

export async function sendMetricsToColony(): Promise<void> {
  const colonyOsUrl = process.env.COLONY_OS_URL;

  // If COLONY_OS_URL is not explicitly set, silently skip
  if (!colonyOsUrl) {
    return;
  }

  // Circuit breaker: skip if Colony was down recently (5 min window)
  const now = Date.now();
  if (
    _metricsColonyAvailable === false &&
    now - _metricsLastCheck < 5 * 60 * 1000
  ) {
    return;
  }

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
      signal: AbortSignal.timeout(5000),
    });

    _metricsColonyAvailable = response.ok;
    _metricsLastCheck = now;
  } catch {
    // Silently mark unavailable — no log spam
    _metricsColonyAvailable = false;
    _metricsLastCheck = now;
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
