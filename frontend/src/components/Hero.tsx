/**
 * Hero Component - Landing Page Hero Section
 * Quebec-inspired design with clear CTA hierarchy
 * Primary: "Commencer Gratuitement" with no credit card requirement
 * Secondary: De-emphasized login link
 */

import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-radial from-gold-500/5 via-transparent to-transparent opacity-50" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Hero Title */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
          Bienvenue sur{" "}
          <span className="text-gold-500 inline-block relative">
            Zyeuté
            <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gold-500/30 rounded-full" />
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-xl md:text-2xl text-stone-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          La plateforme sociale québécoise qui célèbre notre culture et
          créativité
        </p>

        {/* CTA Section - Vertical Stack for Clear Hierarchy */}
        <div className="flex flex-col items-center gap-4 mb-8">
          {/* Primary CTA - Large, prominent */}
          <div className="flex flex-col items-center gap-2">
            <Link
              to="/signup"
              className={cn(
                "group inline-flex items-center justify-center gap-2",
                "px-8 py-4 rounded-xl font-bold text-lg",
                "bg-gold-500 text-black",
                "hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/40",
                "active:bg-gold-600 active:scale-95",
                "transition-all duration-200 ease-in-out",
                "shadow-md shadow-gold-500/30",
                "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-black",
                "min-w-[280px]",
              )}
              aria-label="Commencer gratuitement sans carte de crédit"
            >
              <span>Commencer Gratuitement</span>
              <span
                className="text-xl group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
            <span
              className="text-xs text-stone-400 font-normal"
              aria-label="Aucune carte de crédit requise"
            >
              Aucune Carte Requise
            </span>
          </div>

          {/* Secondary CTA - De-emphasized */}
          <Link
            to="/login"
            className={cn(
              "inline-flex items-center gap-2 mt-8",
              "text-stone-400 hover:text-gold-400",
              "transition-colors duration-200",
              "text-sm",
              "focus:outline-none focus:text-gold-400",
            )}
            aria-label="Se connecter avec un compte existant"
          >
            <span>Déjà un compte?</span>
            <span className="font-semibold underline decoration-dotted underline-offset-4">
              Connexion
            </span>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-sm">
          {[
            { emoji: "🦫", text: "100% Québécois" },
            { emoji: "⚜️", text: "Créé avec fierté" },
            { emoji: "✨", text: "Gratuit pour tous" },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-leather-900/30 border border-gold-500/10"
            >
              <div className="text-3xl" aria-hidden="true">
                {feature.emoji}
              </div>
              <p className="text-stone-300 font-medium">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
