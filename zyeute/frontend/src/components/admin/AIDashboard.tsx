/**
 * AI Dashboard Component
 * Admin dashboard showing real-time AI model usage, circuit breaker events, and performance metrics
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AIMetric {
  provider: string;
  requests: number;
  failures: number;
  avgLatency: number;
  totalCost: number;
  lastUsed: string;
}

interface CircuitBreakerEvent {
  timestamp: string;
  model: string;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  reason: string;
}

interface AIDashboardData {
  metrics: AIMetric[];
  circuitBreakerEvents: CircuitBreakerEvent[];
  recentRequests: Array<{
    timestamp: string;
    provider: string;
    intendedModel?: string;
    actualModel: string;
    circuitBreakerIntervened: boolean;
    latency: number;
  }>;
}

export const AIDashboard: React.FC = () => {
  const [data, setData] = useState<AIDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/ai-metrics");
        if (response.ok) {
          const json = await response.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch AI metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-leather-800 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-leather-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-leather-400">Failed to load AI metrics</p>
      </div>
    );
  }

  const totalRequests = data.metrics.reduce((sum, m) => sum + m.requests, 0);
  const totalFailures = data.metrics.reduce((sum, m) => sum + m.failures, 0);
  const failureRate = totalRequests > 0 ? (totalFailures / totalRequests) * 100 : 0;
  const totalCost = data.metrics.reduce((sum, m) => sum + m.totalCost, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-500">AI Dashboard</h1>
        <label className="flex items-center gap-2 text-sm text-leather-400">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          Auto-refresh (5s)
        </label>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-leather-900 border-leather-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-leather-400">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-500">{totalRequests.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-leather-900 border-leather-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-leather-400">Failure Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${failureRate > 5 ? "text-red-400" : "text-green-400"}`}>
              {failureRate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-leather-900 border-leather-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-leather-400">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-500">${totalCost.toFixed(4)}</div>
          </CardContent>
        </Card>

        <Card className="bg-leather-900 border-leather-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-leather-400">Circuit Breaker Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {data.circuitBreakerEvents.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Metrics */}
      <Card className="bg-leather-900 border-leather-700">
        <CardHeader>
          <CardTitle className="text-gold-500">Provider Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.metrics.map((metric) => {
              const successRate = metric.requests > 0
                ? ((metric.requests - metric.failures) / metric.requests) * 100
                : 100;

              return (
                <div
                  key={metric.provider}
                  className="flex items-center justify-between p-4 bg-leather-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gold-400">{metric.provider}</span>
                      <Badge
                        variant={successRate > 95 ? "success" : successRate > 80 ? "warning" : "error"}
                      >
                        {successRate.toFixed(1)}% success
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-leather-400">
                      <div>
                        <span className="text-leather-500">Requests:</span> {metric.requests}
                      </div>
                      <div>
                        <span className="text-leather-500">Avg Latency:</span> {metric.avgLatency}ms
                      </div>
                      <div>
                        <span className="text-leather-500">Cost:</span> ${metric.totalCost.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Circuit Breaker Events */}
      {data.circuitBreakerEvents.length > 0 && (
        <Card className="bg-leather-900 border-leather-700">
          <CardHeader>
            <CardTitle className="text-yellow-400">Recent Circuit Breaker Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.circuitBreakerEvents.slice(0, 10).map((event, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-leather-800 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        event.state === "OPEN"
                          ? "error"
                          : event.state === "HALF_OPEN"
                          ? "warning"
                          : "success"
                      }
                    >
                      {event.state}
                    </Badge>
                    <span className="text-gold-400">{event.model}</span>
                    <span className="text-leather-500">{event.reason}</span>
                  </div>
                  <span className="text-leather-500 text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests */}
      <Card className="bg-leather-900 border-leather-700">
        <CardHeader>
          <CardTitle className="text-gold-500">Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.recentRequests.slice(0, 20).map((req, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-leather-800 rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gold-400">{req.actualModel}</span>
                  {req.intendedModel && req.intendedModel !== req.actualModel && (
                    <span className="text-yellow-400 text-xs">
                      (intended: {req.intendedModel})
                    </span>
                  )}
                  {req.circuitBreakerIntervened && (
                    <Badge variant="warning" className="text-xs">⚡ Fallback</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-leather-500 text-xs">
                  <span>{req.latency}ms</span>
                  <span>{new Date(req.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
