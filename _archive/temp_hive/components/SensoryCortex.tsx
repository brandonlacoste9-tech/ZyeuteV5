'use client'

import { useState, useEffect } from 'react'
import { Heart, Activity, Zap, TrendingUp, AlertCircle } from 'lucide-react'

interface SystemMetric {
  name: string
  value: number
  status: 'healthy' | 'warning' | 'critical'
  unit: string
}

interface MutationLog {
  id: string
  timestamp: string
  type: 'evolution' | 'optimization' | 'adaptation'
  message: string
}

const mutationLogSeedTimestamp = Date.now()

const initialMutationLogs: MutationLog[] = [
  {
    id: '1',
    timestamp: new Date(mutationLogSeedTimestamp).toISOString(),
    type: 'evolution',
    message: 'Neurosphere achieved cognitive fusion - semantic viscosity reached 0.0',
  },
  {
    id: '2',
    timestamp: new Date(mutationLogSeedTimestamp - 60000).toISOString(),
    type: 'optimization',
    message: 'Optimized task estimation algorithm with Gemini 2.5 Flash integration',
  },
  {
    id: '3',
    timestamp: new Date(mutationLogSeedTimestamp - 120000).toISOString(),
    type: 'adaptation',
    message: 'Swarm intelligence patterns stabilized across all four strata',
  },
]

export default function SensoryCortex() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    { name: 'Neural Throughput', value: 87, status: 'healthy', unit: '%' },
    { name: 'Swarm Coherence', value: 94, status: 'healthy', unit: '%' },
    { name: 'Memory Utilization', value: 62, status: 'healthy', unit: '%' },
    { name: 'Cognitive Load', value: 45, status: 'healthy', unit: '%' },
  ])

  const [mutationLogs] = useState<MutationLog[]>(initialMutationLogs)

  useEffect(() => {
    // Simulate real-time metric updates
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => ({
          ...metric,
          value: Math.max(0, Math.min(100, metric.value + (Math.random() - 0.5) * 5)),
          status:
            metric.value > 80
              ? 'healthy'
              : metric.value > 50
              ? 'warning'
              : 'critical',
        }))
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 border-green-500/50 bg-green-900/20'
      case 'warning':
        return 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20'
      case 'critical':
        return 'text-red-400 border-red-500/50 bg-red-900/20'
      default:
        return 'text-gray-400 border-gray-500/50 bg-gray-900/20'
    }
  }

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'evolution':
        return 'text-purple-400 bg-purple-900/30'
      case 'optimization':
        return 'text-blue-400 bg-blue-900/30'
      case 'adaptation':
        return 'text-green-400 bg-green-900/30'
      default:
        return 'text-gray-400 bg-gray-900/30'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-red-900/50 to-pink-900/50 rounded-lg p-6 border border-red-500/30">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-8 h-8 text-red-400" />
          <div>
            <h2 className="text-2xl font-bold">Sensory Cortex - The Body</h2>
            <p className="text-sm text-gray-400">System Health Telemetry & Live Mutation Logs</p>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric) => (
            <div
              key={metric.name}
              className={`rounded-lg p-4 border ${getStatusColor(metric.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-300">{metric.name}</span>
                {metric.status === 'healthy' ? (
                  <Activity className="w-4 h-4 animate-pulse" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{Math.round(metric.value)}</span>
                <span className="text-sm">{metric.unit}</span>
              </div>
              <div className="mt-2 bg-black/30 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    metric.status === 'healthy'
                      ? 'bg-green-500'
                      : metric.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${metric.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Swarm Intelligence Stats */}
        <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Swarm Intelligence Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Active Agents</p>
              <p className="text-2xl font-bold text-purple-400">12</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Coordination Index</p>
              <p className="text-2xl font-bold text-purple-400">0.94</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Emergence Level</p>
              <p className="text-2xl font-bold text-purple-400">High</p>
            </div>
          </div>
        </div>

        {/* Live Mutation Logs */}
        <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Live Mutation Logs
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mutationLogs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${getLogTypeColor(log.type)}`}>
                    {log.type.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{log.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status Summary */}
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/20">
        <h3 className="text-lg font-semibold mb-4">System Status Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">Overall Health</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-lg font-semibold text-green-400">Optimal</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Last Health Check</p>
            <p className="text-lg font-semibold text-purple-300">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
