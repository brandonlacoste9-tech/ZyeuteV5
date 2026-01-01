/**
 * MainLayout Component - Phone-Screen Centering with Dynamic Border Lighting
 * Provides a centered mobile app aesthetic on desktop with customizable border glow
 */

import React, { ReactNode } from "react";
import { useBorderColor } from "@/contexts/BorderColorContext";
import { GuestBanner } from "@/components/GuestBanner";
import { BottomNav } from "@/components/BottomNav";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { borderColor } = useBorderColor();

  const goldEdgeGlow: React.CSSProperties = {
    boxShadow: `
      0 0 20px rgba(255, 191, 0, 0.5),
      0 0 40px rgba(255, 191, 0, 0.3),
      inset 0 0 30px rgba(255, 191, 0, 0.15)
    `,
    border: "2px solid rgba(255, 191, 0, 0.6)",
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
        <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide pb-16">
          {/* Global Hive Selector - Top Right Overlay */}
          <div className="absolute top-4 right-4 z-50">
            <HiveSelector />
          </div>
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
