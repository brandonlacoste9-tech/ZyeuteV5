/**
 * Moderation Dashboard - Admin-only moderation queue
 * Real-time content moderation and user management
 */

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "../../components/Header";
import { Button } from "../../components/Button";
import { Avatar } from "../../components/Avatar";
import { supabase } from "../../lib/supabase";
import { toast } from "../../components/Toast";
import { formatNumber, getTimeAgo } from "../../lib/utils";
import type { User } from "../../types";
import { logger } from "../../lib/logger";

const moderationLogger = logger.withContext("Moderation");

interface ModerationLog {
  id: string;
  content_type: string;
  content_id: string;
  user_id: string;
  user?: User;
  ai_severity: string;
  ai_categories: string[];
  ai_confidence: number;
  ai_reason: string;
  ai_action: string;
  status: string;
  human_reviewed?: boolean;
  human_reviewer_id?: string;
  human_decision?: string;
  reviewed_at?: string;
  created_at: string;
}

interface Stats {
  pending: number;
  reviewed_today: number;
  removed_today: number;
  active_bans: number;
}

export const Moderation: React.FC = () => {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    reviewed_today: 0,
    removed_today: 0,
    active_bans: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status: string;
    severity: string;
    type: string;
  }>({
    status: "all",
    severity: "all",
    type: "all",
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: userData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!userData?.is_admin) {
        toast.error("Accès refusé: Admin seulement");
        window.location.href = "/";
        return;
      }

      setCurrentUser(userData);
    };

    checkAdmin();
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("moderation_logs")
        .select("*, user:users(*)")
        .order("created_at", { ascending: false })
        .limit(50);

      // Apply filters
      if (filter.status !== "all") {
        query = query.eq("status", filter.status);
      }
      if (filter.severity !== "all") {
        query = query.eq("ai_severity", filter.severity);
      }
      if (filter.type !== "all") {
        query = query.eq("content_type", filter.type);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      moderationLogger.error("Error fetching logs:", error);
      toast.error("Erreur lors du chargement des logs");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Pending count
      const { count: pending } = await supabase
        .from("moderation_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Reviewed today
      const { count: reviewed } = await supabase
        .from("moderation_logs")
        .select("*", { count: "exact", head: true })
        .eq("human_reviewed", true)
        .gte("reviewed_at", today.toISOString());

      // Removed today
      const { count: removed } = await supabase
        .from("moderation_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "removed")
        .gte("created_at", today.toISOString());

      // Active bans
      const { count: bans } = await supabase
        .from("user_strikes")
        .select("*", { count: "exact", head: true })
        .or(
          "is_permanent_ban.eq.true,ban_until.gt." + new Date().toISOString(),
        );

      setStats({
        pending: pending || 0,
        reviewed_today: reviewed || 0,
        removed_today: removed || 0,
        active_bans: bans || 0,
      });
    } catch (error) {
      moderationLogger.error("Error fetching stats:", error);
    }
  }, []);

  // Fetch moderation logs
  useEffect(() => {
    if (!currentUser) return;
    fetchLogs();
    fetchStats();

    // Subscribe to new logs
    const channel = supabase
      .channel("moderation_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "moderation_logs",
        },
        () => {
          fetchLogs();
          fetchStats();
          toast.info("Nouveau contenu à modérer");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchLogs, fetchStats]);

  const handleApprove = async (logId: string) => {
    try {
      await supabase
        .from("moderation_logs")
        .update({
          status: "approved",
          human_reviewed: true,
          human_reviewer_id: currentUser?.id,
          human_decision: "approve",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", logId);

      toast.success("Contenu approuvé");
      fetchLogs();
      fetchStats();
    } catch (error) {
      moderationLogger.error("Error approving:", error);
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleRemove = async (log: ModerationLog) => {
    try {
      // Mark as removed
      await supabase
        .from("moderation_logs")
        .update({
          status: "removed",
          human_reviewed: true,
          human_reviewer_id: currentUser?.id,
          human_decision: "remove",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", log.id);

      // Delete the actual content
      if (log.content_type === "post") {
        await supabase.from("posts").delete().eq("id", log.content_id);
      } else if (log.content_type === "comment") {
        await supabase.from("comments").delete().eq("id", log.content_id);
      }

      toast.success("Contenu supprimé");
      fetchLogs();
      fetchStats();
    } catch (error) {
      moderationLogger.error("Error removing:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleBanUser = async (
    userId: string,
    duration: "temp" | "permanent",
  ) => {
    try {
      const banUntil =
        duration === "temp"
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null;

      // Check existing strikes
      const { data: existingStrikes } = await supabase
        .from("user_strikes")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingStrikes) {
        await supabase
          .from("user_strikes")
          .update({
            strike_count: existingStrikes.strike_count + 1,
            ban_until: banUntil,
            is_permanent_ban: duration === "permanent",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("user_strikes").insert({
          user_id: userId,
          strike_count: 1,
          ban_until: banUntil,
          is_permanent_ban: duration === "permanent",
        });
      }

      toast.success(
        duration === "permanent"
          ? "Utilisateur banni définitivement"
          : "Utilisateur banni 7 jours",
      );
      fetchLogs();
      fetchStats();
    } catch (error) {
      moderationLogger.error("Error banning user:", error);
      toast.error("Erreur lors du bannissement");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-green-600";
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      critical: "🔴 CRITIQUE",
      high: "🟠 ÉLEVÉ",
      medium: "🟡 MOYEN",
      low: "🔵 FAIBLE",
      safe: "🟢 SÛR",
    };
    return labels[severity] || severity;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold-400 animate-pulse">
          Vérification des permissions...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="🛡️ Modération" showBack={true} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              <span className="text-white/60 text-sm">En attente</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {formatNumber(stats.pending)}
            </p>
          </div>

          <div className="card-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <span className="text-white/60 text-sm">Révisé auj.</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {formatNumber(stats.reviewed_today)}
            </p>
          </div>

          <div className="card-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-2xl">🗑️</span>
              </div>
              <span className="text-white/60 text-sm">Supprimé auj.</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {formatNumber(stats.removed_today)}
            </p>
          </div>

          <div className="card-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <span className="text-white/60 text-sm">Bans actifs</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {formatNumber(stats.active_bans)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card-edge p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-white text-sm mb-2">Statut</label>
              <select
                value={filter.status}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value })
                }
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold-400"
              >
                <option value="all">Tous</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="removed">Supprimé</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm mb-2">Sévérité</label>
              <select
                value={filter.severity}
                onChange={(e) =>
                  setFilter({ ...filter, severity: e.target.value })
                }
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold-400"
              >
                <option value="all">Toutes</option>
                <option value="critical">Critique</option>
                <option value="high">Élevé</option>
                <option value="medium">Moyen</option>
                <option value="low">Faible</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm mb-2">Type</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold-400"
              >
                <option value="all">Tous</option>
                <option value="post">Posts</option>
                <option value="comment">Commentaires</option>
                <option value="bio">Bio</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchLogs} variant="outline" size="sm">
                🔄 Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Moderation Queue */}
        <div className="space-y-4">
          <h2 className="text-white text-xl font-bold">File d&apos;attente</h2>

          {isLoading ? (
            <div className="card-edge p-8 text-center">
              <div className="text-gold-400 animate-pulse">Chargement...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="card-edge p-8 text-center">
              <p className="text-white/60">Aucun contenu à modérer 🎉</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="card-edge p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {log.user && (
                      <Avatar
                        src={log.user.avatar_url}
                        size="md"
                        isVerified={log.user.is_verified}
                      />
                    )}
                    <div>
                      <p className="text-white font-semibold">
                        @{log.user?.username || "Utilisateur inconnu"}
                      </p>
                      <p className="text-white/60 text-sm">
                        {getTimeAgo(new Date(log.created_at))} •{" "}
                        {log.content_type}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${getSeverityColor(log.ai_severity)}`}
                  >
                    {getSeverityLabel(log.ai_severity)}
                  </span>
                </div>

                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-white/80 text-sm mb-2">
                    <strong>Raison IA:</strong> {log.ai_reason}
                  </p>
                  <p className="text-white/60 text-sm mb-2">
                    <strong>Confiance:</strong> {log.ai_confidence}%
                  </p>
                  <p className="text-white/60 text-sm">
                    <strong>Catégories:</strong>{" "}
                    {log.ai_categories.join(", ") || "Aucune"}
                  </p>
                </div>

                {log.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(log.id)}
                      className="flex-1"
                    >
                      ✅ Approuver
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRemove(log)}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      🗑️ Supprimer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBanUser(log.user_id, "temp")}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      🚫 Ban 7j
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBanUser(log.user_id, "permanent")}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      🔒 Ban permanent
                    </Button>
                  </div>
                )}

                {log.status !== "pending" && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                    <p className="text-green-400 text-sm">
                      ✅ Traité: {log.human_decision} le{" "}
                      {log.reviewed_at &&
                        new Date(log.reviewed_at).toLocaleDateString("fr-CA")}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Moderation;
