import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TiGuyInsightProps {
  summary: string;
  labels: string[];
  className?: string;
}

export const TiGuyInsight: React.FC<TiGuyInsightProps> = ({ summary, labels, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!summary) return null;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300",
          "bg-gradient-to-r from-gold-600/20 to-orange-600/20 border border-gold-500/30",
          "hover:from-gold-600/30 hover:to-orange-600/30 hover:border-gold-500/50 hover:scale-105",
          "shadow-[0_0_15px_rgba(255,191,0,0.1)] active:scale-95 group"
        )}
      >
        <span className="text-sm group-hover:animate-bounce">🦫</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400">Ti-Guy Insight</span>
      </button>

      {isOpen && (
        <div 
          className="absolute bottom-full left-0 mb-3 w-64 p-4 rounded-2xl bg-black/90 border border-gold-500/40 backdrop-blur-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute -bottom-2 left-6 w-4 h-4 bg-black border-r border-b border-gold-500/40 rotate-45" />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[2px] text-gold-500 font-bold">L'avis de Ti-Guy</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-stone-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-stone-200 leading-relaxed italic">
              "{summary}"
            </p>

            {labels && labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {labels.map((label, i) => (
                  <span 
                    key={i} 
                    className="text-[9px] bg-gold-500/10 text-gold-400 px-2 py-0.5 rounded-md border border-gold-500/20"
                  >
                    {label.startsWith('#') ? label : `#${label}`}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/10 flex justify-center">
             <p className="text-[8px] text-stone-600 uppercase tracking-widest">Analysé par Gemini 1.5 Flash</p>
          </div>
        </div>
      )}
    </div>
  );
};
