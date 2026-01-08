import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import axios from "axios";
import { Gamepad, Trophy, Coins, ChevronRight, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface Tournament {
    id: string;
    title: string;
    description: string;
    entryFee: number;
    totalPool: number;
}

const ArcadeLobby: React.FC = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setLocation] = useLocation();

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await axios.get("/api/royale/tournaments");
                setTournaments(res.data);
            } catch (err) {
                console.error("Failed to fetch tournaments", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    const handleJoin = async (tournamentId: string) => {
        try {
            const res = await axios.post("/api/royale/join", { tournamentId });
            if (res.data.success) {
                setLocation(`/royale/play/${tournamentId}`);
            } else {
                alert("Not enough Piasses! 🍟");
            }
        } catch (err) {
            console.error("Failed to join", err);
            alert("System Error. Try again later.");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-purple-500 font-mono">
                <Activity className="w-12 h-12 animate-spin mb-4" />
                <span className="animate-pulse">LOADING ARCADE...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
            <header className="mb-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 mb-2"
                >
                    <div className="p-3 bg-purple-600 rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.5)]">
                        <Gamepad className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                        Zyeuté Arcade
                    </h1>
                </motion.div>
                <p className="text-slate-400 font-mono text-sm tracking-widest uppercase ml-16">
                    High Stakes • Poutine Royale
                </p>
            </header>

            <div className="grid gap-6 max-w-2xl mx-auto">
                {tournaments.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed border-slate-800 rounded-3xl">
                        <p className="text-slate-500 uppercase tracking-widest text-sm">No Active Tournaments</p>
                    </div>
                ) : (
                    tournaments.map((t, i) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-purple-500 transition-all duration-300"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Trophy className="w-32 h-32" />
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1 group-hover:text-purple-400 transition-colors">
                                        {t.title}
                                    </h2>
                                    <p className="text-slate-400 text-sm mb-4 max-w-sm">
                                        {t.description || "The ultimate stacking challenge. Winner takes the pool!"}
                                    </p>

                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                                            <Coins className="w-4 h-4 text-yellow-500" />
                                            <span className="text-xs font-bold text-yellow-500 uppercase">
                                                {t.entryFee} Piasses
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                                            <Trophy className="w-4 h-4 text-purple-400" />
                                            <span className="text-xs font-bold text-purple-400 uppercase">
                                                Pool: {t.totalPool} $CAD
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleJoin(t.id)}
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase py-4 px-8 rounded-2xl shadow-lg shadow-purple-900/20 group-hover:shadow-purple-500/30 transition-shadow"
                                >
                                    Join Royale
                                    <ChevronRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <footer className="mt-24 text-center">
                <div className="inline-flex items-center gap-2 text-xs text-slate-600 font-mono tracking-widest uppercase">
                    <Activity className="w-3 h-3 text-green-500" />
                    Server Status: Operational
                </div>
            </footer>
        </div>
    );
};

export default ArcadeLobby;
