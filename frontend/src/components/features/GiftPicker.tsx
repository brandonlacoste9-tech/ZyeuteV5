/**
 * GiftPicker — feed gift sheet (cennes balance)
 * Leather + gold chrome, clear grid, floating send + full-screen celebration.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCenneCatalog,
  getCenneBalance,
  sendGift,
  type GiftItem,
} from "../../services/cenneService";
import { toast } from "../Toast";
import { useHaptics } from "../../hooks/useHaptics";
import { useAuth } from "../../contexts/AuthContext";
import usePremium from "../../hooks/usePremium";
import { SheetShell } from "@/components/ui/SheetShell";
import {
  GiftIcon,
  getCreatorShare,
  getGiftTier,
  giftTierBorderClass,
} from "@/lib/giftCatalog";
import { GiftOverlay } from "./GiftOverlay";

interface FloatingGift {
  id: string;
  emoji: string;
  x: number;
}

interface GiftPickerProps {
  recipientId: string;
  recipientName: string;
  postId?: string;
  streamId?: string;
  onClose: () => void;
  onGiftSent?: (gift: GiftItem) => void;
}

export function GiftPicker({
  recipientId,
  recipientName,
  postId,
  streamId,
  onClose,
  onGiftSent,
}: GiftPickerProps) {
  const { user } = useAuth();
  const { fire: fireHaptic } = useHaptics();
  const navigate = useNavigate();
  const { isPremium } = usePremium();

  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [selected, setSelected] = useState<GiftItem | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [floaters, setFloaters] = useState<FloatingGift[]>([]);
  const [celebration, setCelebration] = useState<{
    emoji: string;
    type: string;
  } | null>(null);
  const floaterCounter = useRef(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [catalog, bal] = await Promise.all([
        getCenneCatalog(),
        user
          ? getCenneBalance()
          : Promise.resolve({ balance: 0, balanceDisplay: "0¢" }),
      ]);
      setGifts([...catalog.gifts].sort((a, b) => a.cost - b.cost));
      setBalance(bal.balance);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Impossible de charger les cadeaux";
      setLoadError(msg);
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const spawnFloater = (emoji: string) => {
    const id = String(++floaterCounter.current);
    const x = 25 + Math.random() * 50;
    setFloaters((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 2000);
  };

  const handleSend = async () => {
    if (!user) {
      toast.error("Connecte-toi pour envoyer un cadeau.");
      navigate("/login", { state: { from: "/feed" } });
      return;
    }
    if (!selected) return;
    if (!recipientId) {
      toast.error("Créateur introuvable pour ce cadeau.");
      return;
    }
    if (balance < selected.cost) {
      toast.error("Solde insuffisant — achète des cennes dans la boutique!");
      navigate("/store");
      onClose();
      return;
    }

    setSending(true);
    try {
      const result = await sendGift(recipientId, selected.id, postId, streamId);
      fireHaptic();
      spawnFloater(selected.emoji);
      setCelebration({ emoji: selected.emoji, type: selected.id });
      setBalance(result.newBalance);
      toast.success(`${selected.emoji} Cadeau envoyé à ${recipientName}!`);
      onGiftSent?.(selected);
      setSelected(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("insuffisant") || message.includes("INSUFFICIENT")) {
        toast.error("Solde insuffisant — achète des cennes dans la boutique!");
        navigate("/store");
        onClose();
      } else if (
        message.includes("Unauthorized") ||
        message.includes("401") ||
        message.toLowerCase().includes("connect")
      ) {
        toast.error("Connecte-toi pour envoyer un cadeau.");
        navigate("/login", { state: { from: "/feed" } });
      } else {
        toast.error(message || "Erreur lors de l'envoi");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {floaters.map((f) => (
        <div
          key={f.id}
          className="fixed bottom-40 left-0 z-[200] pointer-events-none flex flex-col items-center animate-gift-float"
          style={{ left: `${f.x}%`, transform: "translateX(-50%)" }}
        >
          <span className="text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
            {f.emoji}
          </span>
        </div>
      ))}

      {celebration && (
        <GiftOverlay
          giftType={celebration.type}
          emoji={celebration.emoji}
          recipientName={recipientName}
          isVisible
          onComplete={() => setCelebration(null)}
        />
      )}

      <SheetShell
        open
        onClose={onClose}
        className="z-[160]"
        panelClassName="px-4 pb-safe max-h-[88vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="mt-1 flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-white font-black text-lg tracking-tight">
              Envoyer un cadeau
            </h3>
            <p className="text-white/55 text-sm truncate">
              à{" "}
              <span className="text-gold-400 font-semibold">
                {recipientName}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-black/40 border border-gold-500/35 px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(212,175,55,0.12)]">
              <span className="text-gold-400 text-xs font-bold">¢</span>
              <span className="text-gold-400 font-black tabular-nums">
                {user ? balance : "—"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigate(user ? "/store" : "/login");
                onClose();
              }}
              className="min-h-10 rounded-full px-3 text-xs font-bold bg-gold-500 text-black hover:bg-gold-400 transition-colors"
            >
              {user ? "Acheter +" : "Connexion"}
            </button>
          </div>
        </div>

        {!user && (
          <div className="mb-4 rounded-xl border border-gold-500/25 bg-gold-500/10 px-3 py-2.5">
            <p className="text-gold-200 text-xs font-semibold">
              Connecte-toi pour envoyer des cadeaux avec tes cennes.
            </p>
          </div>
        )}

        {user && !isPremium && balance === 0 && (
          <div className="mb-4 rounded-xl p-3 flex items-center justify-between gap-2 border border-gold-500/30 bg-gradient-to-r from-gold-500/15 to-transparent">
            <div className="min-w-0">
              <p className="text-gold-300 text-xs font-bold">
                Abonnés Argent/Or reçoivent des cennes chaque mois
              </p>
              <p className="text-white/50 text-[11px] mt-0.5">
                Ou achète un pack dans la boutique
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigate("/premium");
                onClose();
              }}
              className="shrink-0 px-3 py-1.5 rounded-full bg-gold-500 text-black text-xs font-black"
            >
              Upgrader
            </button>
          </div>
        )}

        {/* Catalog */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white/5 border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-red-200 text-sm font-semibold mb-2">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void loadData()}
              className="text-gold-400 text-sm font-bold underline"
            >
              Réessayer
            </button>
          </div>
        ) : gifts.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-8 mb-5">
            Aucun cadeau disponible pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-5">
            {gifts.map((gift) => {
              const isSelected = selected?.id === gift.id;
              const canAfford = !user || balance >= gift.cost;
              const tier = getGiftTier(gift.cost);
              const creatorShare = getCreatorShare(gift.cost);
              return (
                <button
                  key={gift.id}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : gift)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 ${giftTierBorderClass(tier)} ${
                    isSelected
                      ? "bg-gold-500/25 ring-2 ring-gold-400 scale-[1.03] shadow-[0_0_16px_rgba(212,175,55,0.25)]"
                      : canAfford
                        ? "bg-black/35 hover:bg-white/10 active:scale-95 border border-white/10"
                        : "bg-black/20 opacity-45 border border-white/5"
                  }`}
                >
                  <div className="h-10 flex items-center justify-center">
                    <GiftIcon
                      id={gift.id}
                      emoji={gift.emoji}
                      className="w-9 h-9"
                    />
                  </div>
                  <span className="text-white/90 text-[11px] font-semibold leading-tight text-center line-clamp-1">
                    {gift.name}
                  </span>
                  <span
                    className={`text-[11px] font-black tabular-nums ${canAfford ? "text-gold-400" : "text-white/35"}`}
                  >
                    {gift.cost}¢
                  </span>
                  <span className="text-[9px] text-gold-500/70 leading-tight text-center">
                    Créateur {creatorShare}¢
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!selected || sending || loading}
          className="w-full py-3.5 rounded-2xl font-black text-base transition-all btn-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Envoi...
            </span>
          ) : selected ? (
            `Envoyer ${selected.emoji} ${selected.name} — ${selected.cost}¢`
          ) : (
            "Choisis un cadeau"
          )}
        </button>
        <p className="text-white/35 text-[10px] text-center mt-3 leading-relaxed">
          70% des cennes vont au créateur · 30% Zyeuté
        </p>
      </SheetShell>
    </>
  );
}

export default GiftPicker;
