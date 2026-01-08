/**
 * Automation Metrics Dashboard Component
 * Displays real-time performance metrics for Windows-Use automation tasks
 * NOTE: Requires Socket.io connection for real-time updates (future enhancement)
 */

import React, { useEffect, useState } from "react";
import { Activity, Cpu, HardDrive, Wifi } from "lucide-react";

interface MetricsData {
  timestamp: number;
  fps: number;
  memoryUsage: number; // MB
  droppedFrames: number;
  networkRequests: number;
}

interface AutomationMetricsProps {
  beeType?: string;
  taskId?: string;
}

export function AutomationMetrics({
  beeType = "windows-automation",
  taskId,
}: AutomationMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData[]>([]);
  const [liveStatus, setLiveStatus] = useState<"idle" | "running" | "error">(
    "idle",
  );

  useEffect(() => {
    // TODO: Subscribe to Socket.io events for real-time metrics
    // This is a placeholder implementation
    // Future enhancement: Connect to Socket.io and listen for 'observability:metrics' events
    
    // Example: Fetch initial metrics (if API endpoint exists)
    const fetchMetrics = async () => {
      try {
        // const response = await fetch(`/api/automation/metrics?beeType=${beeType}`);
        // const data = await response.json();
        // setMetrics(data.metrics || []);
      } catch (error) {
        console.error("Failed to fetch automation metrics:", error);
      }
    };

    // fetchMetrics();
    
    // TODO: Set up Socket.io subscription
    // socket.on('observability:metrics', (data) => {
    //   if (data.beeType === beeType && (!taskId || data.taskId === taskId)) {
    //     setMetrics(prev => [...prev, {
    //       timestamp: data.timestamp,
    //       fps: data.metrics.fps,
    //       memoryUsage: data.metrics.memoryUsage,
    //       droppedFrames: data.metrics.droppedFrames,
    //       networkRequests: data.metrics.networkRequests
    //     }].slice(-50)); // Keep last 50 data points
    //   }
    // });
  }, [beeType, taskId]);

  const latestMetrics = metrics[metrics.length - 1] || {
    timestamp: Date.now(),
    fps: 0,
    memoryUsage: 0,
    droppedFrames: 0,
    networkRequests: 0,
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Automation Performance
        </h2>
        <div
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            liveStatus === "running"
              ? "bg-green-500 text-white"
              : liveStatus === "error"
                ? "bg-red-500 text-white"
                : "bg-gray-500 text-white"
          }`}
        >
          {liveStatus.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* FPS Metric */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              FPS
            </h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {latestMetrics.fps.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Frames per second
          </p>
        </div>

        {/* Memory Usage Metric */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Memory
            </h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {latestMetrics.memoryUsage.toFixed(1)} MB
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Peak usage
          </p>
        </div>

        {/* Dropped Frames Metric */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dropped Frames
            </h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {latestMetrics.droppedFrames}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total dropped
          </p>
        </div>

        {/* Network Requests Metric */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Network
            </h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {latestMetrics.networkRequests}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total requests
          </p>
        </div>
      </div>

      {metrics.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No metrics data available</p>
          <p className="text-sm mt-2">
            Metrics will appear here when automation tasks are executed
          </p>
        </div>
      )}
    </div>
  );
}
