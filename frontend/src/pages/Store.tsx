/**
 * Zyeuté Store — Buy cennes to gift your favourite creators
 */

import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import {
  getCenneCatalog,
  getCenneBalance,
  buyPack,
  type CennePack,
  type GiftItem,
} from "../services/cenneService";
import { toast } from "../components/Toast";
import { useHaptics } from "../hooks/useHaptics";
import { useAuth } from "../contexts/AuthContext";
import {
  GiftIcon,
  getCreatorShare,
  getGiftTier,
  giftTierBorderClass,
} from "@/lib/giftCatalog";

export default function Store() {
  const { user } = useAuth();
  const { tap } = useHaptics();
  const location = useLocation();
  const navigate = useNavigate();

  const [packs, setPacks] = useState<CennePack[]>([]);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [catalog, bal] = await Promise.all([
        getCenneCatalog(),
        user
          ? getCenneBalance()
          : Promise.resolve({ balance: 0, balanceDisplay: "0¢" }),
      ]);
      setPacks(catalog.packs);
      setGifts([...catalog.gifts].sort((a, b) => a.cost - b.cost));
      setBalance(bal.balance);
    } catch {
      // silent — catalog still shows
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle Stripe redirect callbacks
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get("success");
    const canceled = params.get("canceled");
    const cennesStr = params.get("cennes");
    const pack = params.get("pack");

    if (success === "true") {
      const cennes = cennesStr ? parseInt(cennesStr, 10) : 0;
      toast.success(
        `🎉 ${cennes}¢ ajoutés à ton solde! Merci pour ton support!`,
      );
      navigate("/store", { replace: true });
    } else if (canceled === "true") {
      toast.info("Achat annulé.");
      navigate("/store", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBuyPack = async (pack: CennePack) => {
    if (!user) {
      toast.error("Connecte-toi pour acheter des cennes.");
      navigate("/login");
      return;
    }
    tap();
    setBuyingPack(pack.id);
    try {
      await buyPack(pack.id);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du paiement");
      setBuyingPack(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black leather-overlay flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black leather-overlay pb-24">
      {/* Header */}
      <div className="relative nav-leather border-b-2 border-gold-700/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-500/20 border-2 border-gold-500 mb-4">
            <span className="text-4xl">🪙</span>
          </div>
          <h1 className="text-4xl font-black text-gold-400 mb-2 embossed tracking-tight">
            Boutique
          </h1>
          <p className="text-leather-200 text-lg">
            Achète des cennes, envoie des cadeaux aux créateurs
          </p>

          {/* Balance pill */}
          {user && (
            <div className="inline-flex items-center gap-2 mt-4 bg-gold-500/10 border border-gold-500/40 px-5 py-2 rounded-full">
              <span className="text-gold-400 font-black text-xl">
                {balance}¢
              </span>
              <span className="text-leather-300 text-sm">ton solde</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold-gradient" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {/* How it works */}
        <div className="leather-card rounded-2xl p-6 stitched">
          <h2 className="text-lg font-black text-gold-400 mb-4">
            Comment ça marche?
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-leather-200 text-xs font-semibold">
                Achète des cennes
              </p>
              <p className="text-leather-400 text-xs mt-1">
                Paye une seule fois
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">🎁</div>
              <p className="text-leather-200 text-xs font-semibold">
                Envoie des cadeaux
              </p>
              <p className="text-leather-400 text-xs mt-1">
                Sur les vidéos ou profils
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">💰</div>
              <p className="text-leather-200 text-xs font-semibold">
                Les créateurs encaissent
              </p>
              <p className="text-leather-400 text-xs mt-1">70% leur revient</p>
            </div>
          </div>
        </div>

        {/* Cenne packs */}
        <div>
          <h2 className="text-xl font-black text-white mb-4">
            Packs de cennes
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className={`leather-card rounded-2xl p-5 stitched relative overflow-hidden transition-all hover:scale-[1.02] ${
                  pack.badge === "POPULAIRE"
                    ? "ring-2 ring-gold-500"
                    : pack.badge === "VALEUR"
                      ? "ring-2 ring-green-500/60"
                      : ""
                }`}
              >
                {pack.badge && (
                  <div
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-black ${
                      pack.badge === "POPULAIRE"
                        ? "bg-gold-gradient text-leather-900"
                        : "bg-green-500/20 text-green-400 border border-green-500/40"
                    }`}
                  >
                    {pack.badge}
                  </div>
                )}

                <div className="text-4xl mb-3">{pack.emoji}</div>
                <h3 className="text-white font-black text-lg">{pack.name}</h3>
                <div className="text-3xl font-black text-gold-400 my-1">
                  {pack.cennes}
                  <span className="text-lg text-gold-500/70">¢</span>
                </div>
                <p className="text-leather-400 text-xs mb-4">
                  {pack.description}
                </p>

                <button
                  onClick={() => handleBuyPack(pack)}
                  disabled={buyingPack === pack.id}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all btn-leather hover:btn-gold disabled:opacity-50"
                >
                  {buyingPack === pack.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Chargement...
                    </span>
                  ) : (
                    `${pack.priceCAD.toFixed(2)} $CAD`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Gift catalog preview */}
        <div>
          <h2 className="text-xl font-black text-white mb-2">
            Cadeaux disponibles
          </h2>
          <p className="text-leather-400 text-sm mb-4">
            Envoie ces cadeaux sur n&apos;importe quelle vidéo ou profil
          </p>
          <div className="leather-card rounded-2xl p-5 stitched">
            <div className="grid grid-cols-4 gap-3">
              {gifts.map((gift) => {
                const tier = getGiftTier(gift.cost);
                const creatorShare = getCreatorShare(gift.cost);
                return (
                  <div
                    key={gift.id}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ${giftTierBorderClass(tier)}`}
                  >
                    <GiftIcon id={gift.id} emoji={gift.emoji} />
                    <span className="text-leather-200 text-xs font-semibold text-center leading-tight">
                      {gift.name}
                    </span>
                    <span className="text-gold-400 text-xs font-black">
                      {gift.cost}¢
                    </span>
                    <span className="text-[10px] text-gold-500/60 text-center">
                      Créateur {creatorShare}¢
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Creator earning info */}
        <div className="leather-card rounded-2xl p-6 stitched border border-gold-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎙️</span>
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Tu es créateur?</h3>
              <p className="text-leather-300 text-sm">
                70% de chaque cadeau reçu te revient en cennes, que tu peux
                encaisser dans ton{" "}
                <button
                  className="text-gold-400 underline"
                  onClick={() => navigate("/creator")}
                >
                  Centre Créateur
                </button>
                . Zyeuté garde 30% pour maintenir la plateforme.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="leather-card rounded-2xl p-6 stitched">
          <h2 className="text-lg font-black text-gold-400 mb-4">
            Questions fréquentes
          </h2>
          <div className="space-y-3">
            {[
              {
                q: "Est-ce que mes cennes expirent?",
                a: "Non — ton solde est permanent. Utilise-les quand tu veux.",
              },
              {
                q: "Puis-je me faire rembourser?",
                a: "Les cennes ne sont pas remboursables une fois achetés, conformément à nos conditions d'utilisation.",
              },
              {
                q: "Comment les créateurs encaissent-ils?",
                a: "Les créateurs peuvent demander un virement dans leur Centre Créateur une fois qu'ils ont atteint 500¢ de cadeaux reçus.",
              },
            ].map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between cursor-pointer text-white font-semibold py-2 border-b border-leather-700">
                  <span className="text-sm">{faq.q}</span>
                  <svg
                    className="w-4 h-4 text-gold-500 transition-transform group-open:rotate-180 flex-shrink-0 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <p className="text-leather-300 text-sm py-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center pb-6 text-leather-400 text-xs">
        <p className="flex items-center justify-center gap-1">
          <span className="text-gold-500">⚜️</span>
          Paiements sécurisés par Stripe
          <span className="text-gold-500">⚜️</span>
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
