/**
 * Onboarding Page — 5-step walkthrough for new users
 * Shown once on first login. Skipped if localStorage("zyeute_onboarded") is set.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://zyeutev5-1.onrender.com";

// ─────────────────────────────── DATA ────────────────────────────────

const REGIONS = [
  "Montréal",
  "Québec",
  "Laval",
  "Gatineau",
  "Sherbrooke",
  "Saguenay",
  "Trois-Rivières",
  "Autre",
];

const INTERESTS = [
  { emoji: "😂", label: "Humour" },
  { emoji: "🎵", label: "Musique" },
  { emoji: "🏒", label: "Sport" },
  { emoji: "🍽️", label: "Cuisine" },
  { emoji: "🏔️", label: "Nature" },
  { emoji: "✨", label: "Mode" },
  { emoji: "📱", label: "Tech" },
  { emoji: "🌙", label: "Nightlife" },
  { emoji: "🎨", label: "Art" },
  { emoji: "🎮", label: "Gaming" },
  { emoji: "🎭", label: "Arts & spectacles" },
  { emoji: "🎬", label: "Cinéma québécois" },
];

const GOLD = "#DAA520";
const DARK = "#0D0A06";
const GOLD_DIM = "rgba(218,165,32,0.2)";
const GOLD_FAINT = "rgba(218,165,32,0.08)";

// ─────────────────────────────── STYLES ──────────────────────────────

const btnGold = (active: boolean) =>
  ({
    padding: "16px",
    borderRadius: 14,
    background: active
      ? "linear-gradient(135deg, #DAA520 0%, #B8860B 100%)"
      : GOLD_DIM,
    color: active ? DARK : "rgba(218,165,32,0.4)",
    fontSize: 16,
    fontWeight: 800,
    border: "none",
    cursor: active ? "pointer" : "not-allowed",
    letterSpacing: "0.03em",
    transition: "all 0.2s",
    boxShadow: active ? "0 4px 16px rgba(218,165,32,0.3)" : "none",
    width: "100%",
  }) as React.CSSProperties;

const btnSkip: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "center",
  marginTop: 14,
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.35)",
  fontSize: 13,
  cursor: "pointer",
  padding: "4px 0",
};

// ─────────────────────────────── STEP INDICATOR ───────────────────────

function StepDot({
  n,
  current,
  total: _total,
}: {
  n: number;
  current: number;
  total: number;
}) {
  const done = n < current;
  const active = n === current;
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: done || active ? GOLD : GOLD_DIM,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: done || active ? DARK : GOLD,
        fontWeight: 700,
        fontSize: 13,
        border: `2px solid ${GOLD}`,
        transition: "all 0.3s",
        flexShrink: 0,
      }}
    >
      {done ? "✓" : n}
    </div>
  );
}

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 28,
        paddingTop: 8,
      }}
    >
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <React.Fragment key={n}>
          <StepDot n={n} current={step} total={total} />
          {n < total && (
            <div
              style={{
                height: 2,
                flex: 1,
                background: n < step ? GOLD : GOLD_DIM,
                transition: "background 0.3s",
              }}
            />
          )}
        </React.Fragment>
      ))}
      <span
        style={{
          color: "rgba(218,165,32,0.7)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.05em",
          marginLeft: 8,
          flexShrink: 0,
        }}
      >
        {step}/{total}
      </span>
    </div>
  );
}

// ─────────────────────────────── MAIN ────────────────────────────────

interface OnboardingProps {
  /** When provided, renders as a slide-up overlay instead of a full page */
  overlay?: boolean;
  onClose?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ overlay, onClose }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [visible, setVisible] = useState(false);

  // Slide-up entrance when used as overlay
  useEffect(() => {
    if (overlay) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [overlay]);

  // Guard: skip if already onboarded (page mode only)
  useEffect(() => {
    if (!overlay && localStorage.getItem("zyeute_onboarded")) {
      navigate("/feed", { replace: true });
    }
  }, [navigate, overlay]);

  const toggleInterest = (label: string) => {
    setSelectedInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  };

  const completeOnboarding = () => {
    localStorage.setItem("zyeute_onboarded", "true");
    if (overlay && onClose) {
      onClose();
    } else {
      navigate("/feed", { replace: true });
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        // Save region
        if (selectedRegion) {
          await fetch(`${API_BASE}/api/users/me`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ region: selectedRegion }),
          });
        }

        // Save interests merged into custom_permissions
        if (selectedInterests.length > 0) {
          const meRes = await fetch(`${API_BASE}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          let currentPermissions: Record<string, unknown> = {};
          if (meRes.ok) {
            const meData = await meRes.json();
            currentPermissions =
              meData?.custom_permissions ||
              meData?.user?.custom_permissions ||
              {};
          }
          await fetch(`${API_BASE}/api/users/me`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              custom_permissions: {
                ...currentPermissions,
                interests: selectedInterests,
              },
            }),
          });
        }
      }
    } catch (err) {
      console.warn("[Onboarding] Failed to save preferences:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = async () => {
    await savePreferences();
    completeOnboarding();
  };

  // ── RENDER ──
  const inner = (
    <div
      className="w-full max-w-md z-10 flex flex-col"
      style={{ minHeight: overlay ? "100%" : "100vh" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, ${GOLD_FAINT} 0%, transparent 60%)`,
        }}
      />
      <div className="w-full z-10 flex flex-col flex-1">
        {/* Step indicator */}
        <StepBar step={step} total={5} />

        {/* ── STEP 1: WELCOME ── */}
        {step === 1 && (
          <div className="flex flex-col flex-1">
            <div
              style={{ textAlign: "center", marginBottom: 32, paddingTop: 8 }}
            >
              {/* Logo / icon concept */}
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #DAA520 0%, #B8860B 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  boxShadow:
                    "0 0 0 8px rgba(218,165,32,0.15), 0 0 40px rgba(218,165,32,0.2)",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Zyeute logo"
                >
                  <path
                    d="M8 12 L24 12 L8 28 L24 28"
                    stroke="#0D0A06"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M26 20 L40 20 L26 36 L40 36"
                    stroke="#0D0A06"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1
                style={{
                  color: GOLD,
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 12,
                  letterSpacing: "-0.02em",
                }}
              >
                Bienvenue sur Zyeute! 🎉⚜️
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 16,
                  lineHeight: 1.6,
                  maxWidth: 300,
                  margin: "0 auto 8px",
                }}
              >
                L&apos;app sociale 100% québécoise
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 13,
                  lineHeight: 1.5,
                  maxWidth: 300,
                  margin: "0 auto",
                }}
              >
                Découvre du contenu de créateurs de chez nous, partage ta
                culture, et connecte-toi avec ta communauté.
              </p>
            </div>

            {/* Feature highlights */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                flex: 1,
              }}
            >
              {[
                {
                  icon: "🍁",
                  title: "Fait au Québec",
                  desc: "Pour les Québécois, par les Québécois",
                },
                {
                  icon: "🎥",
                  title: "Créateurs locaux",
                  desc: "Supporte les artistes de ta région",
                },
                {
                  icon: "⚜️",
                  title: "Communauté forte",
                  desc: "Rejoins des milliers de membres",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: `1px solid ${GOLD_DIM}`,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{f.icon}</span>
                  <div>
                    <p
                      style={{
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 15,
                        marginBottom: 2,
                      }}
                    >
                      {f.title}
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 13,
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{ paddingTop: 24, paddingBottom: 8, marginTop: "auto" }}
            >
              <button style={btnGold(true)} onClick={() => setStep(2)}>
                Commencer →
              </button>
              <button style={btnSkip} onClick={handleSkip}>
                Passer
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: INTERESTS ── */}
        {step === 2 && (
          <div className="flex flex-col flex-1">
            <div style={{ marginBottom: 20 }}>
              <h1
                style={{
                  color: GOLD,
                  fontSize: 24,
                  fontWeight: 800,
                  marginBottom: 8,
                  letterSpacing: "-0.01em",
                }}
              >
                Qu&apos;est-ce qui t&apos;intéresse?
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                Choisis au moins 3 catégories pour personnaliser ton expérience.
              </p>
              {selectedInterests.length > 0 && selectedInterests.length < 3 && (
                <p
                  style={{
                    color: GOLD,
                    fontSize: 12,
                    marginTop: 6,
                    opacity: 0.8,
                  }}
                >
                  {3 - selectedInterests.length} de plus pour continuer
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                flex: 1,
                alignContent: "flex-start",
                paddingBottom: 16,
              }}
            >
              {INTERESTS.map(({ emoji, label }) => {
                const isSelected = selectedInterests.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleInterest(label)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 999,
                      border: isSelected
                        ? `2px solid ${GOLD}`
                        : `2px solid ${GOLD_DIM}`,
                      background: isSelected
                        ? "rgba(218,165,32,0.15)"
                        : "rgba(255,255,255,0.04)",
                      color: isSelected ? GOLD : "rgba(255,255,255,0.75)",
                      fontSize: 14,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.18s",
                      boxShadow: isSelected
                        ? "0 0 0 1px rgba(218,165,32,0.25)"
                        : "none",
                    }}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <div
              style={{ paddingTop: 16, paddingBottom: 8, marginTop: "auto" }}
            >
              <button
                style={btnGold(selectedInterests.length >= 3)}
                onClick={() => selectedInterests.length >= 3 && setStep(3)}
                disabled={selectedInterests.length < 3}
              >
                Continuer →
              </button>
              <button style={btnSkip} onClick={handleSkip}>
                Passer
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: REGION ── */}
        {step === 3 && (
          <div className="flex flex-col flex-1">
            <div style={{ marginBottom: 20 }}>
              <h1
                style={{
                  color: GOLD,
                  fontSize: 24,
                  fontWeight: 800,
                  marginBottom: 8,
                  letterSpacing: "-0.01em",
                }}
              >
                Où es-tu au Québec?
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                On va personnaliser ton fil selon ta région.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                flex: 1,
                overflowY: "auto",
                paddingBottom: 16,
              }}
            >
              {REGIONS.map((region) => {
                const isSelected = selectedRegion === region;
                return (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    style={{
                      width: "100%",
                      padding: "15px 20px",
                      borderRadius: 14,
                      border: isSelected
                        ? `2px solid ${GOLD}`
                        : `2px solid ${GOLD_DIM}`,
                      background: isSelected
                        ? "rgba(218,165,32,0.12)"
                        : "rgba(255,255,255,0.03)",
                      color: isSelected ? GOLD : "rgba(255,255,255,0.85)",
                      fontSize: 16,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      transition: "all 0.2s",
                      boxShadow: isSelected
                        ? "0 0 0 1px rgba(218,165,32,0.3), 0 4px 12px rgba(218,165,32,0.1)"
                        : "none",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>⚜️</span>
                    <span>{region}</span>
                    {isSelected && (
                      <span
                        style={{
                          marginLeft: "auto",
                          color: GOLD,
                          fontSize: 18,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div
              style={{ paddingTop: 16, paddingBottom: 8, marginTop: "auto" }}
            >
              <button
                style={btnGold(!!selectedRegion)}
                onClick={() => selectedRegion && setStep(4)}
                disabled={!selectedRegion}
              >
                Continuer →
              </button>
              <button style={btnSkip} onClick={handleSkip}>
                Passer
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: SUBSCRIPTION UPSELL ── */}
        {step === 4 && (
          <div className="flex flex-col flex-1">
            <div style={{ marginBottom: 20 }}>
              <h1
                style={{
                  color: GOLD,
                  fontSize: 24,
                  fontWeight: 800,
                  marginBottom: 8,
                  letterSpacing: "-0.01em",
                }}
              >
                Passe au niveau supérieur 🚀
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                Débloques des avantages exclusifs avec nos forfaits premium.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                flex: 1,
              }}
            >
              {[
                {
                  name: "Bronze",
                  icon: "🥉",
                  price: "4,99$/mois",
                  perks: [
                    "Badge Bronze",
                    "100 Cennés/mois",
                    "Accès contenu exclusif",
                  ],
                  color: "rgba(205,127,50,0.15)",
                  border: "rgba(205,127,50,0.4)",
                },
                {
                  name: "Argent",
                  icon: "🥈",
                  price: "9,99$/mois",
                  perks: [
                    "Badge Argent",
                    "300 Cennés/mois",
                    "Stories exclusives",
                    "Chat prioritaire",
                  ],
                  color: "rgba(192,192,192,0.1)",
                  border: "rgba(192,192,192,0.35)",
                },
                {
                  name: "Or",
                  icon: "🥇",
                  price: "19,99$/mois",
                  perks: [
                    "Badge Or",
                    "1000 Cennés/mois",
                    "Tout inclus",
                    "Accès anticipé aux nouvelles fonctions",
                  ],
                  color: "rgba(218,165,32,0.12)",
                  border: GOLD,
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: `1.5px solid ${tier.border}`,
                    background: tier.color,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                  }}
                >
                  <span style={{ fontSize: 28, marginTop: 2 }}>
                    {tier.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 16,
                        }}
                      >
                        {tier.name}
                      </span>
                      <span
                        style={{
                          color: GOLD,
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {tier.price}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {tier.perks.map((p) => (
                        <span
                          key={p}
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.65)",
                            background: "rgba(255,255,255,0.06)",
                            padding: "3px 8px",
                            borderRadius: 999,
                          }}
                        >
                          ✓ {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{ paddingTop: 20, paddingBottom: 8, marginTop: "auto" }}
            >
              <button
                style={{
                  ...btnGold(true),
                  background:
                    "linear-gradient(135deg, #DAA520 0%, #B8860B 100%)",
                  color: DARK,
                }}
                onClick={() => {
                  // Navigate to premium, then return
                  window.location.href = "/premium";
                }}
              >
                Voir les forfaits →
              </button>
              <button
                style={{
                  ...btnSkip,
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 14,
                  marginTop: 12,
                  fontWeight: 600,
                }}
                onClick={() => setStep(5)}
              >
                Continuer gratuitement
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: READY! ── */}
        {step === 5 && (
          <div className="flex flex-col flex-1 items-center justify-center">
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div
                style={{
                  fontSize: 80,
                  marginBottom: 24,
                  filter: "drop-shadow(0 0 20px rgba(218,165,32,0.4))",
                }}
              >
                🚀
              </div>
              <h1
                style={{
                  color: GOLD,
                  fontSize: 30,
                  fontWeight: 900,
                  marginBottom: 14,
                  letterSpacing: "-0.02em",
                }}
              >
                Tu es prêt!
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 16,
                  lineHeight: 1.6,
                  maxWidth: 280,
                  margin: "0 auto 8px",
                }}
              >
                Ton profil est configuré. Explore le contenu québécois qui
                t&apos;attend!
              </p>

              {selectedInterests.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 20,
                    padding: "0 16px",
                  }}
                >
                  {selectedInterests.slice(0, 5).map((interest) => (
                    <span
                      key={interest}
                      style={{
                        fontSize: 12,
                        color: GOLD,
                        background: "rgba(218,165,32,0.1)",
                        border: `1px solid ${GOLD_DIM}`,
                        padding: "4px 12px",
                        borderRadius: 999,
                        fontWeight: 600,
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                width: "100%",
                paddingTop: 16,
                paddingBottom: 8,
                marginTop: "auto",
              }}
            >
              <button
                style={btnGold(!isSaving)}
                onClick={handleFinish}
                disabled={isSaving}
              >
                {isSaving ? "Enregistrement..." : "Explorer Zyeute 🍁"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        {/* Dim backdrop */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: "rgba(0,0,0,0.7)",
            opacity: visible ? 1 : 0,
          }}
          onClick={handleSkip}
        />
        {/* Sheet slides up */}
        <div
          className="relative w-full max-w-md flex flex-col overflow-y-auto transition-transform duration-500 ease-out rounded-t-3xl px-4 py-8"
          style={{
            backgroundColor: DARK,
            maxHeight: "92vh",
            transform: visible ? "translateY(0)" : "translateY(100%)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.8)",
          }}
        >
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 py-8 relative"
      style={{ backgroundColor: DARK }}
    >
      {inner}
    </div>
  );
};

export default Onboarding;
