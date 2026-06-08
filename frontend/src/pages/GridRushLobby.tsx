import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Star, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  quickMatch,
  createInvite,
  getWallet,
} from "@/services/gridRushService";

const STAKE_TIERS = [100, 250, 500] as const;

export default function GridRushLobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stake, setStake] = useState<(typeof STAKE_TIERS)[number]>(500);
  const [loading, setLoading] = useState<"queue" | "invite" | null>(null);
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

  return (
    <div className="min-h-screen bg-black leather-overlay text-white p-4 pb-24">
      <header className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => navigate("/arcade")}
          className="p-2 rounded-lg border border-leather-700 text-gold-400 hover:border-gold-500/50"
          aria-label="Retour à l'arcade"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black uppercase tracking-widest text-gold-400 flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Grid Rush
          </h1>
          <p className="text-leather-300 text-sm">The Speed Battle — 1v1</p>
        </div>
        <div className="flex items-center gap-1 text-gold-400 font-bold tabular-nums">
          <Star className="w-4 h-4 fill-gold-400" />
          {balance ?? "…"}
        </div>
      </header>

      <main className="max-w-md mx-auto space-y-6">
        <section className="leather-card rounded-2xl p-5 stitched border border-gold-500/20">
          <h2 className="text-sm font-semibold text-leather-300 uppercase tracking-wider mb-4 flex items-center gap-1">
            Mise <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />{" "}
            jetons
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {STAKE_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setStake(tier)}
                className={`py-3 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-1 ${
                  stake === tier
                    ? "bg-gold-500 text-black shadow-[0_0_16px_rgba(201,162,39,0.4)]"
                    : "bg-leather-800 border border-leather-600 text-leather-200 hover:border-gold-500/40"
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${stake === tier ? "fill-black" : "fill-gold-400 text-gold-400"}`}
                />
                {tier}
              </button>
            ))}
          </div>
          <p className="text-xs text-leather-400 mt-3 text-center">
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
          className="w-full py-4 rounded-2xl bg-gold-500 text-black font-black uppercase tracking-wider disabled:opacity-50"
        >
          {loading === "queue" ? "Recherche..." : "Match Rapide"}
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={loading !== null}
          onClick={handleCreateInvite}
          className="w-full py-4 rounded-2xl border-2 border-gold-500/60 text-gold-400 font-black uppercase tracking-wider disabled:opacity-50 hover:bg-gold-500/10"
        >
          {loading === "invite" ? "Création..." : "Inviter un ami"}
        </motion.button>

        <section className="leather-card rounded-xl p-4 text-sm text-leather-300 space-y-2">
          <p>
            <span className="text-gold-400 font-bold">Règles:</span> Tape les
            chiffres 1→16 le plus vite possible. Chaque grille complétée = +1
            point. 45 secondes chrono. Le perdant envoie ses jetons en GG Gift
            au gagnant.
          </p>
        </section>
      </main>
    </div>
  );
}
