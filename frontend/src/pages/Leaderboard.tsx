import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Image } from "@/components/Image";

interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isPremium: boolean;
  totalCennes: number;
}

export const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${import.meta.env.VITE_APP_URL || ""}/api/leaderboard/weekly-tippers`, {
          headers
        });

        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  const top3 = users.slice(0, 3);
  const others = users.slice(3);

  // Time until reset
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextMonday = new Date();
      nextMonday.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);
      
      const diff = nextMonday.getTime() - now.getTime();
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      setTimeLeft(`${d}j ${h}h ${m}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Leaderboard 🏆" showBack={true} showSearch={false} />

      <div className="max-w-md mx-auto p-4">
        
        {/* Header Info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gold-400 mb-1">Top Tippers de la Semaine</h1>
          <p className="text-leather-300 text-sm">Le classement se réinitialise dans: <span className="text-orange-400 font-mono font-bold">{timeLeft}</span></p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gold-500/50 mt-4 text-sm font-semibold uppercase tracking-widest">Calcul des scores...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-leather-900 border border-white/10 rounded-2xl p-8 text-center mt-10">
            <div className="text-6xl mb-4 opacity-50">💨</div>
            <h3 className="text-lg font-bold text-white mb-2">Aucun généreux cette semaine!</h3>
            <p className="text-leather-300 text-sm">Sois le premier à envoyer des Cennes pour prendre la couronne 👑</p>
          </div>
        ) : (
          <>
            {/* The Podium */}
            <div className="flex justify-center items-end h-64 mb-10 gap-2 px-2">
              
              {/* 2nd Place */}
              {top3[1] && (
                <div 
                  onClick={() => navigate(`/profile/${top3[1].username}`)}
                  className="relative flex flex-col items-center w-1/3 cursor-pointer group"
                >
                  <div className="absolute -top-14 w-16 h-16 rounded-full border-2 border-slate-300/80 p-0.5 overflow-hidden transition-transform group-hover:scale-110 shadow-[0_0_15px_rgba(203,213,225,0.4)]">
                    <Image src={top3[1].avatarUrl || `https://ui-avatars.com/api/?name=${top3[1].username}&background=random`} alt={top3[1].username} objectFit="cover" />
                  </div>
                  <div className="bg-gradient-to-t from-slate-900 to-slate-800 border-t border-slate-400/50 w-full h-24 rounded-t-lg flex flex-col items-center justify-end pb-3">
                    <span className="text-slate-300 font-bold text-sm truncate w-full text-center px-1">@{top3[1].username}</span>
                    <span className="text-green-400 font-black text-sm">{top3[1].totalCennes}¢</span>
                    <div className="absolute -bottom-3 w-6 h-6 rounded-full bg-slate-800 border border-slate-400 flex items-center justify-center text-slate-300 font-bold text-xs shadow-lg z-10">2</div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div 
                  onClick={() => navigate(`/profile/${top3[0].username}`)}
                  className="relative flex flex-col items-center w-1/3 cursor-pointer group"
                >
                  <div className="absolute -top-6 text-4xl animate-bounce z-20 filter drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">👑</div>
                  <div className="absolute -top-20 w-20 h-20 rounded-full border-2 border-gold-400 p-0.5 overflow-hidden transition-transform group-hover:scale-110 shadow-[0_0_25px_rgba(212,175,55,0.6)] z-10">
                    <Image src={top3[0].avatarUrl || `https://ui-avatars.com/api/?name=${top3[0].username}&background=random`} alt={top3[0].username} objectFit="cover" />
                  </div>
                  <div className="bg-gradient-to-t from-yellow-900/80 to-gold-600/40 border-t-2 border-gold-400 w-full h-32 rounded-t-lg flex flex-col items-center justify-end pb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gold-500/10 mix-blend-overlay"></div>
                    <span className="text-gold-300 font-bold text-sm truncate w-full text-center px-1 z-10">@{top3[0].username}</span>
                    <span className="text-green-400 font-black text-base z-10">{top3[0].totalCennes}¢</span>
                    <div className="absolute -bottom-3 w-8 h-8 rounded-full bg-yellow-900 border-2 border-gold-400 flex items-center justify-center text-gold-400 font-black text-sm shadow-lg z-20">1</div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div 
                  onClick={() => navigate(`/profile/${top3[2].username}`)}
                  className="relative flex flex-col items-center w-1/3 cursor-pointer group"
                >
                  <div className="absolute -top-12 w-14 h-14 rounded-full border-2 border-orange-700/80 p-0.5 overflow-hidden transition-transform group-hover:scale-110 shadow-[0_0_15px_rgba(194,113,33,0.4)]">
                    <Image src={top3[2].avatarUrl || `https://ui-avatars.com/api/?name=${top3[2].username}&background=random`} alt={top3[2].username} objectFit="cover" />
                  </div>
                  <div className="bg-gradient-to-t from-orange-950 to-orange-900/80 border-t border-orange-700/50 w-full h-20 rounded-t-lg flex flex-col items-center justify-end pb-2">
                    <span className="text-orange-300/80 font-bold text-xs truncate w-full text-center px-1">@{top3[2].username}</span>
                    <span className="text-green-400 font-black text-xs">{top3[2].totalCennes}¢</span>
                    <div className="absolute -bottom-3 w-6 h-6 rounded-full bg-orange-950 border border-orange-700 flex items-center justify-center text-orange-400 font-bold text-xs shadow-lg z-10">3</div>
                  </div>
                </div>
              )}

            </div>

            {/* List for 4-10 */}
            {others.length > 0 && (
              <div className="flex flex-col gap-3">
                {others.map((u, i) => (
                  <div 
                    key={u.userId}
                    onClick={() => navigate(`/profile/${u.username}`)}
                    className="flex items-center justify-between bg-leather-900/60 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-leather-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-center text-leather-400 font-bold text-sm">
                        #{i + 4}
                      </div>
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                        <Image src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.username}&background=random`} alt={u.username} objectFit="cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-semibold text-sm">{u.displayName}</span>
                        <span className="text-leather-400 text-xs">@{u.username}</span>
                      </div>
                    </div>
                    <div className="text-green-400 font-black text-sm">
                      {u.totalCennes}¢
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
