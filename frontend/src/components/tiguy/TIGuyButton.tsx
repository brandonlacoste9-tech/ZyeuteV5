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
    <button onClick={onClick} className="fixed bottom-6 right-6 z-40 group">
      {/* Outer ring with stitching */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center relative"
        style={{
          background:
            "linear-gradient(145deg, #6B4423 0%, #4A3018 50%, #3D2314 100%)",
          boxShadow:
            "0 8px 30px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)",
          border: "3px solid #D4AF37",
        }}
      >
        {/* Stitching effect */}
        <div
          className="absolute inset-2 rounded-full"
          style={{
            border: "2px dashed rgba(212,175,55,0.5)",
          }}
        />

        {/* Inner button */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, #8B4513 0%, #5D3A1A 50%, #3D2314 100%)",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {/* Shine effect */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-4 rounded-full opacity-30"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
            }}
          />

          {/* Beaver icon */}
          <span className="text-3xl relative z-10 group-hover:scale-110 transition-transform">
            🦫
          </span>
        </div>

        {/* Fleur-de-lis decorations */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-amber-500 text-xs">
          ⚜️
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-amber-500 text-xs">
          ⚜️
        </div>
      </div>

      {/* Label */}
      <div
        className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full whitespace-nowrap"
        style={{
          background: "linear-gradient(145deg, #D4AF37 0%, #B8960B 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <span className="text-amber-900 text-xs font-bold">TI-GUY</span>
      </div>

      {/* Unread badge */}
      {unreadCount && unreadCount > 0 && (
        <div
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
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
