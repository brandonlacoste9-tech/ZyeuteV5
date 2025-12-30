/**
 * WatchLive Page - Watch a live stream
 * TODO: Implement live stream viewer
 */

import React from "react";
import { useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";

const WatchLive: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-4">🔴 Live Stream</h1>
        <p className="text-white/60">Watching stream: {id}</p>
        <p className="text-white/60 mt-2">
          Live streaming viewer coming soon...
        </p>
      </div>
      <BottomNav />
    </div>
  );
};

export default WatchLive;
