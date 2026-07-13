import React from "react";
import { Link } from "react-router-dom";
import { CompanyPageShell } from "./CompanyPageShell";
import { useSEO } from "@/hooks/useSEO";

const CONTACT_CHANNELS = [
  {
    label: "Support général",
    email: "support@zyeute.com",
    desc: "Compte, bugs, aide avec l'app",
  },
  {
    label: "Presse & partenariats",
    email: "press@zyeute.com",
    desc: "Médias, collaborations, événements",
  },
  {
    label: "Confidentialité",
    email: "privacy@zyeute.com",
    desc: "Données personnelles, Loi 25, GDPR",
  },
  {
    label: "Juridique",
    email: "legal@zyeute.com",
    desc: "Conditions, propriété intellectuelle",
  },
  {
    label: "Modération",
    email: "moderation@zyeute.com",
    desc: "Signalements, sécurité communautaire",
  },
] as const;

export const ContactPage: React.FC = () => {
  useSEO({
    title: "Contact",
    description:
      "Contacte Zyeute : support, presse, confidentialité, juridique et modération. On répond en français.",
    url: "/contact",
  });

  return (
    <CompanyPageShell title="Contact">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
        Nous joindre
      </h1>
      <p className="text-white/80 text-lg leading-relaxed mb-8">
        Une question, un problème ou une idée? Choisis le bon courriel — on
        répond en français, du lundi au vendredi.
      </p>

      <div className="space-y-4 mb-10">
        {CONTACT_CHANNELS.map((ch) => (
          <div
            key={ch.email}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="text-lg font-bold text-white mb-1">{ch.label}</h2>
            <p className="text-white/60 text-sm mb-3">{ch.desc}</p>
            <a
              href={`mailto:${ch.email}`}
              className="text-gold-400 font-semibold hover:underline"
            >
              {ch.email}
            </a>
          </div>
        ))}
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-gold-400 mb-3">Site web</h2>
        <a
          href="https://zyeute.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-400 hover:underline"
        >
          zyeute.com
        </a>
      </section>

      <section className="pt-6 border-t border-white/10">
        <h2 className="text-xl font-bold text-gold-400 mb-3">
          Documents légaux
        </h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link to="/legal/terms" className="text-white/70 hover:text-gold-400">
            Conditions d&apos;utilisation
          </Link>
          <Link
            to="/legal/privacy"
            className="text-white/70 hover:text-gold-400"
          >
            Politique de confidentialité
          </Link>
          <Link
            to="/legal/community"
            className="text-white/70 hover:text-gold-400"
          >
            Règles de la communauté
          </Link>
        </div>
      </section>

      <p className="text-white/50 text-sm mt-8">Zyeuté Inc. — Québec, Canada</p>
    </CompanyPageShell>
  );
};

export default ContactPage;
