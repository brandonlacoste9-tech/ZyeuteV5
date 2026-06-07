import React from "react";
import { Link } from "react-router-dom";
import { CompanyPageShell } from "./CompanyPageShell";

export const AboutPage: React.FC = () => {
  return (
    <CompanyPageShell title="À propos">
      <div className="inline-block bg-gold-500/20 px-4 py-2 rounded-full mb-6">
        <p className="text-gold-400 text-sm font-semibold">
          Fait au Québec, pour le Québec
        </p>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
        Zyeuté — L&apos;app vidéo du Québec
      </h1>

      <p className="text-white/80 text-lg leading-relaxed mb-8">
        Zyeuté, c&apos;est le fil d&apos;actualité vidéo vertical pensé pour les
        créateurs d&apos;ici : humour, culture, musique, sports, bouffe, régions
        — en français québécois, sans compromis.
      </p>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gold-400 mb-4">Notre mission</h2>
        <p className="text-white/80 leading-relaxed mb-4">
          Donner aux Québécois et Québécoises une plateforme où leur contenu
          circule en priorité, où la langue et la culture comptent, et où
          découvrir du nouveau contenu d&apos;icitte est aussi simple qu&apos;un
          swipe.
        </p>
        <ul className="space-y-2 text-white/70 ml-4">
          <li>• Feed vertical style TikTok, optimisé pour le mobile</li>
          <li>• Hive Québec (et bientôt d&apos;autres communautés)</li>
          <li>• Ti-Guy, ton copilote IA qui parle comme toi</li>
          <li>• Outils créateurs : live, monétisation, analytics</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gold-400 mb-4">L&apos;équipe</h2>
        <p className="text-white/80 leading-relaxed">
          Zyeuté est développé par une équipe basée au Québec, avec des
          partenaires techniques au Canada et à l&apos;international. On
          construit en public, on itère vite, et on écoute la communauté.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold text-gold-400 mb-4">
          En savoir plus
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/newsroom"
            className="px-4 py-2 rounded-lg bg-gold-500/15 text-gold-400 text-sm font-semibold hover:bg-gold-500/25 transition-colors"
          >
            Newsroom
          </Link>
          <Link
            to="/contact"
            className="px-4 py-2 rounded-lg bg-white/5 text-white/80 text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Nous joindre
          </Link>
          <Link
            to="/legal/community"
            className="px-4 py-2 rounded-lg bg-white/5 text-white/80 text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Règles de la communauté
          </Link>
        </div>
      </section>

      <p className="text-white/50 text-sm">
        © 2026 Zyeuté Inc. — Québec, Canada
      </p>
    </CompanyPageShell>
  );
};

export default AboutPage;
