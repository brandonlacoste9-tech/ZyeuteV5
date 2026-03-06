/**
 * 🦫 TI-GUY Floating Action Button
 * Matches BottomNav dark theme with gold accents
 */

import React from "react";

interface TIGuyButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

export const TIGuyButton: React.FC<TIGuyButtonProps> = ({
  onClick,
  unreadCount,
}) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-28 right-3 md:bottom-6 md:right-3 z-40 group flex flex-col items-center"
      aria-label="Parler avec TI-GUY"
    >
      {/* Label above button - matching bottom nav gold */}
      <div
        className="mb-2 px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap animate-pulse"
        style={{
          background: "linear-gradient(145deg, #FFD700 0%, #DAA520 100%)",
          color: "#0f0c0e",
          boxShadow: "0 2px 8px rgba(255,191,0,0.4)",
        }}
      >
        TI-GUY 🦫
      </div>

      {/* Main button - matching bottom nav dark theme */}
      <div
        className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center relative transition-all group-hover:scale-110"
        style={{
          background: "linear-gradient(145deg, #1a1418 0%, #0f0c0e 100%)",
          boxShadow:
            "0 8px 30px rgba(0,0,0,0.5), 0 0 20px rgba(255,191,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
          border: "2px solid rgba(255,191,0,0.4)",
        }}
      >
        {/* Gold dashed ring - matching bottom nav dashed line */}
        <div
          className="absolute inset-1.5 md:inset-2 rounded-full"
          style={{
            border: "1px dashed rgba(255,191,0,0.4)",
          }}
        />

        {/* Inner button with gold gradient when active/hover */}
        <div
          className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,191,0,0.4)]"
          style={{
            background:
              "linear-gradient(145deg, #252320 0%, #1a1418 50%, #0f0c0e 100%)",
            boxShadow:
              "inset 0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,191,0,0.2)",
          }}
        >
          {/* Gold glow at top */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-6 md:w-8 h-3 md:h-4 rounded-full opacity-40"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,191,0,0.3) 0%, transparent 100%)",
            }}
          />

          {/* Beaver icon with gold drop shadow */}
          <span
            className="text-2xl md:text-3xl relative z-10 group-hover:scale-110 transition-transform"
            style={{
              filter: "drop-shadow(0 0 8px rgba(255,191,0,0.5))",
            }}
          >
            🦫
          </span>
        </div>

        {/* Gold fleur-de-lis decorations */}
        <div
          className="hidden md:block absolute -top-1 left-1/2 -translate-x-1/2 text-xs"
          style={{ color: "rgba(255,191,0,0.8)" }}
        >
          ⚜️
        </div>
        <div
          className="hidden md:block absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs"
          style={{ color: "rgba(255,191,0,0.8)" }}
        >
          ⚜️
        </div>
      </div>

      {/* Unread badge - red with gold border */}
      {unreadCount && unreadCount > 0 && (
        <div
          className="absolute -top-6 -right-0.5 md:-top-1 md:-right-1 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-bold"
          style={{
            background: "linear-gradient(145deg, #DC2626 0%, #991B1B 100%)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3), 0 0 0 2px #0f0c0e",
            border: "1px solid rgba(255,191,0,0.3)",
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}

      {/* Tooltip */}
      <div
        className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
        style={{
          background: "linear-gradient(145deg, #1a1418 0%, #0f0c0e 100%)",
          border: "1px solid rgba(255,191,0,0.4)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        <p style={{ color: "rgba(255,191,0,0.9)" }}>Parler avec TI-GUY 🦫</p>
      </div>
    </button>
  );
};

export default TIGuyButton;
