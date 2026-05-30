import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Zap,
  ShieldCheck,
  MapPin,
  Fingerprint,
  Trophy,
  Gamepad2,
  Timer,
  Coins,
  ChevronLeft,
  Play,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHaptics } from "@/hooks/useHaptics";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const HiveTap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tap, impact } = useHaptics();
  const [view, setView] = useState("menu"); // 'menu', 'giving', 'receiving', 'success'
  const [tapStatus, setTapStatus] = useState("idle");
  const [amount, setAmount] = useState(25);
  const [isHapticActive, setIsHapticActive] = useState(false);

  // Simulated Haptic Feedback Trigger
  const triggerBuzz = (intensity = 300) => {
    setIsHapticActive(true);
    impact();
    setTimeout(() => setIsHapticActive(false), intensity);
  };

  const simulateTap = () => {
    setTapStatus("tapping");
    triggerBuzz(300);
    setTimeout(() => {
      setTapStatus("verifying");
      setTimeout(() => {
        setTapStatus("done");
        setView("success");
        triggerBuzz(500);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono overflow-hidden p-4 sm:p-6 pb-24">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600 rounded-full blur-[120px]" />
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative"
      >
        {/* Header */}
        <div className="p-8 flex justify-between items-center">
          <button
            onClick={() =>
              view === "menu" ? navigate("/arcade") : setView("menu")
            }
            className="flex items-center gap-2 group"
          >
            <ChevronLeft
              size={20}
              className="text-yellow-500 group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              {view === "menu" ? "Arcade" : "Back"}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-black tracking-tighter text-xl text-yellow-500 italic">
              HIVE TAP
            </span>
          </div>
        </div>

        {/* Dynamic Views */}
        <div className="flex-1 flex flex-col px-8 pb-8">
          <AnimatePresence mode="wait">
            {view === "menu" && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col justify-center"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded">
                    ULTRA-FAST
                  </span>
                  <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase">
                    Montreal Region
                  </span>
                </div>
                <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                  P2P Honey
                </h1>
                <p className="text-zinc-400 mb-8 italic">
                  Move value at the speed of sound. Transfère tes Piasses en un
                  clin d'oeil.
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => {
                      tap();
                      setView("giving");
                    }}
                    className="group relative bg-yellow-500 hover:bg-yellow-400 transition-all text-black p-6 rounded-3xl flex items-center justify-between overflow-hidden shadow-lg shadow-yellow-500/20"
                  >
                    <div className="flex flex-col items-start z-10">
                      <span className="font-black text-lg italic tracking-tighter uppercase">
                        Donner (Honey)
                      </span>
                      <span className="text-sm font-bold opacity-70">
                        Envoie des Piasses via NFC
                      </span>
                    </div>
                    <Smartphone className="opacity-20 group-hover:scale-110 transition-transform absolute right-[-10px] bottom-[-10px] w-24 h-24" />
                  </button>

                  <button
                    onClick={() => {
                      tap();
                      setView("receiving");
                    }}
                    className="group relative bg-zinc-800 hover:bg-zinc-700 transition-all text-white p-6 rounded-3xl border border-white/10 flex items-center justify-between overflow-hidden"
                  >
                    <div className="flex flex-col items-start z-10">
                      <span className="font-black text-lg italic tracking-tighter uppercase">
                        Recevoir (Tap)
                      </span>
                      <span className="text-sm font-bold opacity-50">
                        Prêt pour le virement
                      </span>
                    </div>
                    <Zap className="opacity-10 group-hover:scale-110 transition-transform absolute right-[-10px] bottom-[-10px] w-24 h-24 text-yellow-500" />
                  </button>
                </div>
              </motion.div>
            )}

            {(view === "giving" || view === "receiving") && (
              <motion.div
                key="action"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <div className="mb-8">
                  <div
                    className={`relative w-40 h-40 flex items-center justify-center rounded-full transition-all duration-500 ${isHapticActive ? "scale-110 shadow-[0_0_50px_rgba(234,179,8,0.5)]" : "scale-100"}`}
                  >
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-500 opacity-20 animate-ping" />
                    <div className="absolute inset-4 rounded-full border-2 border-yellow-500 opacity-40 animate-pulse" />
                    {view === "giving" ? (
                      <Smartphone
                        size={64}
                        className="text-yellow-500 relative z-10"
                      />
                    ) : (
                      <Zap
                        size={64}
                        className="text-yellow-500 relative z-10"
                      />
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">
                  {view === "giving"
                    ? "Prêt à buzzer?"
                    : "Attente du signal..."}
                </h2>
                <p className="text-zinc-500 text-sm mb-6 max-w-[250px]">
                  {view === "giving"
                    ? "Touche le dos de ton téléphone sur l'appareil de ton ami."
                    : "Reste proche. Le transfert va apparaître ici."}
                </p>

                <div className="w-full space-y-4">
                  <div className="bg-zinc-800/50 p-6 rounded-3xl border border-white/10 shadow-inner">
                    <span className="text-xs text-zinc-500 block mb-1 uppercase tracking-widest font-bold">
                      Montant
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-black text-white italic">
                        {amount}
                      </span>
                      <span className="text-yellow-500 font-black text-xl italic uppercase">
                        Piasses
                      </span>
                    </div>
                  </div>

                  {view === "giving" && (
                    <Button
                      onClick={simulateTap}
                      className="w-full py-8 rounded-[24px] bg-white text-black font-black text-lg uppercase italic tracking-tighter hover:bg-zinc-200"
                    >
                      {tapStatus === "idle"
                        ? "ACTIVER NFC TAP"
                        : tapStatus.toUpperCase() + "..."}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {view === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                  <CheckCircle2 size={48} className="text-black" />
                </div>
                <h1 className="text-4xl font-black italic tracking-tighter mb-2 uppercase">
                  MISSION ACCOMPLIE!
                </h1>
                <p className="text-zinc-400 mb-8 max-w-xs mx-auto">
                  Le miel a été transféré vers la nouvelle ruche avec succès.
                </p>
                <div className="w-full p-6 bg-zinc-900 border border-white/10 rounded-3xl mb-8 flex justify-between items-center">
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                      Confirmé sur
                    </span>
                    <span className="text-xs font-bold text-yellow-500 font-mono">
                      SHADOW_LEDGER_V5
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                      Balance
                    </span>
                    <span className="text-xs font-bold text-white">
                      1,225 Piasses
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => setView("menu")}
                  className="w-full py-6 rounded-2xl bg-yellow-500 text-black font-black uppercase italic"
                >
                  RETOUR AU HUB
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Status Bar */}
        <div className="p-6 bg-black/40 border-t border-white/5 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              P2P Mesh Encrypted
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-zinc-500 uppercase font-bold">
                User
              </span>
              <span className="text-xs font-black text-yellow-500 uppercase italic">
                {user?.username || "Citoyen"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
              {user?.username?.substring(0, 2).toUpperCase() || "ZY"}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HiveTap;
