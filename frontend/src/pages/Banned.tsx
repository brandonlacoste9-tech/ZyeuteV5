import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";

const BannedPage: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="w-24 h-24 grayscale opacity-50" />
        </div>

        <div className="bg-stone-900/50 backdrop-blur-xl border-2 border-red-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚫</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Compte Désactivé
          </h1>

          <div className="space-y-4 text-stone-400 text-sm leading-relaxed mb-8">
            <p className="font-semibold text-red-400/90 text-base">
              Zyeuté applique une politique de{" "}
              <span className="uppercase tracking-widest">tolérance zéro</span>.
            </p>

            <p>
              Votre compte a été banni en raison d'une violation grave de nos
              protocoles de sécurité concernant toute forme de leurre, grooming
              ou interaction inappropriée impliquant des mineurs.
            </p>

            <div className="bg-black/30 rounded-xl p-4 border border-white/5 text-xs italic">
              "Les utilisateurs sont entièrement responsables du contenu qu’ils
              créent et partagent. Zyeuté se réserve le droit de retirer tout
              contenu ou de suspendre tout compte contrevenant à ces standards."
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-white/10 text-white hover:bg-white/5"
            onClick={logout}
          >
            Se déconnecter
          </Button>
        </div>

        <p className="mt-8 text-stone-600 text-[10px] uppercase tracking-[3px]">
          Sécurité Zyeuté • Québec
        </p>
      </div>
    </div>
  );
};

export default BannedPage;
