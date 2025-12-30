import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Correct path
import { FaTrophy, FaCoins, FaGamepad } from "react-icons/fa";

interface Tournament {
  id: string;
  title: string;
  entryFee: number;
  prizePool: number;
  expiresAt: string;
}

export default function PoutineLobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      // Direct fetch if api wrapper doesn't have it yet
      const res = await fetch("/api/royale/tournaments");
      const data = await res.json();
      setTournaments(data);
    } catch (error) {
      console.error("Failed to load tournaments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (tournamentId: string, fee: number) => {
    if (!user) return navigate("/login");

    if (user.coins < fee) {
      alert("Pas assez de piasses! Alez en gagner ou en acheter.");
      return;
    }

    try {
      const res = await fetch("/api/royale/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Verify how auth is handled
        },
        body: JSON.stringify({ tournamentId }),
      });

      if (res.ok) {
        navigate(`/royale/play/${tournamentId}`);
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error("Join error", error);
      alert("Erreur de connexion");
    }
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4 font-mono">
      <header className="flex justify-between items-center mb-8 border-b-2 border-yellow-600 pb-4">
        <h1 className="text-4xl font-black uppercase tracking-widest flex items-center gap-2">
          <FaGamepad /> Poutine Royale
        </h1>
        <div className="text-xl flex items-center gap-2">
          <FaCoins /> {user?.coins || 0} Piasses
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <section className="mb-12">
          <h2 className="text-2xl mb-6 flex items-center gap-2">
            <FaTrophy className="text-yellow-600" /> Tournois Actifs
          </h2>

          {loading ? (
            <div className="text-center animate-pulse">
              Chargement de la matrice...
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {tournaments.map((t) => (
                <motion.div
                  key={t.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-900 border-2 border-yellow-600 p-6 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.3)] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-yellow-600 text-black px-3 py-1 font-bold text-sm">
                    LIVE
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t.title}</h3>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Prize Pool</p>
                      <p className="text-2xl font-black text-green-400">
                        {t.prizePool} $
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Entrée</p>
                      <p className="text-xl font-bold">{t.entryFee} 🪙</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoin(t.id, t.entryFee)}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 uppercase tracking-wider transition-colors"
                  >
                    INSERT COIN
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Placeholder for Leaderboard */}
        <section className="opacity-50 pointer-events-none filter blur-sm">
          <h2 className="text-xl mb-4">Temple de la Renommée (Coming Soon)</h2>
          <div className="h-32 bg-gray-900 border border-gray-700 rounded flex items-center justify-center">
            Poutine King: ???
          </div>
        </section>
      </main>
    </div>
  );
}
