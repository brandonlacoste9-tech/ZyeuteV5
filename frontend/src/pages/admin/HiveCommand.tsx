/**
 * Hive Command Center - Admin Dashboard
 * Strictly protected zone for monitoring the AI Swarm.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkIsAdmin } from "@/lib/admin";
import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import { Header } from "@/components/Header";
import { generateImage } from "@/services/api";

// --- Types ---
interface LogEntry {
  id: string;
  status: "COMPLETED" | "FAILED" | "PENDING";
  message: string;
  timestamp: Date;
}

export const HiveCommand: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "1",
      status: "COMPLETED",
      message: 'check_vitals - {"api":{"status":"nominal","latency..."',
      timestamp: new Date(),
    },
    {
      id: "2",
      status: "FAILED",
      message: "scan_moderation - {}...",
      timestamp: new Date(),
    },
    {
      id: "3",
      status: "COMPLETED",
      message: 'check_vitals - {"api":{"status":"nominal","latency..."',
      timestamp: new Date(),
    },
    {
      id: "4",
      status: "COMPLETED",
      message: 'check_vitals - {"api":{"status":"nominal","latency..."',
      timestamp: new Date(),
    },
  ]);

  // 🛡️ Security Check
  useEffect(() => {
    const verifyAccess = async () => {
      const authorized = await checkIsAdmin();
      if (!authorized) {
        toast.error("ACCÈS REFUSÉ: Niveau d'accréditation insuffisant.");
        navigate("/"); // Eject to home
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    };
    verifyAccess();
  }, [navigate]);

  if (loading || !isAdmin) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-4 font-mono">
      {/* Access Header */}
      <div className="flex items-center justify-between mb-8 border-b border-gold-500/30 pb-4">
        <h1 className="text-xl font-bold text-gold-500 flex items-center gap-2">
          <span>{">_"}</span> HIVE COMMAND CENTER
        </h1>
        <span className="px-3 py-1 rounded-full border border-green-500/50 text-green-400 text-xs font-bold bg-green-900/20">
          ONLINE
        </span>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Creation Bee */}
        <div className="bg-black/40 border border-gold-500/20 rounded-xl p-5 hover:border-gold-500/50 transition-colors">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-gold-500 mb-1">📹</div>
              <h3 className="font-bold text-lg text-white">CREATION BEE</h3>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Prompt for K"
              className="w-full bg-black/60 border border-gold-500/20 rounded-lg p-3 text-sm focus:border-gold-500 outline-none"
            />
            <button className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 rounded-lg text-sm transition-colors">
              GENERATE VIDEO
            </button>
          </div>
        </div>

        {/* Security Bee */}
        <div className="bg-black/40 border border-red-900/30 rounded-xl p-5 hover:border-red-600/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-red-500 mb-1">🛡️</div>
              <h3 className="font-bold text-lg text-red-500">SECURITY BEE</h3>
            </div>
          </div>
          <p className="text-red-400/60 text-xs mb-8">
            Initiate deep scan of recent content logs.
          </p>

          <button className="w-full bg-transparent border border-red-900 text-red-700 hover:bg-red-900/20 hover:text-red-500 font-bold py-3 rounded-lg text-sm transition-colors">
            RUN DRILL
          </button>
        </div>

        {/* Health Bee */}
        <div className="bg-black/40 border border-blue-900/30 rounded-xl p-5 hover:border-blue-600/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-blue-500 mb-1">⚡</div>
              <h3 className="font-bold text-lg text-blue-500">HEALTH BEE</h3>
            </div>
          </div>
          <p className="text-blue-400/60 text-xs mb-8">
            Check database latency and system vitals.
          </p>

          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors">
            CHECK VITALS
          </button>
        </div>
      </div>

      {/* Neurosphere Live Feed */}
      <div className="bg-black border border-white/10 rounded-xl p-6 min-h-[300px]">
        <h3 className="text-gold-600/80 font-bold text-sm mb-4 tracking-wider">
          NEUROSPHERE LIVE FEED
        </h3>

        <div className="space-y-2 font-mono text-xs">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex gap-3 border-b border-white/5 pb-2 last:border-0"
            >
              <span
                className={
                  log.status === "COMPLETED"
                    ? "text-green-500"
                    : log.status === "FAILED"
                      ? "text-red-500"
                      : "text-yellow-500"
                }
              >
                [{log.status}]
              </span>
              <span className="text-gray-400">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HiveCommand;
