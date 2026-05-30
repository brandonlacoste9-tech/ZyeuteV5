/**
 * Creator Revenue Dashboard - Track earnings, subscribers, and payouts
 * Professional dashboard for content creators
 */

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/Button";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import { cn } from "../lib/utils";
import {
  getCreatorRevenue,
  getCreatorEarnings,
  getCreatorSubscribers,
  requestPayout,
  type RevenueSummary,
  type CreatorEarnings as EarningsType,
} from "../services/subscriptionService";

const creatorRevenueLogger = logger.withContext("CreatorRevenue");

export const CreatorRevenue: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [earnings, setEarnings] = useState<EarningsType[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "earnings" | "subscribers" | "payout"
  >("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user);

      const [revenueData, earningsData, subscribersData] = await Promise.all([
        getCreatorRevenue(user.id),
        getCreatorEarnings(user.id, 50),
        getCreatorSubscribers(user.id),
      ]);

      setRevenue(revenueData);
      setEarnings(earningsData);
      setSubscribers(subscribersData);
    } catch (error) {
      creatorRevenueLogger.error("Error loading revenue data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!currentUser || !payoutAmount) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < 100) {
      alert("Montant minimum: 100$ CAD");
      return;
    }

    const success = await requestPayout(currentUser.id, amount);
    if (success) {
      setPayoutAmount("");
      loadData(); // Refresh data
    }
  };

  const getGrowthPercentage = () => {
    if (!revenue || revenue.last_month_revenue === 0) return 0;
    return Math.round(
      ((revenue.this_month_revenue - revenue.last_month_revenue) /
        revenue.last_month_revenue) *
        100,
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="💰 Revenus Créateur" showBack={true} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Overview Cards */}
        {activeTab === "overview" && revenue && (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card-edge p-6 bg-gradient-to-br from-gold-900/20 to-yellow-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Revenus Totaux</p>
                    <p className="text-white text-3xl font-bold">
                      {revenue.total_earnings.toFixed(2)}$
                    </p>
                  </div>
                </div>
                <p className="text-white/40 text-xs">Depuis le début</p>
              </div>

              <div className="card-edge p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-2xl">💵</span>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">En Attente</p>
                    <p className="text-white text-3xl font-bold">
                      {revenue.pending_earnings.toFixed(2)}$
                    </p>
                  </div>
                </div>
                <p className="text-white/40 text-xs">Prêt à retirer</p>
              </div>

              <div className="card-edge p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Abonnés</p>
                    <p className="text-white text-3xl font-bold">
                      {revenue.total_subscribers}
                    </p>
                  </div>
                </div>
                <p className="text-white/40 text-xs">Abonnés actifs</p>
              </div>
            </div>

            {/* MRR & Growth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="card-edge p-6">
                <p className="text-white/60 text-sm mb-2">
                  Revenus Récurrents Mensuels (MRR)
                </p>
                <p className="text-white text-4xl font-bold mb-1">
                  {revenue.monthly_recurring_revenue.toFixed(2)}$
                </p>
                <p className="text-white/40 text-xs">par mois</p>
              </div>

              <div className="card-edge p-6">
                <p className="text-white/60 text-sm mb-2">Ce Mois-ci</p>
                <p className="text-white text-4xl font-bold mb-1">
                  {revenue.this_month_revenue.toFixed(2)}$
                </p>
                <div className="flex items-center gap-2">
                  {getGrowthPercentage() > 0 ? (
                    <span className="text-green-400 text-sm font-semibold">
                      ↑ +{getGrowthPercentage()}%
                    </span>
                  ) : getGrowthPercentage() < 0 ? (
                    <span className="text-red-400 text-sm font-semibold">
                      ↓ {getGrowthPercentage()}%
                    </span>
                  ) : (
                    <span className="text-white/40 text-sm">→ 0%</span>
                  )}
                  <span className="text-white/40 text-xs">vs mois dernier</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <button
                onClick={() => setActiveTab("payout")}
                className="card-edge p-4 hover:bg-white/5 transition-colors"
              >
                <p className="text-3xl mb-2">💳</p>
                <p className="text-white text-sm font-semibold">Retrait</p>
              </button>
              <button
                onClick={() => setActiveTab("subscribers")}
                className="card-edge p-4 hover:bg-white/5 transition-colors"
              >
                <p className="text-3xl mb-2">👥</p>
                <p className="text-white text-sm font-semibold">Abonnés</p>
              </button>
              <button
                onClick={() => setActiveTab("earnings")}
                className="card-edge p-4 hover:bg-white/5 transition-colors"
              >
                <p className="text-3xl mb-2">📊</p>
                <p className="text-white text-sm font-semibold">Historique</p>
              </button>
              <button
                onClick={() =>
                  (window.location.href = "/settings/subscriptions")
                }
                className="card-edge p-4 hover:bg-white/5 transition-colors"
              >
                <p className="text-3xl mb-2">⚙️</p>
                <p className="text-white text-sm font-semibold">Paramètres</p>
              </button>
            </div>
          </>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-2 rounded-xl whitespace-nowrap transition-colors",
              activeTab === "overview"
                ? "bg-gold-500 text-black font-bold"
                : "bg-white/5 text-white hover:bg-white/10",
            )}
          >
            Vue d&apos;ensemble
          </button>
          <button
            onClick={() => setActiveTab("earnings")}
            className={cn(
              "px-4 py-2 rounded-xl whitespace-nowrap transition-colors",
              activeTab === "earnings"
                ? "bg-gold-500 text-black font-bold"
                : "bg-white/5 text-white hover:bg-white/10",
            )}
          >
            Historique
          </button>
          <button
            onClick={() => setActiveTab("subscribers")}
            className={cn(
              "px-4 py-2 rounded-xl whitespace-nowrap transition-colors",
              activeTab === "subscribers"
                ? "bg-gold-500 text-black font-bold"
                : "bg-white/5 text-white hover:bg-white/10",
            )}
          >
            Abonnés ({subscribers.length})
          </button>
          <button
            onClick={() => setActiveTab("payout")}
            className={cn(
              "px-4 py-2 rounded-xl whitespace-nowrap transition-colors",
              activeTab === "payout"
                ? "bg-gold-500 text-black font-bold"
                : "bg-white/5 text-white hover:bg-white/10",
            )}
          >
            Retrait
          </button>
        </div>

        {/* Earnings History */}
        {activeTab === "earnings" && (
          <div className="space-y-3">
            <h2 className="text-white text-xl font-bold mb-4">
              Historique des Revenus
            </h2>
            {earnings.length === 0 ? (
              <div className="card-edge p-12 text-center">
                <p className="text-white/60">Aucun revenu encore</p>
              </div>
            ) : (
              earnings.map((earning) => (
                <div key={earning.id} className="card-edge p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          earning.source === "subscription" &&
                            "bg-purple-500/20",
                          earning.source === "gift" && "bg-pink-500/20",
                          earning.source === "tip" && "bg-green-500/20",
                        )}
                      >
                        <span className="text-2xl">
                          {earning.source === "subscription" && "💎"}
                          {earning.source === "gift" && "🎁"}
                          {earning.source === "tip" && "💵"}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold capitalize">
                          {earning.source === "subscription" && "Abonnement"}
                          {earning.source === "gift" && "Cadeau"}
                          {earning.source === "tip" && "Pourboire"}
                        </p>
                        <p className="text-white/60 text-sm">
                          {new Date(earning.created_at).toLocaleDateString(
                            "fr-CA",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xl font-bold">
                        +{earning.creator_net.toFixed(2)}$
                      </p>
                      <p className="text-white/40 text-xs">
                        ({earning.amount.toFixed(2)}$ - 30% frais)
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Subscribers */}
        {activeTab === "subscribers" && (
          <div className="space-y-3">
            <h2 className="text-white text-xl font-bold mb-4">Tes Abonnés</h2>
            {subscribers.length === 0 ? (
              <div className="card-edge p-12 text-center">
                <p className="text-white/60">Aucun abonné encore</p>
                <p className="text-white/40 text-sm mt-2">
                  Crée du contenu exclusif pour attirer des abonnés!
                </p>
              </div>
            ) : (
              subscribers.map((sub) => (
                <div key={sub.id} className="card-edge p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          sub.subscriber?.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.subscriber?.username}`
                        }
                        alt={sub.subscriber?.username}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="text-white font-semibold">
                          @{sub.subscriber?.username}
                          {sub.subscriber?.is_verified && (
                            <span className="ml-1 text-blue-400">✓</span>
                          )}
                        </p>
                        <p className="text-white/60 text-sm">
                          {sub.tier?.name_fr} • {sub.tier?.price}$/mois
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 text-sm font-semibold">
                        Actif
                      </p>
                      <p className="text-white/40 text-xs">
                        Depuis{" "}
                        {new Date(sub.created_at).toLocaleDateString("fr-CA", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Payout */}
        {activeTab === "payout" && revenue && (
          <div>
            <h2 className="text-white text-xl font-bold mb-4">
              Demande de Retrait
            </h2>

            <div className="card-edge p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white/60 text-sm">
                    Disponible pour retrait
                  </p>
                  <p className="text-white text-4xl font-bold">
                    {revenue.pending_earnings.toFixed(2)}$
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm">Minimum</p>
                  <p className="text-white text-2xl font-bold">100$</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-white text-sm font-semibold mb-2">
                  Montant à retirer (CAD)
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="100.00"
                  min="100"
                  step="0.01"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-gold-400"
                />
              </div>

              <Button
                variant="primary"
                className="w-full bg-gradient-to-r from-gold-600 to-yellow-600 hover:from-gold-700 hover:to-yellow-700"
                onClick={handleRequestPayout}
                disabled={!payoutAmount || parseFloat(payoutAmount) < 100}
              >
                Demander le retrait
              </Button>

              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-400 text-sm font-semibold mb-2">
                  💡 Information
                </p>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Montant minimum: 100$ CAD</li>
                  <li>• Délai de traitement: 3-5 jours ouvrables</li>
                  <li>• Virement via Stripe, Interac ou PayPal</li>
                  <li>• Configure ton mode de paiement dans les paramètres</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CreatorRevenue;
