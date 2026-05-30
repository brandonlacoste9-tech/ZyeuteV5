/**
 * Remix Modal (TikTok-style Duet/Stitch)
 * Allows users to create remixed content
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";

interface RemixModalProps {
  postId: string;
  postMediaUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

type RemixType = "duet" | "stitch" | "react";

export const RemixModal: React.FC<RemixModalProps> = ({
  postId,
  postMediaUrl,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { tap } = useHaptics();
  const [selectedType, setSelectedType] = useState<RemixType | null>(null);

  if (!isOpen) return null;

  const handleRemixTypeSelect = (type: RemixType) => {
    setSelectedType(type);
    tap();
  };

  const handleCreateRemix = () => {
    if (!selectedType) return;

    // Navigate to upload page with remix context
    navigate(`/upload?remix=${postId}&type=${selectedType}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Glassmorphism Modal - UI Pro Max Style #3 */}
      {/* The video behind is blurred by the backdrop-filter above */}
      <div
        className="rounded-2xl border w-full max-w-md mx-4 p-6 relative"
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
          borderColor: "rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Créer un Remix</h2>
          <p className="text-white/60 text-sm">
            Choisis comment tu veux remixer cette vidéo
          </p>
        </div>

        {/* Remix Type Options */}
        <div className="space-y-3 mb-6">
          {/* Duet Option */}
          <button
            onClick={() => handleRemixTypeSelect("duet")}
            className={cn(
              "w-full p-4 rounded-xl border-2 transition-all text-left",
              selectedType === "duet"
                ? "border-gold-500 bg-gold-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/10",
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gold-500/20 flex items-center justify-center text-2xl">
                👥
              </div>
              <div className="flex-1">
                <div className="font-bold text-white mb-1">Duet</div>
                <div className="text-sm text-white/60">
                  Crée une vidéo côte à côte avec celle-ci
                </div>
              </div>
            </div>
          </button>

          {/* Stitch Option */}
          <button
            onClick={() => handleRemixTypeSelect("stitch")}
            className={cn(
              "w-full min-h-[44px] p-4 rounded-xl border-2 transition-all duration-[200ms] text-left touch-manipulation",
              selectedType === "stitch"
                ? "border-gold-500 bg-gold-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/10 focus:ring-2 focus:ring-gold-500 focus:ring-offset-2",
            )}
            style={{ touchAction: "manipulation" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gold-500/20 flex items-center justify-center text-2xl">
                ✂️
              </div>
              <div className="flex-1">
                <div className="font-bold text-white mb-1">Stitch</div>
                <div className="text-sm text-white/60">
                  Utilise un extrait de cette vidéo dans la tienne
                </div>
              </div>
            </div>
          </button>

          {/* React Option */}
          <button
            onClick={() => handleRemixTypeSelect("react")}
            className={cn(
              "w-full p-4 rounded-xl border-2 transition-all text-left",
              selectedType === "react"
                ? "border-gold-500 bg-gold-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/10",
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gold-500/20 flex items-center justify-center text-2xl">
                💬
              </div>
              <div className="flex-1">
                <div className="font-bold text-white mb-1">Réagir</div>
                <div className="text-sm text-white/60">
                  Réagis à cette vidéo avec ta propre vidéo
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Action Button */}
        {/* Touch target: 44x44px minimum, Micro-interaction: 200-300ms (UI Pro Max) */}
        <button
          onClick={handleCreateRemix}
          disabled={!selectedType}
          className={cn(
            "w-full min-h-[44px] py-3 rounded-xl font-bold transition-all duration-[200ms] touch-manipulation",
            selectedType
              ? "bg-gold-gradient text-black hover:scale-105 active:scale-95 focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
              : "bg-white/10 text-white/40 cursor-not-allowed",
          )}
          style={{ touchAction: "manipulation" }}
        >
          Continuer
        </button>
      </div>
    </div>
  );
};
