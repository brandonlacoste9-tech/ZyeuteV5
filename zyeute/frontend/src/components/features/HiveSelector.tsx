import React, { useState } from "react";
import { useHive, HiveId } from "@/contexts/HiveContext";
import { IoEarth, IoCheckmark } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

export const HiveSelector: React.FC = () => {
  const { currentHive, switchHive, availableHives } = useHive();
  const [isOpen, setIsOpen] = useState(false);

  // Close when clicking outside - could use a ref hook here but keeping it simple for now
  // In a real app we'd use a dedicated dropdown primitive

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition text-xs font-medium text-white/80"
      >
        <span>{currentHive.flag}</span>
        <span className="hidden sm:inline">{currentHive.name}</span>
        {/* <IoChevronDown className={`w-3 h-3 transition ${isOpen ? 'rotate-180' : ''}`} /> */}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-48 bg-[#1a1512] border border-[#d4af37]/30 rounded-lg shadow-xl overflow-hidden z-50"
            >
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 text-[10px] uppercase text-gold-400 font-bold tracking-wider opacity-70">
                  Select Region (Hive)
                </div>
                {availableHives.map((hive) => (
                  <button
                    key={hive.id}
                    onClick={() => {
                      switchHive(hive.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition ${
                      currentHive.id === hive.id
                        ? "bg-[#d4af37]/10 text-[#d4af37]"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{hive.flag}</span>
                      <span>{hive.name}</span>
                    </span>
                    {currentHive.id === hive.id && <IoCheckmark />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
