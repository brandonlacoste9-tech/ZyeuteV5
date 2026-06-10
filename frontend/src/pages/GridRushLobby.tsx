import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  quickMatch,
  createInvite,
  createBotMatch,
  getWallet,
} from "@/services/gridRushService";
import { ArcadeShell } from "@/components/arcade/ArcadeShell";
import {
  arcadeBtnGhost,
  arcadeBtnPrimary,
  arcadeBtnSecondary,
  arcadeCard,
  arcadeTokenChip,
} from "@/components/arcade/arcade-ui";

const STAKE_TIERS = [100, 250, 500] as const;

export default function GridRushLobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stake, setStake] = useState<(typeof STAKE_TIERS)[number]>(100);
  const [loading, setLoading] = useState<"queue" | "invite" | "bot" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await getWallet();
      if (!cancelled && data) setBalance(data.tokenBalance);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleQuickMatch = async () => {
    if (!user) return navigate("/login");
    if (balance !== null && balance < stake) {
      setError("Pas assez de jetons pour cette mise.");
      return;
    }

    setLoading("queue");
    setError(null);
    const { data, error: apiError } = await quickMatch(stake);
    setLoading(null);

    if (apiError || !data) {
      setError(apiError || "Erreur de matchmaking");
      return;
    }

    navigate(`/arcade/grid-rush/${data.id}`);
  };

  const handleCreateInvite = async () => {
    if (!user) return navigate("/login");
    if (balance !== null && balance < stake) {
      setError("Pas assez de jetons pour cette mise.");
      return;
    }

    setLoading("invite");
    setError(null);
    const { data, error: apiError } = await createInvite(stake);
    setLoading(null);

    if (apiError || !data) {
      setError(apiError || "Erreur lors de la création");
      return;
    }

    navigate(`/arcade/grid-rush/${data.id}`);
  };

  const handlePlayBot = async () => {
    if (!user) return navigate("/login");
    if (balance !== null && balance < stake) {
      setError("Pas assez de jetons pour cette mise.");
      return;
    }

    setLoading("bot");
    setError(null);
    const { data, error: apiError } = await createBotMatch(stake);
    setLoading(null);

    if (apiError || !data) {
      setError(apiError || "Erreur lors du lancement");
      return;
    }

    navigate(`/arcade/grid-rush/${data.id}`);
  };

  return (
    <ArcadeShell
      title="Grid Rush"
      subtitle="The Speed Battle — 1v1"
      icon={<Zap className="w-5 h-5 shrink-0" />}
      headerRight={
        <span className={arcadeTokenChip}>
          <Star className="w-3.5 h-3.5 fill-[#ffe600] arcade-text-yellow" />
          {balance ?? "…"}
        </span>
      }
    >
      <div className="space-y-6 pb-6">
        <section className={`${arcadeCard} p-5`}>
          <h2 className="text-sm font-semibold arcade-text-muted uppercase tracking-wider mb-4 flex items-center gap-1">
            Mise{" "}
            <Star className="w-3.5 h-3.5 fill-[#ffe600] arcade-text-yellow" />{" "}
            jetons
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {STAKE_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setStake(tier)}
                className={`py-3 min-h-[48px] rounded-sm font-black text-lg transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1 ${
                  stake === tier
                    ? "bg-[#ffe600] text-black shadow-[0_0_16px_rgba(255,230,0,0.35)]"
                    : "bg-[#1a1430] border border-[rgba(0,243,255,0.3)] arcade-text-muted hover:border-[rgba(0,243,255,0.55)]"
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${stake === tier ? "fill-black" : "fill-[#ffe600] arcade-text-yellow"}`}
                />
                {tier}
              </button>
            ))}
          </div>
          <p className="text-xs arcade-text-dim mt-3 text-center">
            Gagnant reçoit un GG Gift de {stake * 2} étoiles · Égalité =
            remboursement
          </p>
        </section>

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {error}
          </p>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={loading !== null}
          onClick={handleQuickMatch}
          className={`${arcadeBtnPrimary} disabled:opacity-50`}
        >
          {loading === "queue" ? "Recherche..." : "Match Rapide"}
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={loading !== null}
          onClick={handleCreateInvite}
          className={`${arcadeBtnSecondary} disabled:opacity-50`}
        >
          {loading === "invite" ? "Création..." : "Inviter un ami"}
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={loading !== null}
          onClick={handlePlayBot}
          className={`${arcadeBtnGhost} disabled:opacity-50`}
        >
          {loading === "bot" ? "Lancement..." : "Jouer contre le bot (test)"}
        </motion.button>

        <section
          className={`${arcadeCard} p-4 text-sm arcade-text-muted space-y-2`}
        >
          <p>
            <span className="arcade-text-yellow font-bold">Règles:</span> Tape
            les chiffres 1→16 le plus vite possible. Chaque grille complétée =
            +1 point. 45 secondes chrono. Le perdant envoie ses jetons en GG
            Gift au gagnant.
          </p>
        </section>
      </div>
    </ArcadeShell>
  );
}
