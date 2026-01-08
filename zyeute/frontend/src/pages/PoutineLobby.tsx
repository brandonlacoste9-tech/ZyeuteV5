import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Correct path
import { FaTrophy, FaCoins, FaGamepad } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface Tournament {
  id: string;
  title: string;
  entryFee: number;
  prizePool: number;
  expiresAt: string;
}

interface PoutineLobbyProps {
  mockMode?: boolean;
  mockTournaments?: Tournament[];
  onJoin?: (tournamentId: string) => void;
}

export default function PoutineLobby({
  mockMode = false,
  mockTournaments = [],
  onJoin,
}: PoutineLobbyProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mockMode) {
      setTournaments(mockTournaments.length > 0 ? mockTournaments : [
        {
          id: "mock-1",
          title: t("lobby.mock_tournament_title"),
          entryFee: 0,
          prizePool: 1000,
          expiresAt: new Date().toISOString()
        }
      ]);
      setLoading(false);
    } else {
      fetchTournaments();
    }
  }, [mockMode]); // kept simple

  const fetchTournaments = async () => {
    try {
      // Direct fetch if api wrapper doesn't have it yet
      const res = await fetch("/api/royale/tournaments");
      const data = await res.json();

      if (Array.isArray(data)) {
        setTournaments(data);
      } else {
        console.error("Invalid tournament data received:", data);
        setTournaments([]);
        // Optional: Show toast error if needed, but keeping it silent for lobby to verify "Poutine Royale" text presence
      }
    } catch (error) {
      console.error("Failed to load tournaments", error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (tournamentId: string, fee: number) => {
    if (mockMode && onJoin) {
      onJoin(tournamentId);
      return;
    }

    if (!user) return navigate("/login");

    if (user.coins < fee) {
      alert("Pas assez de piasses! Allez en gagner ou en acheter.");
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
          <FaGamepad /> {t("lobby.title")}
        </h1>
        <div className="text-xl flex items-center gap-2">
          <FaCoins /> {user?.coins || 0} {t("lobby.balance")}
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <section className="mb-12">
          <h2 className="text-2xl mb-6 flex items-center gap-2">
            <FaTrophy className="text-yellow-600" /> {t("lobby.active_tournaments")}
          </h2>

          {loading ? (
            <div className="text-center animate-pulse">
              Chargement de la matrice...
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {tournaments.map((tour) => (
                <motion.div
                  key={tour.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-900 border-2 border-yellow-600 p-6 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.3)] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-yellow-600 text-black px-3 py-1 font-bold text-sm">
                    {t("arcade.status.live")}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tour.title}</h3>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-sm text-gray-400">{t("lobby.prize_pool")}</p>
                      <p className="text-2xl font-black text-green-400">
                        {tour.prizePool} $
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{t("lobby.entry")}</p>
                      <p className="text-xl font-bold">{tour.entryFee} 🪙</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoin(tour.id, tour.entryFee)}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 uppercase tracking-wider transition-colors"
                  >
                    {t("lobby.insert_coin")}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Placeholder for Leaderboard */}
        <section className="opacity-50 pointer-events-none filter blur-sm">
          <h2 className="text-xl mb-4">{t("lobby.leaderboard_soon")}</h2>
          <div className="h-32 bg-gray-900 border border-gray-700 rounded flex items-center justify-center">
            {t("lobby.king")}
          </div>
        </section>
      </main>
    </div>
  );
}
