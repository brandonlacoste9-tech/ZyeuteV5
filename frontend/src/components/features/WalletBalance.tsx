import React from "react";
import { Coins, TrendingUp, Zap } from "lucide-react";

interface WalletBalanceProps {
    balance: number;
    karma: number;
}

/**
 * WalletBalance - Display user's Piasse balance and Karma in a stitched leather style
 */
export const WalletBalance: React.FC<WalletBalanceProps> = ({
    balance,
    karma,
}) => {
    return (
        <div className="leather-card bg-stone-900 border-2 border-stone-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
            {/* Background accent */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gold-500/5 rounded-full blur-2xl group-hover:bg-gold-500/10 transition-colors" />

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-stone-800 p-2.5 rounded-xl border border-gold-500/30 shadow-gold-sm">
                        <Coins className="text-gold-500" size={24} />
                    </div>
                    <div>
                        <span className="text-gold-500/60 font-black tracking-widest text-[10px] uppercase block">
                            Solde de Piasses
                        </span>
                        <span className="text-white text-3xl font-black font-mono">
                            {balance.toFixed(2)}
                            <span className="text-gold-500 text-lg ml-1">$</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-stone-800 flex items-center gap-2 hover:border-gold-500/30 transition-colors">
                    <Zap size={16} className="text-orange-500" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-stone-500 uppercase font-black">
                            Karma
                        </span>
                        <span className="text-stone-200 text-xs font-bold font-mono">
                            {karma} <span className="text-[10px] text-stone-500 font-normal">pts</span>
                        </span>
                    </div>
                </div>
                <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-stone-800 flex items-center gap-2 hover:border-gold-500/30 transition-colors">
                    <TrendingUp size={16} className="text-green-500" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-stone-500 uppercase font-black">
                            Tendance
                        </span>
                        <span className="text-stone-200 text-xs font-bold font-mono">
                            +12% <span className="text-[10px] text-stone-500 font-normal">Activité</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Decorative stitching */}
            <div className="absolute top-0 left-4 right-4 h-px border-t border-dashed border-gold-500/10" />
            <div className="absolute bottom-4 left-0 right-0 h-px border-t border-dashed border-gold-500/10 rotate-90 origin-left" />
        </div>
    );
};

export default WalletBalance;
