import React from "react";
import { Link } from "react-router-dom";
import { CompanyPageShell } from "./CompanyPageShell";

const PRESS_ITEMS = [
  {
    date: "5 juin 2026",
    title: "Zyeuté améliore le feed Pour toi",
    summary:
      "Nouveau moteur de découverte, priorité au contenu vertical québécois et expérience TikTok-style repensée pour moins de répétitions.",
    tag: "Produit",
  },
  {
    date: "26 novembre 2025",
    title: "Lancement public de zyeute.com",
    summary:
      "La plateforme vidéo sociale du Québec ouvre ses portes avec feed vertical, profils créateurs, Ti-Guy IA et monétisation en piasses.",
    tag: "Lancement",
  },
  {
    date: "Automne 2025",
    title: "Ti-Guy rejoint la ruche",
    summary:
      "Copilote IA intégré à l'app — aide à la création, modération assistée et réponses en français québécois.",
    tag: "IA",
  },
] as const;

export const NewsroomPage: React.FC = () => {
  return (
    <CompanyPageShell title="Newsroom">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
        Newsroom
      </h1>
      <p className="text-white/80 text-lg leading-relaxed mb-8">
        Nouvelles, lancements produit et communiqués pour la presse. Pour toute
        demande média, écris à{" "}
        <a
          href="mailto:press@zyeute.com"
          className="text-gold-400 hover:underline"
        >
          press@zyeute.com
        </a>
        .
      </p>

      <div className="space-y-6">
        {PRESS_ITEMS.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-gold-400/90 text-xs font-bold uppercase tracking-wide">
                {item.tag}
              </span>
              <span className="text-white/40 text-sm">{item.date}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{item.title}</h2>
            <p className="text-white/70 leading-relaxed">{item.summary}</p>
          </article>
        ))}
      </div>

      <section className="mt-10 pt-8 border-t border-white/10">
        <h2 className="text-xl font-bold text-gold-400 mb-3">Kit presse</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          Logo, captures d&apos;écran et faits saillants sur demande. Contacte
          notre équipe communications pour un dossier complet.
        </p>
        <Link
          to="/contact"
          className="inline-block px-4 py-2 rounded-lg bg-gold-500 text-black text-sm font-bold hover:bg-gold-400 transition-colors"
        >
          Demande presse
        </Link>
      </section>
    </CompanyPageShell>
  );
};

export default NewsroomPage;
