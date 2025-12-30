import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Shield, Video, Terminal } from "lucide-react";

export function SwarmDebug() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Subscribe to the Colony's Thoughts
  useEffect(() => {
    fetchTasks();
    const subscription = supabase
      .channel("colony_tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "colony_tasks" },
        (_payload: any) => {
          fetchTasks();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchTasks() {
    const { data } = await supabase
      .from("colony_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setTasks(data);
  }

  // 2. Command Functions
  async function triggerVideoBee() {
    if (!prompt) return;
    setLoading(true);
    await supabase.from("colony_tasks").insert({
      command: "generate_video",
      status: "pending",
      metadata: { prompt: prompt, target_bee: "content_bee" },
    });
    setPrompt("");
    setLoading(false);
  }

  async function triggerSecurityDrill() {
    setLoading(true);
    await supabase.from("colony_tasks").insert({
      command: "scan_moderation", // Will trigger a scan of recent posts
      status: "pending",
      metadata: {
        target_bee: "security_bee",
        target: "self_check",
        reason: "Manual drill initiated",
      },
    });
    setLoading(false);
  }

  async function triggerHealthCheck() {
    setLoading(true);
    await supabase.from("colony_tasks").insert({
      command: "check_vitals",
      status: "pending",
      metadata: { target_bee: "health_bee", scope: "full_system" },
    });
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-black/90 border-yellow-500/20 text-yellow-500/80 font-mono my-8">
      <CardHeader className="border-b border-yellow-500/20 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            HIVE COMMAND CENTER
          </CardTitle>
          <Badge
            variant="outline"
            className="border-green-500 text-green-500 animate-pulse"
          >
            ONLINE
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* Command Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Creation Module */}
          <div className="space-y-2 p-3 border border-yellow-500/10 rounded bg-yellow-500/5">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Video className="w-4 h-4" /> CREATION BEE
            </div>
            <Input
              placeholder="Prompt for Kling..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-black border-yellow-500/20 h-8 text-xs"
            />
            <Button
              size="sm"
              onClick={triggerVideoBee}
              disabled={loading || !prompt}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black h-7 text-xs"
            >
              GENERATE VIDEO
            </Button>
          </div>

          {/* Security Module */}
          <div className="space-y-2 p-3 border border-red-500/10 rounded bg-red-500/5">
            <div className="flex items-center gap-2 text-sm font-bold text-red-400">
              <Shield className="w-4 h-4" /> SECURITY BEE
            </div>
            <div className="text-[10px] text-red-400/60 leading-tight h-8">
              Initiate deep scan of recent content logs.
            </div>
            <Button
              size="sm"
              onClick={triggerSecurityDrill}
              disabled={loading}
              variant="destructive"
              className="w-full h-7 text-xs"
            >
              RUN DRILL
            </Button>
          </div>

          {/* Health Module */}
          <div className="space-y-2 p-3 border border-blue-500/10 rounded bg-blue-500/5">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
              <Activity className="w-4 h-4" /> HEALTH BEE
            </div>
            <div className="text-[10px] text-blue-400/60 leading-tight h-8">
              Check database latency and system vitals.
            </div>
            <Button
              size="sm"
              onClick={triggerHealthCheck}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
            >
              CHECK VITALS
            </Button>
          </div>
        </div>

        {/* Live Feed */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-yellow-500/50">
            Neurosphere Live Feed
          </h3>
          <div className="bg-black border border-yellow-500/10 rounded p-2 h-48 overflow-y-auto space-y-2 font-mono text-xs">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex gap-2 border-b border-white/5 pb-1"
              >
                <span
                  className={`
                  ${task.status === "completed" ? "text-green-500" : ""}
                  ${task.status === "processing" ? "text-blue-500" : ""}
                  ${task.status === "failed" ? "text-red-500" : ""}
                  ${task.status === "pending" ? "text-yellow-500" : ""}
                  ${task.status === "async_waiting" ? "text-purple-500" : ""}
                `}
                >
                  [{task.status?.toUpperCase()}]
                </span>
                <span className="text-white/70">{task.command}</span>
                {task.result && (
                  <span className="text-white/40 truncate">
                    - {JSON.stringify(task.result).substring(0, 50)}...
                  </span>
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-10 text-white/20">
                Waiting for signals...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SwarmDebug;
