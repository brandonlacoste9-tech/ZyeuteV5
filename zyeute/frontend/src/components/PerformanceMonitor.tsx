/**
 * Performance Monitoring Component
 * Displays auth performance metrics from our tracking
 */

import React, { useEffect, useState } from "react";

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  warning: boolean;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    // Listen for performance console warnings
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args[0];
      if (
        typeof message === "string" &&
        message.includes("Slow auth operation")
      ) {
        const match = message.match(/(.+) took (\d+)ms/);
        if (match) {
          setMetrics((prev) => [
            ...prev,
            {
              operation: match[1].replace("⚠️ Slow auth operation: ", ""),
              duration: parseInt(match[2]),
              timestamp: new Date(),
              warning: true,
            },
          ]);
        }
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  if (metrics.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 bg-dark-900 border border-gold-500/20 rounded-lg p-4 max-w-md shadow-2xl">
      <h3 className="text-sm font-bold text-gold-400 mb-2 flex items-center">
        ⚡ Performance Metrics
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {metrics
          .slice(-5)
          .reverse()
          .map((metric, i) => (
            <div key={i} className="text-xs border-l-2 border-gold-500/30 pl-2">
              <div className="font-mono text-gray-400">{metric.operation}</div>
              <div
                className={
                  metric.duration > 3000 ? "text-red-400" : "text-yellow-400"
                }
              >
                {metric.duration}ms
              </div>
              <div className="text-gray-500">
                {metric.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
