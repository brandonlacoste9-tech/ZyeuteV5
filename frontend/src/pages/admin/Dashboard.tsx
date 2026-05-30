import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { BottomNav } from "../../components/BottomNav";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/Button";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Placeholder for stats loading
    setStats({
      users: 150,
      posts: 450,
      reports: 2,
      emails: 1200,
    });
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="👑 Admin Zyeuté" showBack={false} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-edge p-4">
            <p className="text-white/60 text-xs">Utilisateurs</p>
            <p className="text-white text-2xl font-bold">{stats?.users || 0}</p>
          </div>
          <div className="card-edge p-4">
            <p className="text-white/60 text-xs">Posts</p>
            <p className="text-white text-2xl font-bold">{stats?.posts || 0}</p>
          </div>
          <div className="card-edge p-4">
            <p className="text-white/60 text-xs">Signalements</p>
            <p className="text-red-400 text-2xl font-bold">
              {stats?.reports || 0}
            </p>
          </div>
          <div className="card-edge p-4">
            <p className="text-white/60 text-xs">Emails Envoyés</p>
            <p className="text-blue-400 text-2xl font-bold">
              {stats?.emails || 0}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-white text-xl font-bold">Outils de Gestion</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/admin/emails")}
              className="card-edge p-6 text-left hover:bg-white/5 transition-colors group"
            >
              <span className="text-3xl mb-2 block">📧</span>
              <h3 className="text-white font-bold text-lg group-hover:text-gold-400">
                Campagnes Email
              </h3>
              <p className="text-white/60 text-sm">
                Envoyer des newsletters et gérer les notifications
              </p>
            </button>

            <button
              onClick={() => navigate("/moderation")}
              className="card-edge p-6 text-left hover:bg-white/5 transition-colors group"
            >
              <span className="text-3xl mb-2 block">🛡️</span>
              <h3 className="text-white font-bold text-lg group-hover:text-gold-400">
                Modération
              </h3>
              <p className="text-white/60 text-sm">
                Gérer les signalements et la sécurité
              </p>
            </button>

            <button
              onClick={() => navigate("/admin/analytics")}
              className="card-edge p-6 text-left hover:bg-white/5 transition-colors group"
            >
              <span className="text-3xl mb-2 block">📊</span>
              <h3 className="text-white font-bold text-lg group-hover:text-gold-400">
                Analytiques
              </h3>
              <p className="text-white/60 text-sm">
                Vue d&apos;ensemble de la plateforme
              </p>
            </button>

            <button
              onClick={() => navigate("/admin/users")}
              className="card-edge p-6 text-left hover:bg-white/5 transition-colors group"
            >
              <span className="text-3xl mb-2 block">👥</span>
              <h3 className="text-white font-bold text-lg group-hover:text-gold-400">
                Utilisateurs
              </h3>
              <p className="text-white/60 text-sm">
                Gérer les comptes et permissions
              </p>
            </button>

            <button
              onClick={() => navigate("/admin/observability")}
              className="card-edge p-6 text-left hover:bg-white/5 transition-colors group"
            >
              <span className="text-3xl mb-2 block">🧠</span>
              <h3 className="text-white font-bold text-lg group-hover:text-gold-400">
                Brain Scan
              </h3>
              <p className="text-white/60 text-sm">
                Visualiser les pensées et la mémoire
              </p>
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default AdminDashboard;
