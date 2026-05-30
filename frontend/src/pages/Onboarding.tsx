/**
 * Onboarding Page — Region + Interest Picker
 * Shown to new users after signup, before their first feed visit.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://zyeute-backend.up.railway.app";

const REGIONS = [
  "Montréal",
  "Québec",
  "Laval",
  "Gatineau",
  "Sherbrooke",
  "Saguenay",
  "Lévis",
  "Trois-Rivières",
  "Terrebonne",
  "Longueuil",
  "Ailleurs au Québec",
];

const INTERESTS = [
  { emoji: "🎵", label: "Musique québécoise" },
  { emoji: "🏒", label: "Hockey" },
  { emoji: "😂", label: "Humour" },
  { emoji: "🍁", label: "Culture" },
  { emoji: "🍽️", label: "Cuisine" },
  { emoji: "🎭", label: "Arts & spectacles" },
  { emoji: "🏔️", label: "Nature & plein air" },
  { emoji: "💃", label: "Danse" },
  { emoji: "🎮", label: "Gaming" },
  { emoji: "📱", label: "Tech" },
  { emoji: "🏋️", label: "Fitness" },
  { emoji: "✨", label: "Mode" },
  { emoji: "🎬", label: "Cinéma québécois" },
  { emoji: "🌍", label: "Actualités" },
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleInterest = (label: string) => {
    setSelectedInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  };

  const handleSkip = () => {
    localStorage.setItem("zyeute_onboarded", "1");
    navigate("/feed");
  };

  const handleContinueStep1 = () => {
    if (!selectedRegion) return;
    setStep(2);
  };

  const handleFinish = async () => {
    if (selectedInterests.length < 3) return;

    setIsSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        // Patch region
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

        // Fetch current custom_permissions and merge interests
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
    } catch (err) {
      // Non-fatal — still proceed to feed
      console.warn("[Onboarding] Failed to save preferences:", err);
    } finally {
      setIsSaving(false);
    }

    localStorage.setItem("zyeute_onboarded", "1");
    toast.success("Bienvenue dans la communauté québécoise! 🍁");
    navigate("/feed");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 py-8 relative"
      style={{ backgroundColor: "#0D0A06" }}
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(218,165,32,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="w-full max-w-md z-10 flex flex-col min-h-screen">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-8 pt-2">
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: step >= 1 ? "#DAA520" : "rgba(218,165,32,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: step >= 1 ? "#0D0A06" : "#DAA520",
                fontWeight: 700,
                fontSize: 14,
                border: "2px solid #DAA520",
                transition: "all 0.3s",
              }}
            >
              {step > 1 ? "✓" : "1"}
            </div>
            <div
              style={{
                height: 2,
                width: 40,
                background: step > 1 ? "#DAA520" : "rgba(218,165,32,0.2)",
                transition: "background 0.3s",
              }}
            />
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: step >= 2 ? "#DAA520" : "rgba(218,165,32,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: step >= 2 ? "#0D0A06" : "#DAA520",
                fontWeight: 700,
                fontSize: 14,
                border: "2px solid #DAA520",
                transition: "all 0.3s",
              }}
            >
              2
            </div>
          </div>
          <span
            style={{
              color: "rgba(218,165,32,0.7)",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            Étape {step}/2
          </span>
        </div>

        {/* ── STEP 1: RÉGION ── */}
        {step === 1 && (
          <div className="flex flex-col flex-1">
            <div className="mb-6">
              <h1
                style={{
                  color: "#DAA520",
                  fontSize: 26,
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

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pb-4">
              {REGIONS.map((region) => {
                const isSelected = selectedRegion === region;
                return (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      borderRadius: 14,
                      border: isSelected
                        ? "2px solid #DAA520"
                        : "2px solid rgba(218,165,32,0.2)",
                      background: isSelected
                        ? "rgba(218,165,32,0.12)"
                        : "rgba(255,255,255,0.03)",
                      color: isSelected ? "#DAA520" : "rgba(255,255,255,0.85)",
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
                    <span style={{ fontSize: 20 }}>⚜️</span>
                    <span>{region}</span>
                    {isSelected && (
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "#DAA520",
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

            {/* Bottom actions */}
            <div className="pt-4 pb-2 mt-auto">
              <button
                onClick={handleContinueStep1}
                disabled={!selectedRegion}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 14,
                  background: selectedRegion
                    ? "linear-gradient(135deg, #DAA520 0%, #B8860B 100%)"
                    : "rgba(218,165,32,0.2)",
                  color: selectedRegion ? "#0D0A06" : "rgba(218,165,32,0.4)",
                  fontSize: 16,
                  fontWeight: 800,
                  border: "none",
                  cursor: selectedRegion ? "pointer" : "not-allowed",
                  letterSpacing: "0.03em",
                  transition: "all 0.2s",
                  boxShadow: selectedRegion
                    ? "0 4px 16px rgba(218,165,32,0.3)"
                    : "none",
                }}
              >
                Continuer →
              </button>
              <button
                onClick={handleSkip}
                style={{
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
                }}
              >
                Passer
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: INTÉRÊTS ── */}
        {step === 2 && (
          <div className="flex flex-col flex-1">
            <div className="mb-6">
              <h1
                style={{
                  color: "#DAA520",
                  fontSize: 26,
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
                    color: "#DAA520",
                    fontSize: 12,
                    marginTop: 6,
                    opacity: 0.8,
                  }}
                >
                  {3 - selectedInterests.length} de plus pour continuer
                </p>
              )}
            </div>

            {/* Interest chips grid */}
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
                        ? "2px solid #DAA520"
                        : "2px solid rgba(218,165,32,0.2)",
                      background: isSelected
                        ? "rgba(218,165,32,0.15)"
                        : "rgba(255,255,255,0.04)",
                      color: isSelected ? "#DAA520" : "rgba(255,255,255,0.75)",
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

            {/* Bottom actions */}
            <div className="pt-4 pb-2 mt-auto">
              <button
                onClick={handleFinish}
                disabled={selectedInterests.length < 3 || isSaving}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 14,
                  background:
                    selectedInterests.length >= 3 && !isSaving
                      ? "linear-gradient(135deg, #DAA520 0%, #B8860B 100%)"
                      : "rgba(218,165,32,0.2)",
                  color:
                    selectedInterests.length >= 3 && !isSaving
                      ? "#0D0A06"
                      : "rgba(218,165,32,0.4)",
                  fontSize: 16,
                  fontWeight: 800,
                  border: "none",
                  cursor:
                    selectedInterests.length >= 3 && !isSaving
                      ? "pointer"
                      : "not-allowed",
                  letterSpacing: "0.03em",
                  transition: "all 0.2s",
                  boxShadow:
                    selectedInterests.length >= 3 && !isSaving
                      ? "0 4px 16px rgba(218,165,32,0.3)"
                      : "none",
                }}
              >
                {isSaving ? "Enregistrement..." : "Commencer →"}
              </button>
              <button
                onClick={handleSkip}
                style={{
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
                }}
              >
                Passer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
