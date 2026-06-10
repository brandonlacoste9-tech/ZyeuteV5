import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Users, Star, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import GridRushGame from "@/components/games/GridRushGame";
import {
  getMatch,
  joinMatch,
  cancelMatch,
  type GridRushMatch,
} from "@/services/gridRushService";
import { ArcadeBackdrop } from "@/components/arcade/ArcadeBackdrop";
import { ArcadeLoading } from "@/components/arcade/ArcadeLoading";
import {
  arcadeBtnGhost,
  arcadeBtnPrimary,
  arcadeBtnSecondary,
  arcadeCard,
  arcadeTextCyan,
  arcadeTextMuted,
  arcadeTextYellow,
} from "@/components/arcade/arcade-ui";

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
            stakeTokens: Number(row.stake_tokens ?? 500),
            isBot: Boolean(row.is_bot ?? false),
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

  if (!user || loading) {
    return <ArcadeLoading icon={Zap} label="Chargement de la partie…" />;
  }

  if (error && !match) {
    return (
      <ArcadeBackdrop className="flex flex-col items-center justify-center p-6 text-center min-h-screen">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/arcade/grid-rush")}
          className={`${arcadeBtnSecondary} max-w-xs`}
        >
          Retour au lobby
        </button>
      </ArcadeBackdrop>
    );
  }

  if (!match || match.id !== matchId) {
    return <ArcadeLoading icon={Zap} label="Chargement de la partie…" />;
  }

  const isHost = match.player1Id === user.id;
  const isGuest = match.player2Id === user.id;
  const canJoin = match.status === "WAITING" && !match.player2Id && !isHost;
  const isWaiting = match.status === "WAITING";

  if (isWaiting) {
    return (
      <ArcadeBackdrop className="p-6 flex flex-col items-center justify-center pb-24 min-h-screen">
        <div
          className={`max-w-md w-full ${arcadeCard} p-8 text-center space-y-6`}
        >
          <Users className={`w-12 h-12 mx-auto ${arcadeTextCyan}`} />
          <h1
            className={`text-lg font-black uppercase tracking-wide arcade-font-pixel leading-relaxed ${arcadeTextYellow}`}
          >
            {isHost ? "En attente P2" : "Partie ouverte"}
          </h1>
          <p
            className={`text-sm flex items-center justify-center gap-1 ${arcadeTextMuted}`}
          >
            Mise:{" "}
            <Star className={`w-3.5 h-3.5 fill-current ${arcadeTextYellow}`} />
            {match.stakeTokens} · Partage le lien à ton chum
          </p>

          {isHost && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={copyInviteLink}
              className={`${arcadeBtnSecondary} flex items-center justify-center gap-2 py-3`}
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
              className={`${arcadeBtnPrimary} disabled:opacity-50`}
            >
              {joining
                ? "Connexion..."
                : `Rejoindre (${match.stakeTokens} étoiles)`}
            </motion.button>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {isHost && (
            <button
              type="button"
              onClick={handleCancel}
              className={`${arcadeBtnGhost} py-2 text-xs`}
            >
              Annuler et récupérer ma mise
            </button>
          )}
        </div>
      </ArcadeBackdrop>
    );
  }

  if (match.status === "ACTIVE" || match.status === "COMPLETED") {
    if (!isHost && !isGuest && !match.isBot) {
      return (
        <ArcadeBackdrop className="flex items-center justify-center p-6 text-center min-h-screen">
          <p className={arcadeTextMuted}>
            Accès refusé — tu n&apos;es pas dans cette partie.
          </p>
        </ArcadeBackdrop>
      );
    }

    return (
      <ArcadeBackdrop className="pb-24 min-h-screen">
        <GridRushGame
          key={match.id}
          matchId={match.id}
          currentUserId={user.id}
          initialMatch={match}
          onExit={() => navigate("/arcade/grid-rush")}
        />
      </ArcadeBackdrop>
    );
  }

  return (
    <ArcadeBackdrop className="flex items-center justify-center min-h-screen">
      <p className={arcadeTextMuted}>Partie {match.status.toLowerCase()}</p>
    </ArcadeBackdrop>
  );
}
