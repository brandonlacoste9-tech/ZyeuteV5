import React from "react";
import { CheckCircle, ShieldCheck, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustCertificateProps {
  className?: string;
  score?: number;
  type?: "vibe" | "security" | "authenticity";
  username?: string;
}

export const TrustCertificate: React.FC<TrustCertificateProps> = ({
  className,
  score = 98,
  type = "authenticity",
  username,
}) => {
  return (
    <div
      className={cn(
        "glass-frosted rounded-lg p-3 forensic-border relative overflow-hidden",
        "flex items-center gap-3 shadow-etched group",
        className,
      )}
    >
      {/* High-Contrast Stitching handled by .forensic-border::before in index.css */}

      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center border border-gold-500/30 group-hover:scale-110 transition-transform duration-300">
          {type === "authenticity" && (
            <Award className="w-6 h-6 text-gold-400" />
          )}
          {type === "vibe" && <CheckCircle className="w-6 h-6 text-gold-400" />}
          {type === "security" && (
            <ShieldCheck className="w-6 h-6 text-gold-400" />
          )}
        </div>
        <div className="absolute -top-1 -right-1 bg-gold-500 text-[8px] font-black px-1 rounded-sm text-black uppercase animate-pulse">
          LOCKED
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-gold-400 font-bold text-[10px] tracking-widest uppercase">
            {type === "authenticity" ? "Zyeute Authentique" : "Vibe Verified"}
          </span>
          <span className="h-0.5 w-4 bg-gold-500/30"></span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-white font-black text-lg italic tracking-tighter">
            {score}%
          </span>
          <span className="text-stone-400 text-[9px] uppercase font-medium">
            Matching {username || "Source"}
          </span>
        </div>
      </div>

      {/* Forensic Seal */}
      <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:opacity-20 group-hover:rotate-12 transition-all duration-700">
        <Award className="w-16 h-16 text-gold-300" />
      </div>

      {/* Micro-gold accent line */}
      <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-gold-500 to-transparent w-full"></div>
    </div>
  );
};
