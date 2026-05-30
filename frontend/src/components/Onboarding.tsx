import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import copy from "../lib/copy";

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action?: string;
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bienvenue icitte! 🦫",
    subtitle:
      "Zyeuté, c'est l'app sociale du Québec. Crée, partage, pis connecte-toi avec du monde d'icitte.",
    icon: (
      <svg
        viewBox="0 0 100 100"
        className="w-20 h-20"
        style={{ filter: "drop-shadow(0 0 15px rgba(255,191,0,0.6))" }}
      >
        <defs>
          <linearGradient id="goldOnboarding" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#DAA520" />
          </linearGradient>
        </defs>
        <path
          d="M50 5 C50 5 45 15 45 22 C45 27 47 30 50 32 C53 30 55 27 55 22 C55 15 50 5 50 5 Z
             M50 32 L50 45 
             M35 35 C25 30 20 35 20 42 C20 48 25 52 32 50 C38 48 42 44 45 40 
             M65 35 C75 30 80 35 80 42 C80 48 75 52 68 50 C62 48 58 44 55 40
             M50 45 L50 75 
             M50 55 L35 70 C30 75 25 78 25 85 C25 90 30 92 35 90 
             M50 55 L65 70 C70 75 75 78 75 85 C75 90 70 92 65 90
             M40 75 L60 75 L55 85 L45 85 Z"
          fill="none"
          stroke="url(#goldOnboarding)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "tiguy",
    title: "Salut! Moi c'est Ti-Guy 🦫",
    subtitle:
      "J'suis ton assistant québécois. J'peux t'aider à créer des légendes, générer des images avec l'IA, pis plein d'autres affaires!",
    icon: (
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center shadow-2xl border-4 border-gold-500/50">
          <span className="text-5xl">🦫</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center shadow-lg">
          <svg
            className="w-5 h-5 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
      </div>
    ),
    action: "Allo Ti-Guy! 👋",
  },
  {
    id: "fire",
    title: "Les feux, c'est notre affaire 🔥",
    subtitle:
      "Icitte, on \"fire\" au lieu de liker. Plus t'as de feux, plus ton contenu est hot! C'est simple de même.",
    icon: (
      <div className="relative">
        <span
          className="text-7xl animate-pulse"
          style={{ filter: "drop-shadow(0 0 20px rgba(255, 100, 0, 0.6))" }}
        >
          🔥
        </span>
      </div>
    ),
  },
  {
    id: "studio",
    title: "Ti-Guy Studio ✨",
    subtitle:
      "Crée des images avec l'IA, anime tes photos en vidéo, pis laisse Ti-Guy t'écrire des légendes qui claquent!",
    icon: (
      <div className="grid grid-cols-2 gap-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <span className="text-2xl">🎨</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
          <span className="text-2xl">🎬</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
          <span className="text-2xl">✍️</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
          <span className="text-2xl">🦫</span>
        </div>
      </div>
    ),
    action: "Essayer le Studio",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsExiting(false);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handleComplete = (goToStudio = false) => {
    localStorage.setItem("zyeute_onboarding_complete", "true");
    onComplete();
    if (goToStudio) {
      navigate("/ai-studio");
    }
  };

  const handleSkip = () => {
    handleComplete(false);
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,191,0,0.15) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-8 bg-gold-500"
                  : index < currentStep
                    ? "bg-gold-500/50"
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div
          className={`text-center transition-all duration-300 ${
            isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
          }`}
        >
          {/* Icon */}
          <div className="flex justify-center mb-8 bounce-in">{step.icon}</div>

          {/* Title */}
          <h2
            className="text-3xl font-bold mb-4"
            style={{
              fontFamily: "'Georgia', serif",
              background: "linear-gradient(180deg, #FFD700 0%, #DAA520 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {step.title}
          </h2>

          {/* Subtitle */}
          <p className="text-white/70 text-lg leading-relaxed mb-10 px-4">
            {step.subtitle}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Main action */}
          <button
            onClick={() =>
              isLastStep && step.action ? handleComplete(true) : handleNext()
            }
            className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 press-effect hover-glow"
            style={{
              background: "linear-gradient(135deg, #FFD700 0%, #DAA520 100%)",
              color: "#1a1a1a",
              boxShadow: "0 4px 20px rgba(255,191,0,0.4)",
            }}
          >
            {step.action || (isLastStep ? "C'est parti! 🚀" : "Suivant")}
          </button>

          {/* Skip */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="w-full py-3 text-white/50 hover:text-white/80 transition-colors text-sm"
            >
              Passer l'intro
            </button>
          )}

          {/* Secondary action on last step */}
          {isLastStep && (
            <button
              onClick={() => handleComplete(false)}
              className="w-full py-3 rounded-xl font-medium transition-all duration-300 border border-gold-500/30 text-gold-400 hover:bg-gold-500/10"
            >
              Commencer à explorer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("zyeute_onboarding_complete");
    if (!completed) {
      setShowOnboarding(true);
    }
    setIsChecked(true);
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("zyeute_onboarding_complete");
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    isChecked,
    completeOnboarding,
    resetOnboarding,
  };
}

export default Onboarding;
