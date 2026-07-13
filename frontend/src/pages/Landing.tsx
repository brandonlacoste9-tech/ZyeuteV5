/**
 * Landing Page - Public-facing home page for non-authenticated users
 * Houses the Hero component with CTA buttons
 */

import React from "react";
import { Hero } from "@/components/Hero";
import { useSEO } from "@/hooks/useSEO";

const Landing: React.FC = () => {
  useSEO({
    title: "L'app vidéo du Québec | TikTok québécois",
    description:
      "Zyeute est la plateforme de vidéos courtes 100% québécoise. Partage tes clips, découvre des créateurs de Montréal, Québec et partout au Québec.",
    url: "/",
  });

  return (
    <div className="min-h-screen">
      <Hero />
    </div>
  );
};

export default Landing;
