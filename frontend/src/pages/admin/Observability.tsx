import React, { useState, useEffect, useRef } from "react";
import { Header } from "../../components/Header";
import { supabase } from "../../lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Trace {
  id: string;
  agentId: string;
  traceType: "thought" | "tool_call" | "error" | "result";
  content: string;
  metadata: any;
  createdAt: string;
}

interface Memory {
  id: string;
  content: string;
  importance: number;
  metadata: any;
  createdAt: string;
  auditStatus?: "pending" | "safe" | "flagged" | "redacted";
  lastAuditedAt?: string;
}

interface Fact {
  id: string;
  category: string;
  content: string;
  confidence: number;
}

export const Observability: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "traces" | "memories" | "compliance"
  >("traces");
  const [traces, setTraces] = useState<Trace[]>([]);

  // Memory Inspector State
  const [targetUserId, setTargetUserId] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Poll for traces
  useEffect(() => {
    if (activeTab !== "traces" || !autoRefresh) return;

    const fetchTraces = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch("/api/admin/traces?limit=50", {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTraces(data.traces);
        }
      } catch (e) {
        console.error("Poll failed", e);
      }
    };

    fetchTraces();
    const interval = setInterval(fetchTraces, 3000);
    return () => clearInterval(interval);
  }, [activeTab, autoRefresh]);

  const fetchMemories = async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/memories/${targetUserId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories);
        setFacts(data.facts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clearTraces = async () => {
    if (!confirm("Effacer tout l'historique de pensées ?")) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await fetch("/api/admin/traces", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setTraces([]);
    setTraces([]);
  };

  const runAudit = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/audit", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) {
        alert("🕵️ Privacy Audit started! Check back in a few moments.");
        fetchMemories(); // Refresh list to see 'pending' status if changed
      }
    } catch (e) {
      console.error("Audit trigger failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20 font-mono text-sm">
      <Header title="🧠 Brain Scan" showBack={true} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab("traces")}
            className={`px-4 py-2 ${activeTab === "traces" ? "text-gold-400 border-b-2 border-gold-400" : "text-white/50"}`}
          >
            Live Thoughts (Traces)
          </button>
          <button
            onClick={() => setActiveTab("memories")}
            className={`px-4 py-2 ${activeTab === "memories" ? "text-gold-400 border-b-2 border-gold-400" : "text-white/50"}`}
          >
            Memory Inspector
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`px-4 py-2 ${activeTab === "compliance" ? "text-green-400 border-b-2 border-green-400" : "text-white/50"}`}
          >
            Loi 25 Compliance
          </button>
        </div>

        {/* TRACES VIEW */}
        {activeTab === "traces" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${autoRefresh ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                <span className="text-white/60">Live Feed</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="text-xs border border-white/20 px-2 py-1 ml-2 rounded text-white hover:bg-white/10"
                >
                  {autoRefresh ? "Pause" : "Resume"}
                </button>
              </div>
              <button
                onClick={clearTraces}
                className="text-red-400 text-xs hover:underline"
              >
                🗑️ Clear Buffer
              </button>
            </div>

            <div className="space-y-2">
              {traces.map((trace) => (
                <div
                  key={trace.id}
                  className="border border-white/10 rounded-lg p-3 bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider
                                    ${
                                      trace.traceType === "thought"
                                        ? "bg-purple-500/20 text-purple-400"
                                        : trace.traceType === "tool_call"
                                          ? "bg-blue-500/20 text-blue-400"
                                          : trace.traceType === "error"
                                            ? "bg-red-500/20 text-red-400"
                                            : "bg-green-500/20 text-green-400"
                                    }
                                `}
                    >
                      {trace.traceType}
                    </span>
                    <span className="text-white/30 text-xs">
                      {formatDistanceToNow(new Date(trace.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="text-white/90 whitespace-pre-wrap pl-2 border-l-2 border-white/5">
                    {trace.content}
                  </div>
                  {trace.metadata && (
                    <details className="mt-2 text-xs text-white/50">
                      <summary className="cursor-pointer hover:text-white">
                        Metadata
                      </summary>
                      <pre className="mt-1 bg-black/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(trace.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEMORY INSPECTOR VIEW */}
        {activeTab === "memories" && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="User UUID..."
                className="bg-white/5 border border-white/20 text-white px-4 py-2 rounded flex-1 focus:border-gold-400 outline-none"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              />
              <button
                onClick={fetchMemories}
                disabled={loading || !targetUserId}
                className="bg-gold-500 text-black font-bold px-6 py-2 rounded disabled:opacity-50"
              >
                {loading ? "Scanning..." : "Scan Brain"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FACTS COLUMN */}
              <div className="space-y-4">
                <h3 className="text-gold-400 font-bold flex items-center gap-2">
                  💎 Distilled Facts ({facts.length})
                </h3>
                {facts.length === 0 && (
                  <p className="text-white/30 italic">
                    No facts extracted yet.
                  </p>
                )}
                {facts.map((fact) => (
                  <div
                    key={fact.id}
                    className="bg-white/5 border border-gold-500/30 p-3 rounded-lg relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-gold-500/20 text-gold-300 text-[10px] px-2 py-0.5 rounded-bl">
                      {fact.category} •{" "}
                      {(Number(fact.confidence) * 100).toFixed(0)}%
                    </div>
                    <p className="text-white mt-2">{fact.content}</p>
                  </div>
                ))}
              </div>

              {/* RAW MEMORIES COLUMN */}
              <div className="space-y-4">
                <h3 className="text-purple-400 font-bold flex items-center gap-2">
                  🎞️ Raw Episodic Memory ({memories.length})
                </h3>
                {memories.length === 0 && (
                  <p className="text-white/30 italic">No memories recorded.</p>
                )}
                {memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="bg-white/5 border border-white/10 p-3 rounded-lg"
                  >
                    <p className="text-white/80 text-sm">{mem.content}</p>
                    <div className="mt-2 flex justify-between items-center text-xs text-white/40">
                      <span>Imp: {mem.importance}</span>
                      <span>
                        {new Date(mem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Observability; // Default export for lazy load
