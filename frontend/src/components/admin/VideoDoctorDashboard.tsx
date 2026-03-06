/**
 * 🏥 Video Doctor Dashboard
 * Monitor and repair video health
 */

import React, { useState, useEffect } from "react";
import { Activity, AlertCircle, CheckCircle, RefreshCw, Stethoscope, Wrench } from "lucide-react";

interface VideoHealth {
  postId: string;
  status: "healthy" | "sick" | "critical" | "dead";
  issues: Array<{
    type: string;
    severity: string;
    message: string;
    autoFixable: boolean;
  }>;
  recommendations: string[];
  canAutoFix: boolean;
}

interface VideoStats {
  total_videos: number;
  completed: number;
  processing: number;
  pending: number;
  failed: number;
  missing_thumbnails: number;
  missing_source: number;
}

export const VideoDoctorDashboard: React.FC = () => {
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [sickVideos, setSickVideos] = useState<VideoHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/video-doctor/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/video-doctor/health-check?limit=50");
      if (response.ok) {
        const data = await response.json();
        setSickVideos(data.reports);
      }
    } catch (error) {
      console.error("Health check failed:", error);
    }
    setLoading(false);
  };

  const fixVideo = async (postId: string) => {
    setFixing(true);
    try {
      const response = await fetch(`/api/video-doctor/fix/${postId}`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.fix.message);
        runHealthCheck();
      }
    } catch (error) {
      console.error("Fix failed:", error);
    }
    setFixing(false);
  };

  const autoFixAll = async () => {
    if (!confirm("Auto-fix all fixable videos?")) return;
    
    setFixing(true);
    try {
      const response = await fetch("/api/video-doctor/auto-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 })
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Fixed: ${data.result.fixed}, Failed: ${data.result.failed}`);
        runHealthCheck();
        fetchStats();
      }
    } catch (error) {
      console.error("Auto-fix failed:", error);
    }
    setFixing(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
      runHealthCheck();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-500";
      case "sick": return "text-yellow-500";
      case "critical": return "text-orange-500";
      case "dead": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return "✅";
      case "sick": return "⚠️";
      case "critical": return "🚨";
      case "dead": return "💀";
      default: return "❓";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Stethoscope className="w-8 h-8 text-blue-500" />
        <h1 className="text-2xl font-bold">🏥 Video Doctor</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
            <div className="text-3xl font-bold text-blue-400">{stats.total_videos}</div>
            <div className="text-sm text-gray-500">Total Videos</div>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
            <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-gray-500">Healthy</div>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
            <div className="text-3xl font-bold text-yellow-400">{stats.processing + stats.pending}</div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
            <div className="text-3xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={runHealthCheck}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Run Health Check
        </button>
        <button
          onClick={autoFixAll}
          disabled={fixing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Wrench className={`w-4 h-4 ${fixing ? "animate-pulse" : ""}`} />
          Auto-Fix All
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          Videos Needing Attention ({sickVideos.length})
        </h2>

        {sickVideos.map((video) => (
          <div
            key={video.postId}
            className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
          >
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800"
              onClick={() => setSelectedVideo(selectedVideo === video.postId ? null : video.postId)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(video.status)}</span>
                <div>
                  <div className={`font-medium ${getStatusColor(video.status)}`}>
                    {video.status.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-500">ID: {video.postId}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {video.canAutoFix && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fixVideo(video.postId);
                    }}
                    disabled={fixing}
                    className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-sm hover:bg-green-600/30"
                  >
                    Fix
                  </button>
                )}
                <span className="text-gray-500">
                  {video.issues.length} issue{video.issues.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {selectedVideo === video.postId && (
              <div className="px-4 pb-4 border-t border-gray-800">
                <div className="pt-4 space-y-3">
                  {video.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
                    >
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                        issue.severity === "critical" ? "text-red-400" :
                        issue.severity === "high" ? "text-orange-400" :
                        "text-yellow-400"
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-200">{issue.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Type: {issue.type} • Severity: {issue.severity}
                          {issue.autoFixable && (
                            <span className="text-green-400 ml-2">✓ Auto-fixable</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {video.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {video.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-500 flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {sickVideos.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-400">All videos are healthy! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDoctorDashboard;
