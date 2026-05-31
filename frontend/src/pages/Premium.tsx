/**
 * Premium VIP Page - ULTIMATE LUXURY SHOWCASE
 * The most premium page on the entire platform
 * Beaver leather, gold embossing, stitched elegance
 */

import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { subscribeToPremium } from "../services/stripeService";
import { usePremium } from "../hooks/usePremium";
import { toast } from "../components/Toast";
import { useHaptics } from "../hooks/useHaptics";
import { logger } from "../lib/logger";
import { useSEO } from "../hooks/useSEO";

const premiumLogger = logger.withContext("Premium");

type SubscriptionTier = "free" | "bronze" | "argent" | "or";

export default function Premium() {
  useSEO({
    title: "Abonnements VIP — Bronze, Argent et Or",
    description:
      "Débloque des fonctionnalités exclusives sur Zyeute. Abonnements Bronze (4,99$/mois), Argent (9,99$/mois) et Or (19,99$/mois). Badges exclusifs, filtres premium, cennes mensuels et plus.",
    url: "/premium",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Zyeute Premium",
      description: "Abonnements VIP pour la plateforme vidéo québécoise Zyeute",
      brand: { "@type": "Brand", name: "Zyeute" },
      offers: [
        {
          "@type": "Offer",
          name: "Bronze",
          price: "4.99",
          priceCurrency: "CAD",
          billingDuration: "P1M",
        },
        {
          "@type": "Offer",
          name: "Argent",
          price: "9.99",
          priceCurrency: "CAD",
          billingDuration: "P1M",
        },
        {
          "@type": "Offer",
          name: "Or",
          price: "19.99",
          priceCurrency: "CAD",
          billingDuration: "P1M",
        },
      ],
    },
  });

  const { tier: currentTier, isLoading, refresh } = usePremium();
  const { tap } = useHaptics();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle Stripe redirect callbacks (?success=true / ?canceled=true)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get("success");
    const canceled = params.get("canceled");

    if (success === "true") {
      toast.success("🎉 Abonnement activé! Bienvenue dans le VIP Zyeuté!");
      // Refresh subscription status to reflect new tier
      refresh();
      // Clean URL
      navigate("/premium", { replace: true });
    } else if (canceled === "true") {
      toast.info("Abonnement annulé. Tu peux t'abonner à tout moment.");
      navigate("/premium", { replace: true });
    }
  }, [location.search, navigate, refresh]);

  const tiers = [
    {
      id: "bronze" as const,
      name: "Bronze",
      emoji: "🥉",
      price: 4.99,
      features: [
        "⚜️ Badge Bronze vérifié",
        "🚫 Pas de publicités",
        "🦫 Accès Ti-Guy chat",
        "💬 Support prioritaire",
        "🔥 Boost de visibilité x2",
      ],
      gradient: "from-orange-700 via-orange-600 to-orange-800",
      popular: false,
    },
    {
      id: "argent" as const,
      name: "Argent",
      emoji: "🥈",
      price: 9.99,
      features: [
        "✨ Tout Bronze +",
        "💎 Badge Argent premium",
        "📊 Analytics avancés",
        "🔥 Boost de visibilité x3",
        "🎁 100 cennes/mois",
        "⭐ Profil mis en avant",
      ],
      gradient: "from-gray-400 via-gray-300 to-gray-500",
      popular: true,
    },
    {
      id: "or" as const,
      name: "Or",
      emoji: "🥇",
      price: 19.99,
      features: [
        "👑 Tout Argent +",
        "⚜️ Badge Or royal",
        "🚀 Priorité feed absolue",
        "🔥 Boost visibilité x5",
        "🎁 500 cennes/mois",
        "💼 Outils créateurs PRO",
        "🦫 Ti-Guy VIP exclusif",
        "🎯 Statistiques complètes",
      ],
      gradient: "from-yellow-500 via-yellow-400 to-yellow-600",
      popular: false,
    },
  ];

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier === "free" || tier === currentTier) return;

    try {
      await subscribeToPremium(tier);
    } catch (error) {
      premiumLogger.error("Subscription error:", error);
      toast.error("Erreur lors de l'abonnement. Réessaie plus tard.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black leather-overlay flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      {/* Ultra Premium Header */}
      <div className="relative nav-leather border-b-2 border-gold-700/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-500 mb-4 glow-gold animate-pulse-slow">
            <span className="text-4xl">👑</span>
          </div>
          <h1 className="text-4xl font-black text-gold-400 mb-2 embossed tracking-tight">
            Zyeuté VIP
          </h1>
          <p className="text-leather-200 text-lg embossed">
            L&apos;expérience premium québécoise
          </p>
        </div>
        {/* Gold accent lines */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold-gradient" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Current Status Banner */}
        {currentTier !== "free" && (
          <div className="leather-card rounded-2xl p-6 mb-8 stitched text-center">
            <div className="inline-flex items-center gap-3 bg-gold-gradient px-6 py-3 rounded-full">
              <span className="text-2xl">
                {currentTier === "bronze" && "🥉"}
                {currentTier === "argent" && "🥈"}
                {currentTier === "or" && "🥇"}
              </span>
              <span className="text-leather-900 font-black text-lg">
                Membre {currentTier.toUpperCase()}
              </span>
            </div>
            <p className="text-leather-300 mt-4">
              Merci de supporter Zyeuté! ⚜️
            </p>
          </div>
        )}

        {/* Subscription Tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier) => {
            const isCurrentTier = currentTier === tier.id;
            const isUpgrade =
              tier.id === "or" ||
              (tier.id === "argent" && currentTier === "bronze");

            return (
              <div
                key={tier.id}
                className={`leather-card rounded-2xl p-6 stitched relative overflow-hidden transition-all hover:scale-105 ${
                  tier.popular ? "ring-2 ring-gold-500" : ""
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute top-4 right-4 bg-gold-gradient px-3 py-1 rounded-full text-xs font-black text-leather-900">
                    POPULAIRE
                  </div>
                )}

                {/* Tier Icon */}
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center mb-4`}
                >
                  <span className="text-3xl">{tier.emoji}</span>
                </div>

                {/* Tier Name */}
                <h3 className="text-2xl font-black text-gold-400 mb-2 embossed">
                  {tier.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white embossed">
                      ${tier.price}
                    </span>
                    <span className="text-leather-300">/mois</span>
                  </div>
                  <p className="text-leather-400 text-sm mt-1">
                    CAD · Annule quand tu veux
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-leather-100 text-sm"
                    >
                      <span className="text-gold-500 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    tap();
                    handleSubscribe(tier.id);
                  }}
                  disabled={isCurrentTier}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    isCurrentTier
                      ? "bg-leather-700 text-leather-400 cursor-not-allowed"
                      : tier.id === "or"
                        ? "btn-gold border-gold-500"
                        : "btn-leather hover:btn-gold"
                  }`}
                >
                  {isCurrentTier
                    ? "✓ Ton plan actuel"
                    : isUpgrade
                      ? "⬆️ Améliorer"
                      : "S'abonner"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Benefits Showcase */}
        <div className="leather-card rounded-2xl p-8 mb-8 stitched">
          <h2 className="text-2xl font-black text-gold-400 mb-6 embossed text-center">
            Pourquoi devenir VIP?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🚫</span>
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Zéro publicités</h3>
                <p className="text-leather-300 text-sm">
                  Profite du feed sans interruptions — pure expérience Zyeute
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🚀</span>
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">
                  Boost de visibilité
                </h3>
                <p className="text-leather-300 text-sm">
                  Tes posts apparaissent en priorité dans le feed
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚜️</span>
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">
                  Badge vérifié premium
                </h3>
                <p className="text-leather-300 text-sm">
                  Montre ton statut VIP avec un badge exclusif
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🎁</span>
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Cennes mensuelles</h3>
                <p className="text-leather-300 text-sm">
                  Reçois des cennes chaque mois pour envoyer des gifts aux
                  créateurs
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Analytics avancés</h3>
                <p className="text-leather-300 text-sm">
                  Comprends ton audience avec des stats détaillées
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🦫</span>
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Ti-Guy VIP</h3>
                <p className="text-leather-300 text-sm">
                  Accès exclusif aux nouvelles fonctionnalités AI
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="leather-card rounded-2xl p-8 stitched">
          <h2 className="text-2xl font-black text-gold-400 mb-6 embossed text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white font-bold py-3 border-b border-leather-700">
                <span>Puis-je annuler à tout moment?</span>
                <svg
                  className="w-5 h-5 text-gold-500 transition-transform group-open:rotate-180"
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
              <p className="text-leather-300 text-sm py-3">
                Oui! Tu peux annuler ton abonnement à tout moment depuis tes
                paramètres. Tu garderas l&apos;accès jusqu&apos;à la fin de ta
                période payée.
              </p>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white font-bold py-3 border-b border-leather-700">
                <span>Puis-je changer de plan?</span>
                <svg
                  className="w-5 h-5 text-gold-500 transition-transform group-open:rotate-180"
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
              <p className="text-leather-300 text-sm py-3">
                Absolument! Tu peux améliorer ou réduire ton plan à tout moment.
                Les changements prennent effet immédiatement.
              </p>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white font-bold py-3 border-b border-leather-700">
                <span>Les paiements sont-ils sécurisés?</span>
                <svg
                  className="w-5 h-5 text-gold-500 transition-transform group-open:rotate-180"
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
              <p className="text-leather-300 text-sm py-3">
                Oui! Tous les paiements sont traités par Stripe, le leader
                mondial des paiements en ligne. Nous ne stockons jamais tes
                informations bancaires.
              </p>
            </details>
          </div>
        </div>
      </div>

      {/* Quebec Pride Footer */}
      <div className="text-center py-8 text-leather-400 text-sm">
        <p className="flex items-center justify-center gap-2">
          <span className="text-gold-500">⚜️</span>
          <span>Supporte les créateurs québécois</span>
          <span className="text-gold-500">⚜️</span>
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
