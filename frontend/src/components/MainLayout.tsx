/**
 * MainLayout Component - Phone-Screen Centering with Dynamic Border Lighting
 * Provides a centered mobile app aesthetic on desktop with customizable border glow
 */

import React, { ReactNode } from "react";
import { useBorderColor } from "@/contexts/BorderColorContext";
import { GuestBanner } from "@/components/GuestBanner";
import { BottomNav } from "@/components/BottomNav";

import { useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { borderColor } = useBorderColor();
  const location = useLocation();

  // Disable layout scrolling for the feed page so react-window can handle it
  const isFeedPage = location.pathname === "/feed";

  const goldEdgeGlow: React.CSSProperties = {
    // Use the customizable borderColor from settings for the edge lighting
    // We use 8‑digit hex for alpha (e.g. #FFBF0080)
    boxShadow: `
      0 0 20px ${borderColor}80,
      0 0 40px ${borderColor}40,
      inset 0 0 30px ${borderColor}26
    `,
    border: `2px solid ${borderColor}99`,
    transition: "box-shadow 0.5s ease-in-out, border-color 0.5s ease-in-out",
  };

  return (
    <div className="h-screen w-full flex justify-center items-center leather-dark p-4 overflow-hidden">
      <div
        className="w-full max-w-md h-full flex flex-col text-white overflow-hidden rounded-3xl relative shadow-2xl"
        style={{
          ...goldEdgeGlow,
        }}
      >
        {/* Brown leather background inside the app */}
        <div
          className="absolute inset-0 rounded-3xl leather-brown"
          style={{
            opacity: 0.95,
          }}
        />
        {/* Gold ambient glow at top */}
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255, 215, 0, 0.1) 0%, transparent 40%)",
          }}
        />

        {/* Scrollable Content Area */}
        {/* For Feed page, we want NO layout scroll, so react-window handles it entirely */}
        <div
          className={`relative z-10 flex-1 ${isFeedPage ? "overflow-hidden" : "overflow-y-auto scrollbar-hide"} pb-16`}
        >
          {children}
        </div>

        {/* Guest Banner - Fixed Position within frame */}
        <GuestBanner />

        {/* Global Bottom Navigation - Fixed at bottom of frame */}
        <BottomNav />
      </div>
    </div>
  );
};
