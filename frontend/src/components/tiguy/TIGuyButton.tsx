/**
 * 🦫 TI-GUY Floating Action Button
 * Vintage leather-style button with beaver icon
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
      className="fixed bottom-28 right-4 md:bottom-6 md:right-6 z-40 group flex flex-col items-center"
      aria-label="Parler avec TI-GUY"
    >
      {/* Label above button */}
      <div
        className="mb-2 px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap animate-pulse"
        style={{
          background: "linear-gradient(145deg, #D4AF37 0%, #B8960B 100%)",
          color: "#1A0F0A",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        TI-GUY 🦫
      </div>

      {/* Outer ring with stitching - smaller on mobile */}
      <div
        className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center relative transition-all group-hover:scale-110"
        style={{
          background:
            "linear-gradient(145deg, #6B4423 0%, #4A3018 50%, #3D2314 100%)",
          boxShadow:
            "0 8px 30px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)",
          border: "2px solid #D4AF37",
        }}
      >
        {/* Stitching effect */}
        <div
          className="absolute inset-1.5 md:inset-2 rounded-full"
          style={{
            border: "2px dashed rgba(212,175,55,0.5)",
          }}
        />

        {/* Inner button */}
        <div
          className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, #8B4513 0%, #5D3A1A 50%, #3D2314 100%)",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {/* Shine effect */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-6 md:w-8 h-3 md:h-4 rounded-full opacity-30"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
            }}
          />

          {/* Beaver icon - smaller on mobile */}
          <span className="text-2xl md:text-3xl relative z-10 group-hover:scale-110 transition-transform">
            🦫
          </span>
        </div>

        {/* Fleur-de-lis decorations - hidden on mobile */}
        <div className="hidden md:block absolute -top-1 left-1/2 -translate-x-1/2 text-amber-500 text-xs">
          ⚜️
        </div>
        <div className="hidden md:block absolute -bottom-1 left-1/2 -translate-x-1/2 text-amber-500 text-xs">
          ⚜️
        </div>
      </div>

      {/* Label - hidden on mobile, show on desktop */}
      <div
        className="hidden md:block absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full whitespace-nowrap"
        style={{
          background: "linear-gradient(145deg, #D4AF37 0%, #B8960B 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <span className="text-amber-900 text-xs font-bold">TI-GUY</span>
      </div>

      {/* Unread badge - smaller on mobile */}
      {unreadCount && unreadCount > 0 && (
        <div
          className="absolute -top-6 -right-0.5 md:-top-1 md:-right-1 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-bold"
          style={{
            background: "linear-gradient(145deg, #DC2626 0%, #991B1B 100%)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            border: "2px solid #4A3018",
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}

      {/* Tooltip on hover */}
      <div
        className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
        style={{
          background: "linear-gradient(145deg, #4A3018 0%, #3D2314 100%)",
          border: "1px solid #D4AF37",
        }}
      >
        <p className="text-amber-200 text-sm">Parler avec TI-GUY 🦫</p>
      </div>
    </button>
  );
};

export default TIGuyButton;
