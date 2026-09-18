/**
 * Landing Page - Public-facing home page for non-authenticated users
 * Houses the Hero component with CTA buttons
 */

import React from "react";
import { Hero } from "@/components/Hero";
import { useSEO } from "@/hooks/useSEO";

const Landing: React.FC = () => {
  useSEO({
    title: "Quessé qui se passe icitte?",
    description:
      "L'app vidéo du Québec. Clips de ta rue — Montréal, Québec, Gatineau. En français.",
    url: "/",
  });

  return (
    <div className="min-h-screen">
      <Hero />
    </div>
  );
};

export default Landing;
