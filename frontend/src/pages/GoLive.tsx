/**
 * GoLive Page - Start a live stream
 * TODO: Implement live streaming functionality
 */

import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

const GoLive: React.FC = () => {
  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-4">🎥 Go Live</h1>
        <p className="text-white/60">Live streaming feature coming soon...</p>
      </div>
      <BottomNav />
    </div>
  );
};

export default GoLive;
