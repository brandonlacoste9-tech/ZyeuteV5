/**
 * GiftPicker — TikTok-style gift sheet
 * Opens from video feed or profile. Shows gift items with cenne cost.
 * Deducts from balance on send; floats sent gift emoji as animation.
 */

import React, { useEffect, useState, useRef } from "react";
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

interface FloatingGift {
  id: string;
  emoji: string;
  x: number;
}

interface GiftPickerProps {
  recipientId: string;
  recipientName: string;
  postId?: string;
  onClose: () => void;
  /** Container ref so we can float emojis over the video */
  containerRef?: React.RefObject<HTMLElement>;
}

export function GiftPicker({
  recipientId,
  recipientName,
  postId,
  onClose,
}: GiftPickerProps) {
  const { user } = useAuth();
  const { fire: fireHaptic } = useHaptics();
  const navigate = useNavigate();

  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [selected, setSelected] = useState<GiftItem | null>(null);
  const [sending, setSending] = useState(false);
  const [floaters, setFloaters] = useState<FloatingGift[]>([]);
  const floaterCounter = useRef(0);

  useEffect(() => {
    Promise.all([
      getCenneCatalog(),
      user
        ? getCenneBalance()
        : Promise.resolve({ balance: 0, balanceDisplay: "0¢" }),
    ]).then(([catalog, bal]) => {
      setGifts(catalog.gifts);
      setBalance(bal.balance);
    });
  }, [user]);

  const spawnFloater = (emoji: string) => {
    const id = String(++floaterCounter.current);
    const x = 20 + Math.random() * 60; // % from left
    setFloaters((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 1800);
  };

  const handleSend = async () => {
    if (!user) {
      toast.error("Connecte-toi pour envoyer un cadeau.");
      navigate("/login");
      return;
    }
    if (!selected) return;
    if (balance < selected.cost) {
      toast.error("Solde insuffisant — achète des cennes dans la boutique!");
      navigate("/store");
      onClose();
      return;
    }

    setSending(true);
    try {
      const result = await sendGift(recipientId, selected.id, postId);
      fireHaptic();
      spawnFloater(selected.emoji);
      setBalance(result.newBalance);
      toast.success(`${selected.emoji} Cadeau envoyé à ${recipientName}!`);
      setSelected(null);
    } catch (err: any) {
      if (
        err.message?.includes("insuffisant") ||
        err.message?.includes("INSUFFICIENT")
      ) {
        toast.error("Solde insuffisant — achète des cennes dans la boutique!");
        navigate("/store");
        onClose();
      } else {
        toast.error(err.message || "Erreur lors de l'envoi");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating emojis */}
      {floaters.map((f) => (
        <div
          key={f.id}
          className="fixed bottom-48 z-[200] text-4xl pointer-events-none animate-gift-float"
          style={{ left: `${f.x}%` }}
        >
          {f.emoji}
        </div>
      ))}

      {/* Sheet backdrop */}
      <div
        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[160] bg-[#1a0f0a] border-t-2 border-gold-700/50 rounded-t-3xl p-5 safe-area-bottom">
        {/* Handle */}
        <div className="w-12 h-1 bg-leather-600 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-black text-lg">Envoyer un cadeau</h3>
            <p className="text-leather-400 text-sm">à {recipientName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gold-500/10 border border-gold-500/30 px-3 py-1.5 rounded-full">
              <span className="text-gold-400 font-black">{balance}¢</span>
            </div>
            <button
              onClick={() => {
                navigate("/store");
                onClose();
              }}
              className="text-gold-400 text-xs font-semibold underline"
            >
              Acheter +
            </button>
          </div>
        </div>

        {/* Gift grid */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {gifts.map((gift) => {
            const isSelected = selected?.id === gift.id;
            const canAfford = balance >= gift.cost;
            return (
              <button
                key={gift.id}
                onClick={() => setSelected(isSelected ? null : gift)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                  isSelected
                    ? "bg-gold-500/30 ring-2 ring-gold-500 scale-105"
                    : canAfford
                      ? "bg-white/5 hover:bg-white/10 active:scale-95"
                      : "bg-white/3 opacity-40"
                }`}
              >
                <span className="text-3xl">{gift.emoji}</span>
                <span className="text-leather-200 text-[10px] font-semibold leading-tight text-center">
                  {gift.name}
                </span>
                <span
                  className={`text-[10px] font-black ${canAfford ? "text-gold-400" : "text-leather-500"}`}
                >
                  {gift.cost}¢
                </span>
              </button>
            );
          })}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!selected || sending}
          className="w-full py-3.5 rounded-2xl font-black text-base transition-all btn-gold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-leather-900/40 border-t-leather-900 rounded-full animate-spin" />
              Envoi...
            </span>
          ) : selected ? (
            `Envoyer ${selected.emoji} ${selected.name} — ${selected.cost}¢`
          ) : (
            "Choisis un cadeau"
          )}
        </button>
      </div>
    </>
  );
}
