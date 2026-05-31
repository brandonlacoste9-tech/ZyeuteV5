/**
 * Creator Wallet — /wallet
 * Shows cenne balance, CAD value, Stripe Connect onboarding, and withdrawal.
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiCall } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { SubscriberBadge } from "../components/ui/SubscriberBadge";
import usePremium from "../hooks/usePremium";

interface ConnectStatus {
  connected: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  requirements: string[];
  connectId: string | null;
  cennes: number;
  cadValue: number;
  minWithdrawal: number;
  minWithdrawalCAD: number;
}

export default function Wallet() {
  const { user } = useAuth();
  const premium = usePremium();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchStatus = useCallback(() => {
    apiCall<ConnectStatus>("/connect/status").then(({ data, error }) => {
      if (!error && data) setStatus(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setTimeout(fetchStatus, 0);

    // Handle Stripe Connect redirect
    const connect = params.get("connect");
    if (connect === "success") {
      setTimeout(
        () =>
          setMessage({
            type: "success",
            text: "Compte bancaire connecté avec succès!",
          }),
        0,
      );
    } else if (connect === "refresh") {
      setTimeout(
        () =>
          setMessage({
            type: "error",
            text: "L'intégration a expiré. Recommence.",
          }),
        0,
      );
    }
  }, [user, fetchStatus, params]);

  const handleOnboard = async () => {
    setOnboarding(true);
    const { data, error } = await apiCall<{ url: string }>("/connect/onboard", {
      method: "POST",
    });
    setOnboarding(false);
    if (error || !data?.url) {
      setMessage({
        type: "error",
        text: "Erreur lors de la connexion Stripe.",
      });
      return;
    }
    window.location.href = data.url;
  };

  const handleWithdraw = async () => {
    const cennes = parseInt(withdrawAmount);
    if (!cennes || cennes < (status?.minWithdrawal || 500)) {
      setMessage({
        type: "error",
        text: `Minimum de retrait: ${status?.minWithdrawal}¢ ($${status?.minWithdrawalCAD} CAD)`,
      });
      return;
    }
    if (cennes > (status?.cennes || 0)) {
      setMessage({ type: "error", text: "Solde insuffisant." });
      return;
    }
    setWithdrawing(true);
    const { data, error } = await apiCall<{
      success: boolean;
      amountCAD: number;
      remaining: number;
    }>("/connect/withdraw", {
      method: "POST",
      body: JSON.stringify({ cennes }),
    });
    setWithdrawing(false);
    if (error || !data?.success) {
      setMessage({ type: "error", text: "Erreur lors du retrait." });
      return;
    }
    setMessage({
      type: "success",
      text: `$${data.amountCAD.toFixed(2)} CAD envoyé à ton compte! Il reste ${data.remaining}¢.`,
    });
    setWithdrawAmount("");
    fetchStatus();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Connecte-toi pour accéder à ton portefeuille.</p>
      </div>
    );
  }

  const canWithdraw =
    status?.connected &&
    status?.payoutsEnabled &&
    (status?.cennes || 0) >= (status?.minWithdrawal || 500);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gold-500/20 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gold-400 text-xl">
          ‹
        </button>
        <h1 className="text-lg font-bold text-gold-400">
          Portefeuille Créateur
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">
        {/* Status message */}
        {message && (
          <div
            className={`rounded-xl p-3 text-sm font-medium ${
              message.type === "success"
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Subscription tier */}
        <div className="rounded-2xl bg-white/5 border border-gold-500/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
              Abonnement
            </p>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold capitalize">
                {premium.tier === "free" ? "Gratuit" : premium.tier}
              </span>
              <SubscriberBadge tier={premium.tier} size="sm" />
            </div>
          </div>
          {premium.tier === "free" && (
            <button
              onClick={() => navigate("/premium")}
              className="text-xs bg-gold-500 text-black font-bold px-3 py-1.5 rounded-full"
            >
              Upgrader
            </button>
          )}
        </div>

        {/* Cenne balance card */}
        {loading ? (
          <div className="rounded-2xl bg-white/5 border border-gold-500/20 p-6 animate-pulse h-32" />
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-gold-500/15 to-yellow-600/10 border border-gold-500/30 p-5">
            <p className="text-xs text-gold-400/70 uppercase tracking-wider mb-1">
              Solde Cennes
            </p>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-black text-gold-300">
                {(status?.cennes || 0).toLocaleString()}¢
              </span>
              <span className="text-lg text-white/60 mb-1">
                = ${((status?.cennes || 0) * 0.01).toFixed(2)} CAD
              </span>
            </div>
            <p className="text-xs text-white/40">
              Reçus via cadeaux de tes fans. La plateforme garde 30%, tu gardes
              70%.
            </p>
            {premium.isArgent && (
              <p className="text-xs text-slate-300 mt-1">
                +100¢ créditées automatiquement chaque mois (Argent)
              </p>
            )}
            {premium.isOr && (
              <p className="text-xs text-yellow-300 mt-1">
                +500¢ créditées automatiquement chaque mois (Or)
              </p>
            )}
          </div>
        )}

        {/* Stripe Connect section */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">Compte bancaire</h2>
            {status?.connected && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  status.payoutsEnabled
                    ? "bg-green-500/20 text-green-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {status.payoutsEnabled ? "Actif" : "En attente"}
              </span>
            )}
          </div>

          {!status?.connected ? (
            <div className="space-y-3">
              <p className="text-sm text-white/60">
                Connecte ton compte bancaire pour recevoir tes gains en dollars
                canadiens.
              </p>
              <button
                onClick={handleOnboard}
                disabled={onboarding}
                className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold text-sm disabled:opacity-50"
              >
                {onboarding
                  ? "Redirection..."
                  : "Connecter mon compte bancaire"}
              </button>
            </div>
          ) : !status.payoutsEnabled ? (
            <div className="space-y-3">
              <p className="text-sm text-yellow-300/80">
                Ton compte Stripe est en cours de vérification. Complète les
                informations requises.
              </p>
              {status.requirements.length > 0 && (
                <ul className="text-xs text-white/50 list-disc list-inside space-y-1">
                  {status.requirements.slice(0, 5).map((r) => (
                    <li key={r}>{r.replace(/_/g, " ")}</li>
                  ))}
                </ul>
              )}
              <button
                onClick={handleOnboard}
                disabled={onboarding}
                className="w-full py-3 rounded-xl border border-gold-500/50 text-gold-300 font-bold text-sm disabled:opacity-50"
              >
                {onboarding ? "Redirection..." : "Compléter mon profil Stripe"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-green-300/80">
              Ton compte bancaire est connecté et prêt pour les virements.
            </p>
          )}
        </div>

        {/* Withdrawal section */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
          <h2 className="font-bold text-base">Retirer mes gains</h2>

          {!canWithdraw && !loading && (
            <p className="text-sm text-white/50">
              {!status?.connected
                ? "Connecte ton compte bancaire ci-dessus."
                : !status?.payoutsEnabled
                  ? "Ton compte Stripe doit être vérifié."
                  : `Minimum de retrait: ${status?.minWithdrawal}¢ ($${status?.minWithdrawalCAD} CAD). Ton solde actuel: ${status?.cennes}¢.`}
            </p>
          )}

          {canWithdraw && (
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Min. ${status?.minWithdrawal}¢`}
                  max={status?.cennes}
                  min={status?.minWithdrawal}
                  className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-sm text-white"
                />
                <span className="text-white/60 text-sm">
                  = ${((parseInt(withdrawAmount) || 0) * 0.01).toFixed(2)} CAD
                </span>
              </div>
              <div className="flex gap-2">
                {[500, 1000, 2500, status?.cennes || 0]
                  .filter((v) => v >= (status?.minWithdrawal || 500))
                  .map((v) => (
                    <button
                      key={v}
                      onClick={() => setWithdrawAmount(String(v))}
                      className="flex-1 text-xs py-1.5 rounded-lg border border-white/20 text-white/70 hover:border-gold-500/50 hover:text-gold-300 transition-colors"
                    >
                      {v === status?.cennes ? "Tout" : `${v}¢`}
                    </button>
                  ))}
              </div>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount}
                className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold text-sm disabled:opacity-50"
              >
                {withdrawing
                  ? "Traitement..."
                  : `Retirer $${((parseInt(withdrawAmount) || 0) * 0.01).toFixed(2)} CAD`}
              </button>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h3 className="font-bold text-sm mb-3 text-white/80">
            Comment ça marche
          </h3>
          <ul className="space-y-2 text-xs text-white/50">
            <li>
              🎁 Tes fans t'envoient des cadeaux pendant tes lives ou sur tes
              vidéos
            </li>
            <li>💰 Tu reçois 70% de chaque cadeau — Zyeuté garde 30%</li>
            <li>
              🏦 Connecte ton compte bancaire via Stripe pour recevoir tes gains
            </li>
            <li>
              💸 Retire tes cennes en dollars canadiens à tout moment (min.
              $5.00)
            </li>
            <li>⭐ Abonnement Argent ou Or = cennes bonus chaque mois</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
