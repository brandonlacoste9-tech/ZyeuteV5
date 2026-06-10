import React, { useCallback, useEffect, useState } from "react";
import {
  Smartphone,
  Zap,
  ChevronLeft,
  CheckCircle2,
  Copy,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHaptics } from "@/hooks/useHaptics";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArcadeBackdrop } from "@/components/arcade/ArcadeBackdrop";
import {
  arcadeBtnPrimary,
  arcadeCardLime,
  arcadeTextCyan,
  arcadeTextLime,
  arcadeTextMuted,
  arcadeTextYellow,
} from "@/components/arcade/arcade-ui";
import {
  createHiveTapToken,
  getCurrentLocation,
  getHiveTapBalance,
  processHiveTapToken,
} from "@/services/hiveTapService";

const AMOUNTS = [10, 25, 50, 100] as const;

type View = "menu" | "giving" | "receiving" | "success";

const HiveTap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tap, impact } = useHaptics();
  const [view, setView] = useState<View>("menu");
  const [amount, setAmount] = useState<(typeof AMOUNTS)[number]>(25);
  const [balance, setBalance] = useState<number | null>(null);
  const [handshakeToken, setHandshakeToken] = useState<string | null>(null);
  const [pasteToken, setPasteToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successAmount, setSuccessAmount] = useState(0);
  const [copied, setCopied] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    const { data } = await getHiveTapBalance();
    if (data) setBalance(data.balance);
  }, [user]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const requireLogin = () => {
    if (!user) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleGenerateToken = async () => {
    if (!requireLogin()) return;
    setLoading(true);
    setError(null);
    setHandshakeToken(null);
    try {
      const location = await getCurrentLocation();
      const { data, error: apiError } = await createHiveTapToken(
        amount,
        location,
      );
      if (apiError || !data?.token) {
        setError(apiError || "Impossible de générer le token");
        return;
      }
      impact();
      setHandshakeToken(data.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur NFC / localisation");
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!requireLogin()) return;
    if (!pasteToken.trim()) {
      setError("Colle le token reçu de ton chum.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const location = await getCurrentLocation();
      const { data, error: apiError } = await processHiveTapToken(
        pasteToken.trim(),
        location,
      );
      if (apiError || !data?.success) {
        setError(apiError || "Transfert refusé");
        return;
      }
      impact();
      setSuccessAmount(data.amount ?? amount);
      setBalance(data.balance);
      setView("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors du transfert");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    if (!handshakeToken) return;
    await navigator.clipboard.writeText(handshakeToken);
    setCopied(true);
    tap();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ArcadeBackdrop className="flex flex-col items-center justify-center p-4 pb-24 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`z-10 w-full max-w-md ${arcadeCardLime} overflow-hidden min-h-[560px] flex flex-col`}
      >
        <div className="p-6 flex justify-between items-center border-b border-[rgba(57,255,20,0.25)]">
          <button
            type="button"
            onClick={() =>
              view === "menu" ? navigate("/arcade") : setView("menu")
            }
            className={`flex items-center gap-2 ${arcadeTextCyan} cursor-pointer hover:opacity-80 transition-opacity`}
          >
            <ChevronLeft size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">
              {view === "menu" ? "Arcade" : "Retour"}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <Zap size={18} className={arcadeTextLime} />
            <span
              className={`font-black uppercase tracking-wider text-xs ${arcadeTextLime}`}
            >
              Hive Tap
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col px-6 py-6">
          {balance != null && (
            <p className={`text-xs mb-4 text-center ${arcadeTextMuted}`}>
              Solde:{" "}
              <span className={`font-bold tabular-nums ${arcadeTextYellow}`}>
                {balance}
              </span>{" "}
              Piasses
            </p>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl border border-red-500/40 text-red-300 text-sm">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {view === "menu" && (
              <motion.div
                key="menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col justify-center gap-4"
              >
                <h1 className={`text-2xl font-black ${arcadeTextLime}`}>
                  P2P Honey
                </h1>
                <p className={`text-sm mb-4 ${arcadeTextMuted}`}>
                  Transfère des Piasses à proximité. Le receveur doit être à
                  moins de 15 m et coller ton token dans les 30 secondes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    setView("giving");
                    setError(null);
                  }}
                  className={`${arcadeBtnPrimary} p-5 text-left`}
                >
                  Donner (Honey)
                  <span className="block text-sm font-semibold opacity-70 mt-1">
                    Génère un token sécurisé
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    setView("receiving");
                    setError(null);
                    setPasteToken("");
                  }}
                  className="p-5 min-h-[72px] rounded-sm border-2 border-[rgba(0,243,255,0.35)] text-left hover:border-[rgba(0,243,255,0.6)] cursor-pointer transition-colors duration-200"
                >
                  Recevoir (Tap)
                  <span className={`block text-sm mt-1 ${arcadeTextMuted}`}>
                    Colle le token de ton chum
                  </span>
                </button>
              </motion.div>
            )}

            {(view === "giving" || view === "receiving") && (
              <motion.div
                key="action"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex justify-center mb-6">
                  {view === "giving" ? (
                    <Smartphone className={`w-16 h-16 ${arcadeTextLime}`} />
                  ) : (
                    <Zap className={`w-16 h-16 ${arcadeTextCyan}`} />
                  )}
                </div>

                <div className="mb-4">
                  <span
                    className={`text-xs uppercase tracking-widest ${arcadeTextMuted}`}
                  >
                    Montant
                  </span>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {AMOUNTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAmount(a)}
                        className={`py-2 min-h-[44px] rounded-sm font-bold text-sm cursor-pointer transition-colors duration-200 ${
                          amount === a
                            ? "bg-[#ffe600] text-black"
                            : "border border-[rgba(158,180,216,0.35)] text-[#e8eeff] hover:border-[rgba(0,243,255,0.5)]"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {view === "giving" && (
                  <div className="space-y-3 mt-auto">
                    <Button
                      onClick={handleGenerateToken}
                      disabled={loading}
                      className="w-full py-6 bg-[#ffe600] text-black font-black hover:bg-[#fff066]"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Générer le token"
                      )}
                    </Button>
                    {handshakeToken && (
                      <div className="p-3 rounded-sm bg-black/40 border border-[rgba(57,255,20,0.3)]">
                        <p
                          className={`text-[10px] uppercase mb-2 ${arcadeTextMuted}`}
                        >
                          Token (30s) — envoie à ton chum
                        </p>
                        <p className="text-[10px] font-mono break-all text-[#39ff14] mb-2 max-h-20 overflow-y-auto">
                          {handshakeToken}
                        </p>
                        <button
                          type="button"
                          onClick={copyToken}
                          className={`flex items-center gap-2 text-xs font-bold ${arcadeTextCyan}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copied ? "Copié!" : "Copier le token"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {view === "receiving" && (
                  <div className="space-y-3 mt-auto">
                    <textarea
                      value={pasteToken}
                      onChange={(e) => setPasteToken(e.target.value)}
                      placeholder="Colle le token ici..."
                      className="w-full h-24 p-3 rounded-sm bg-black/50 border border-[rgba(0,243,255,0.3)] text-xs font-mono resize-none text-[#e8eeff]"
                    />
                    <Button
                      onClick={handleReceive}
                      disabled={loading}
                      className="w-full py-6 bg-[#ffe600] text-black font-black hover:bg-[#fff066]"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Confirmer le tap"
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {view === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <CheckCircle2 className={`w-16 h-16 mb-4 ${arcadeTextLime}`} />
                <h2 className={`text-2xl font-black mb-2 ${arcadeTextLime}`}>
                  Transfert réussi!
                </h2>
                <p className={`text-sm mb-2 ${arcadeTextMuted}`}>
                  Les Piasses ont été créditées sur ton compte.
                </p>
                {successAmount > 0 && (
                  <p className={`font-bold mb-6 ${arcadeTextYellow}`}>
                    +{successAmount} Piasses reçues
                  </p>
                )}
                {balance != null && (
                  <p className={`font-bold mb-6 ${arcadeTextYellow}`}>
                    Nouveau solde: {balance} Piasses
                  </p>
                )}
                <Button
                  onClick={() => {
                    setView("menu");
                    void refreshBalance();
                  }}
                  className="w-full py-4 bg-[#ffe600] text-black font-black hover:bg-[#fff066]"
                >
                  Retour au hub
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </ArcadeBackdrop>
  );
};

export default HiveTap;
