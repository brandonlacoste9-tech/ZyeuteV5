import { useState } from "react";
import { featureFlags } from "@/lib/featureFlags";

const ACK = "zyeute_age_region_ack";

export function AgeGateModal() {
  const [open, setOpen] = useState(() => {
    if (!featureFlags.ageGate) return false;
    try {
      return !sessionStorage.getItem(ACK);
    } catch {
      return false;
    }
  });

  if (!open) return null;

  const ack = () => {
    try {
      sessionStorage.setItem(ACK, "1");
    } catch {
      /* */
    }
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/80 p-4">
      <div className="max-w-md rounded-2xl border border-gold-500/30 bg-zinc-900 p-6 text-center shadow-xl">
        <p className="text-3xl mb-2">⚜️</p>
        <h2 className="text-gold-400 font-bold text-lg mb-2">
          Bienvenue sur Zyeuté
        </h2>
        <p className="text-zinc-300 text-sm mb-4">
          Ce service s’adresse aux utilisateurs au Québec et au Canada. En
          continuant, tu confirmes respecter nos règles et, si tu es mineur,
          utiliser l’app avec l’accord d’un parent.
        </p>
        <button
          type="button"
          onClick={ack}
          className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold"
        >
          J’ai compris — continuer
        </button>
      </div>
    </div>
  );
}
