import React from 'react';
import { BeeType } from './types';
import { motion, AnimatePresence } from 'framer-motion';

interface SwarmVisualizerProps {
  status: 'idle' | 'thinking' | 'working' | 'completed';
  activeBee: BeeType | null;
  beeName?: string;
}

// Color mapping for the "Three Rings" aesthetic
const BEE_COLORS: Record<BeeType | 'default', string> = {
  default: '#F5C842', // Ti-Guy Gold
  finance: '#FFD700', // Gold
  security: '#FF4444', // Red Alert
  joual: '#4287f5',   // Quebec Blue
  poutine: '#8B4513', // Gravy Brown
  hockey: '#FFFFFF',  // Ice White
  region: '#228B22',  // Forest Green
};

export const SwarmVisualizer: React.FC<SwarmVisualizerProps> = ({ status, activeBee, beeName }) => {
  const activeColor = activeBee ? BEE_COLORS[activeBee] : BEE_COLORS.default;

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* The Core Agent (Ti-Guy) */}
      <div className="relative z-10 w-24 h-24 rounded-full bg-neutral-900 border-4 border-neutral-800 flex items-center justify-center overflow-hidden shadow-xl">
        <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-2xl">
           {/* Placeholder for Ti-Guy Avatar */}
           🤖
        </div>
        
        {/* Status Overlay */}
        <AnimatePresence>
          {status === 'thinking' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The Swarm Rings (Visualizing the "Brain") */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Ring 1: DeepSeek Processing */}
        {status === 'thinking' && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute w-28 h-28 rounded-full border-2 border-dashed"
            style={{ borderColor: activeColor }}
          />
        )}

        {/* Ring 2: Colony OS Connection (Active when delegated) */}
        {status === 'working' && activeBee && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute w-32 h-32 rounded-full border-t-2 border-b-2"
              style={{ borderColor: activeColor, opacity: 0.8 }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute w-40 h-40 rounded-full border-r-2 border-l-2"
              style={{ borderColor: activeColor, opacity: 0.4 }}
            />
          </>
        )}
      </div>

      {/* Bee Label */}
      <AnimatePresence>
        {activeBee && status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -bottom-8 bg-neutral-800 text-xs text-white px-3 py-1 rounded-full border border-neutral-700 shadow-lg flex items-center gap-2 z-20"
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeColor }} />
            {beeName || activeBee.toUpperCase()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
