import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Loader2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import GridRushGame from "@/components/games/GridRushGame";
import {
  getMatch,
  joinMatch,
  cancelMatch,
  type GridRushMatch,
} from "@/services/gridRushService";

export default function GridRushMatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [match, setMatch] = useState<GridRushMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;

    void (async () => {
      const { data, error: apiError } = await getMatch(matchId);
      if (cancelled) return;
      if (apiError || !data) {
        setError(apiError || "Partie introuvable");
        setMatch(null);
      } else {
        setMatch(data);
        setError(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`grid_rush_lobby_${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "grid_rush_matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setMatch({
            id: row.id as string,
            status: row.status as GridRushMatch["status"],
            player1Id: row.player_1_id as string,
            player2Id: (row.player_2_id as string) ?? null,
            player1Score: Number(row.player_1_score ?? 0),
            player2Score: Number(row.player_2_score ?? 0),
            stakeCennes: Number(row.stake_cennes ?? 500),
            winnerId: (row.winner_id as string) ?? null,
            startedAt: (row.started_at as string) ?? null,
            endsAt: (row.ends_at as string) ?? null,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const handleJoin = async () => {
    if (!matchId || !user) return;
    setJoining(true);
    setError(null);
    const { data, error: apiError } = await joinMatch(matchId);
    setJoining(false);
    if (apiError || !data) {
      setError(apiError || "Impossible de rejoindre");
      return;
    }
    setMatch(data);
  };

  const handleCancel = async () => {
    if (!matchId) return;
    const { error: apiError } = await cancelMatch(matchId);
    if (!apiError) navigate("/arcade/grid-rush");
  };

  const copyInviteLink = async () => {
    const url = `${window.location.origin}/arcade/grid-rush/${matchId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black leather-overlay flex items-center justify-center text-gold-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black leather-overlay flex items-center justify-center text-gold-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen bg-black leather-overlay flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/arcade/grid-rush")}
          className="text-gold-400 underline"
        >
          Retour au lobby
        </button>
      </div>
    );
  }

  if (!match) return null;

  const isHost = match.player1Id === user.id;
  const isGuest = match.player2Id === user.id;
  const canJoin = match.status === "WAITING" && !match.player2Id && !isHost;
  const isWaiting = match.status === "WAITING";

  if (isWaiting) {
    return (
      <div className="min-h-screen bg-black leather-overlay text-white p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full leather-card rounded-2xl p-8 stitched border border-gold-500/20 text-center space-y-6">
          <Users className="w-12 h-12 text-gold-400 mx-auto" />
          <h1 className="text-2xl font-black text-gold-400 uppercase">
            {isHost ? "En attente d'un adversaire" : "Partie ouverte"}
          </h1>
          <p className="text-leather-300 text-sm">
            Mise: {match.stakeCennes}¢ · Partage le lien à ton chum
          </p>

          {isHost && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={copyInviteLink}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gold-500/40 text-gold-400 font-bold"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copié!" : "Copier le lien d'invitation"}
            </motion.button>
          )}

          {canJoin && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              disabled={joining}
              onClick={handleJoin}
              className="w-full py-4 rounded-xl bg-gold-500 text-black font-black uppercase disabled:opacity-50"
            >
              {joining ? "Connexion..." : `Rejoindre (${match.stakeCennes}¢)`}
            </motion.button>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {isHost && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-leather-400 text-sm hover:text-white"
            >
              Annuler et récupérer ma mise
            </button>
          )}
        </div>
      </div>
    );
  }

  if (match.status === "ACTIVE" || match.status === "COMPLETED") {
    if (!isHost && !isGuest) {
      return (
        <div className="min-h-screen bg-black leather-overlay flex items-center justify-center text-leather-300">
          Accès refusé
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black leather-overlay">
        <GridRushGame
          matchId={match.id}
          currentUserId={user.id}
          initialMatch={match}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black leather-overlay flex items-center justify-center text-leather-300">
      Partie {match.status.toLowerCase()}
    </div>
  );
}
