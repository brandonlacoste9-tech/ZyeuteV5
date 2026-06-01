/**
 * Zyeuté — Soft Onboarding Overlay
 *
 * Appears AFTER the user has scrolled past 3 videos (dopamine first).
 * Renders as a blurred overlay so the feed is still visible underneath —
 * creating FOMO and making the app feel alive behind the prompt.
 *
 * Steps:
 *   1. Hive selection (4 hives with mascot emojis)
 *   2. Language preference
 *   3. Welcome + CTA (sign up or continue as guest)
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HIVES, type HiveId } from "@/contexts/HiveContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OnboardingProps {
  onComplete: (hive?: HiveId, language?: string) => void;
}

type Step = "fomo" | "hive" | "language" | "welcome";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇨🇦" },
  { code: "es", label: "Español", flag: "🇲🇽" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🌐" },
];

// ─── Step 0: FOMO Splash ─────────────────────────────────────────────────────

const FOMO_IMAGES: Record<string, string> = {
  quebec: "/ad_story_fomo.jpg",
  mexico: "/ad_story_fomo_mexico.png",
  brazil: "/ad_story_fomo_brazil.png",
  argentina: "/ad_story_fomo_argentina.png",
};

const FOMOSplash: React.FC<{ hive: string | null; onNext: () => void }> = ({
  hive,
  onNext,
}) => {
  const imgSrc = FOMO_IMAGES[hive ?? "quebec"] ?? FOMO_IMAGES.quebec;
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Fade in
    const fadeIn = setTimeout(() => setVisible(true), 50);
    // Auto-advance after 3.5 seconds
    timerRef.current = setTimeout(() => onNext(), 3500);
    return () => {
      clearTimeout(fadeIn);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onNext]);

  return (
    <div
      className="fixed inset-0 z-50 cursor-pointer"
      onClick={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        onNext();
      }}
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Full-screen image */}
      <img
        src={imgSrc}
        alt="Rejoins la scène"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      {/* Tap to continue hint */}
      <div
        className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2"
        style={{ animation: "pulse 2s infinite" }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-white/60 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/80">
            <path d="M12 16l-6-6h12z" />
          </svg>
        </div>
        <span className="text-white/60 text-xs tracking-widest uppercase">
          Appuyer pour continuer
        </span>
      </div>
    </div>
  );
};

// ─── Overlay background (videos visible + blurred behind) ────────────────────

const OverlayBackdrop: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center"
    style={{
      background:
        "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.2) 100%)",
      backdropFilter: "blur(2px)",
      WebkitBackdropFilter: "blur(2px)",
    }}
  >
    {/* Tap outside does nothing — keeps user in onboarding */}
    <div className="w-full max-w-lg px-4 pb-10 pt-6">{children}</div>
  </div>
);

// ─── Step 1: Hive Selection ──────────────────────────────────────────────────

const HiveStep: React.FC<{
  selected: HiveId | null;
  onSelect: (h: HiveId) => void;
  onNext: () => void;
}> = ({ selected, onSelect, onNext }) => (
  <div className="animate-fade-in-up">
    <p className="text-white/50 text-xs uppercase tracking-widest mb-2 text-center">
      Étape 1 / 3
    </p>
    <h2
      className="text-2xl font-bold text-center mb-2"
      style={{
        background: "linear-gradient(180deg, #FFD700 0%, #DAA520 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      Quel est ton monde?
    </h2>
    <p className="text-white/60 text-sm text-center mb-6">
      Choisis ton hive — chaque communauté a sa culture, sa langue, son énergie.
    </p>

    <div className="grid grid-cols-2 gap-3 mb-6">
      {(Object.values(HIVES) as (typeof HIVES)[HiveId][]).map((hive) => {
        const isSelected = selected === hive.id;
        return (
          <button
            key={hive.id}
            onClick={() => onSelect(hive.id as HiveId)}
            className="relative flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-2xl border-2 transition-all duration-200 active:scale-95"
            style={{
              borderColor: isSelected ? "#FFD700" : "rgba(255,255,255,0.12)",
              background: isSelected
                ? "rgba(255,215,0,0.12)"
                : "rgba(255,255,255,0.05)",
              boxShadow: isSelected ? "0 0 20px rgba(255,215,0,0.25)" : "none",
            }}
          >
            <span className="text-4xl">{hive.mascotEmoji}</span>
            <span
              className="text-sm font-bold"
              style={{
                color: isSelected ? "#FFD700" : "rgba(255,255,255,0.8)",
              }}
            >
              {hive.flag} {hive.name}
            </span>
            <span className="text-xs text-white/40">{hive.personality}</span>
            {isSelected && (
              <div
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "#FFD700" }}
              >
                <svg
                  viewBox="0 0 12 12"
                  className="w-3 h-3"
                  fill="none"
                  stroke="#000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 6l3 3 5-5" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>

    <button
      onClick={onNext}
      disabled={!selected}
      className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
      style={{
        background: selected
          ? "linear-gradient(135deg, #FFD700 0%, #DAA520 100%)"
          : "rgba(255,255,255,0.1)",
        color: selected ? "#1a1a1a" : "rgba(255,255,255,0.4)",
        boxShadow: selected ? "0 4px 20px rgba(255,191,0,0.4)" : "none",
      }}
    >
      Suivant →
    </button>
  </div>
);

// ─── Step 2: Language ────────────────────────────────────────────────────────

const LanguageStep: React.FC<{
  selected: string | null;
  onSelect: (lang: string) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ selected, onSelect, onNext, onBack }) => (
  <div className="animate-fade-in-up">
    <p className="text-white/50 text-xs uppercase tracking-widest mb-2 text-center">
      Étape 2 / 3
    </p>
    <h2
      className="text-2xl font-bold text-center mb-2"
      style={{
        background: "linear-gradient(180deg, #FFD700 0%, #DAA520 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      Ta langue?
    </h2>
    <p className="text-white/60 text-sm text-center mb-6">
      On va personnaliser ton feed pis ton assistant IA.
    </p>

    <div className="flex flex-col gap-3 mb-6">
      {LANGUAGES.map((lang) => {
        const isSelected = selected === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className="flex items-center gap-4 py-4 px-5 rounded-xl border-2 transition-all duration-200 active:scale-[0.98]"
            style={{
              borderColor: isSelected ? "#FFD700" : "rgba(255,255,255,0.12)",
              background: isSelected
                ? "rgba(255,215,0,0.10)"
                : "rgba(255,255,255,0.05)",
            }}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span
              className="text-base font-semibold"
              style={{
                color: isSelected ? "#FFD700" : "rgba(255,255,255,0.85)",
              }}
            >
              {lang.label}
            </span>
            {isSelected && (
              <div className="ml-auto">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "#FFD700" }}
                >
                  <svg
                    viewBox="0 0 12 12"
                    className="w-3 h-3"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>

    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="flex-1 py-4 rounded-xl font-medium border border-white/20 text-white/60 hover:text-white/80 transition-colors"
      >
        ← Retour
      </button>
      <button
        onClick={onNext}
        disabled={!selected}
        className="flex-[2] py-4 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-30 active:scale-[0.98]"
        style={{
          background: selected
            ? "linear-gradient(135deg, #FFD700 0%, #DAA520 100%)"
            : "rgba(255,255,255,0.1)",
          color: selected ? "#1a1a1a" : "rgba(255,255,255,0.4)",
          boxShadow: selected ? "0 4px 20px rgba(255,191,0,0.4)" : "none",
        }}
      >
        Suivant →
      </button>
    </div>
  </div>
);

// ─── Step 3: Welcome / CTA ───────────────────────────────────────────────────

const WelcomeStep: React.FC<{
  hive: HiveId | null;
  onSignUp: () => void;
  onGuest: () => void;
  onBack: () => void;
}> = ({ hive, onSignUp, onGuest, onBack }) => {
  const hiveConfig = hive ? HIVES[hive] : HIVES.quebec;
  return (
    <div className="animate-fade-in-up text-center">
      <p className="text-white/50 text-xs uppercase tracking-widest mb-4">
        Étape 3 / 3
      </p>

      <div className="mb-4 flex justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-5xl shadow-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,215,0,0.2) 0%, rgba(0,0,0,0.4) 100%)",
            border: "2px solid rgba(255,215,0,0.3)",
          }}
        >
          {hiveConfig.mascotEmoji}
        </div>
      </div>

      <h2
        className="text-2xl font-bold mb-2"
        style={{
          background: "linear-gradient(180deg, #FFD700 0%, #DAA520 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Bienvenue dans {hiveConfig.name}!
      </h2>
      <p className="text-white/60 text-sm mb-8 px-4 leading-relaxed">
        {hiveConfig.personality} t'attend. Crée un compte pour réagir, commenter
        pis sauvegarder tes vidéos préférées.
      </p>

      <div className="space-y-3">
        <button
          onClick={onSignUp}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #DAA520 100%)",
            color: "#1a1a1a",
            boxShadow: "0 4px 24px rgba(255,191,0,0.45)",
          }}
        >
          Créer un compte gratuit 🚀
        </button>

        <button
          onClick={onGuest}
          className="w-full py-3 rounded-xl font-medium border border-white/20 text-white/60 hover:text-white/80 transition-colors text-sm"
        >
          Continuer sans compte
        </button>

        <button
          onClick={onBack}
          className="w-full py-2 text-white/30 hover:text-white/50 transition-colors text-xs"
        >
          ← Retour
        </button>
      </div>
    </div>
  );
};

// ─── Main Onboarding Component ───────────────────────────────────────────────

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("fomo");
  const [selectedHive, setSelectedHive] = useState<HiveId | null>(() => {
    const stored = localStorage.getItem("zyeute_hive_id") as HiveId | null;
    return stored && Object.keys(HIVES).includes(stored) ? stored : null;
  });
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(() =>
    localStorage.getItem("zyeute_preferred_language"),
  );

  const handleComplete = useCallback(
    (goToSignup = false) => {
      // Persist selections
      if (selectedHive) localStorage.setItem("zyeute_hive_id", selectedHive);
      if (selectedLanguage)
        localStorage.setItem("zyeute_preferred_language", selectedLanguage);
      localStorage.setItem("zyeute_onboarding_complete", "true");

      onComplete(selectedHive ?? undefined, selectedLanguage ?? undefined);

      if (goToSignup) {
        navigate("/signup");
      }
    },
    [selectedHive, selectedLanguage, onComplete, navigate],
  );

  const handleFOMONext = useCallback(() => setStep("hive"), []);

  return (
    <>
      {step === "fomo" && (
        <FOMOSplash hive={selectedHive} onNext={handleFOMONext} />
      )}
      {step !== "fomo" && (
        <OverlayBackdrop>
          {step === "hive" && (
            <HiveStep
              selected={selectedHive}
              onSelect={setSelectedHive}
              onNext={() => setStep("language")}
            />
          )}
          {step === "language" && (
            <LanguageStep
              selected={selectedLanguage}
              onSelect={setSelectedLanguage}
              onNext={() => setStep("welcome")}
              onBack={() => setStep("hive")}
            />
          )}
          {step === "welcome" && (
            <WelcomeStep
              hive={selectedHive}
              onSignUp={() => handleComplete(true)}
              onGuest={() => handleComplete(false)}
              onBack={() => setStep("language")}
            />
          )}
        </OverlayBackdrop>
      )}
    </>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useOnboarding — delays showing until the user has scrolled 3 videos.
 * Call `notifyVideoScrolled()` from Feed whenever onVideoChange fires.
 */
export function useOnboarding() {
  const videoCountRef = React.useRef(0);
  const alreadyDone =
    localStorage.getItem("zyeute_onboarding_complete") === "true";
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecked] = useState(true); // always ready immediately

  /** Call this every time the active video changes in the feed */
  const notifyVideoScrolled = useCallback(() => {
    if (alreadyDone || showOnboarding) return;
    videoCountRef.current += 1;
    if (videoCountRef.current >= 3) {
      setShowOnboarding(true);
    }
  }, [alreadyDone, showOnboarding]);

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem("zyeute_onboarding_complete");
    videoCountRef.current = 0;
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    isChecked,
    completeOnboarding,
    resetOnboarding,
    notifyVideoScrolled,
  };
}

export default Onboarding;
