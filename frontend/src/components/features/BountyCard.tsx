import React, { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";

export const BountyCard: React.FC = () => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [bountyEarned, setBountyEarned] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBountyInfo() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch(`${import.meta.env.VITE_APP_URL || ""}/api/bounty/generate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setReferralCode(data.referralCode);
          setBountyEarned(data.bountyEarned || 0);
        }
      } catch (err) {
        console.error("Failed to load bounty info:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBountyInfo();
  }, []);

  const handleCopyLink = () => {
    if (!referralCode) return;
    const link = `https://zyeute.com/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Lien d'invitation copié!");
  };

  if (isLoading) {
    return (
      <div className="bg-black/40 rounded-xl p-4 animate-pulse border border-white/10 h-32">
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden p-6 border-2 border-gold-500/30 bg-gradient-to-br from-black via-[#2a1b0a] to-[#1a0f05]">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gold-500/10 mix-blend-overlay pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gold-400 font-serif mb-1">
              Bounty Viral ⚜️
            </h3>
            <p className="text-sm text-leather-300">
              Invite un ami et recevez <span className="font-bold text-green-400">500 Cennes ($5)</span> chacun!
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-leather-400 font-bold tracking-wider mb-1">Gains Totaux</p>
            <p className="text-2xl font-bold text-green-400">{bountyEarned} 🪙</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-black/60 rounded-xl border border-white/10 p-3 font-mono text-center text-lg tracking-widest text-white/90">
            {referralCode || "------"}
          </div>
          <Button 
            variant="primary" 
            onClick={handleCopyLink}
            className="btn-gold whitespace-nowrap"
            disabled={!referralCode}
          >
            Copier le lien
          </Button>
        </div>
      </div>
    </div>
  );
};
