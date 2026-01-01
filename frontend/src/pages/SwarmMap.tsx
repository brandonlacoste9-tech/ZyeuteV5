import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { usePresence } from "@/hooks/usePresence";
import { MapleSpinner } from "@/components/ui/MapleSpinner";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

const mapLogger = logger.withContext("SwarmMap");

interface SwarmPoint {
  id: string;
  lat: number;
  lng: number;
  location?: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  city: string;
  region: string;
  fireCount: number;
  title: string;
  thumbnail: string;
}

/**
 * Swarm Map Page - Premium Colony OS Visualization
 * Stylized Quebec map with glowing social heat signatures
 */
export const SwarmMap: React.FC = () => {
  const [points, setPoints] = React.useState<SwarmPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedPoint, setSelectedPoint] = React.useState<SwarmPoint | null>(
    null,
  );

  // Bounds for Quebec region projection
  const BOUNDS = {
    minLng: -80,
    maxLng: -57,
    minLat: 45,
    maxLat: 62,
  };

  const projectPoint = (lng: number, lat: number) => {
    const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
    const y =
      (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  React.useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await fetch("/api/presence/map");
        const data = await response.json();
        setPoints(data.points || []);
      } catch (error) {
        mapLogger.error("Failed to fetch map data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapData();
  }, []);

  return (
    <div className="min-h-screen bg-black leather-overlay text-white overflow-hidden flex flex-col">
      <Header title="Vision Ruche" showBack showSearch={false} />

      <main className="flex-grow relative flex flex-col p-4">
        {/* Map Container */}
        <div className="flex-grow leather-card stitched rounded-3xl relative overflow-hidden bg-black/40 border border-gold-500/20 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
          {/* Stylized Grid Lines */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #FFBF00 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Radar Scanner Animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/5 to-transparent pointer-events-none"
            animate={{ left: ["-100%", "200%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <MapleSpinner size="lg" />
            </div>
          ) : (
            <div className="absolute inset-x-8 inset-y-12">
              {/* Background Quebec Shape (Simplified Path) */}
              <svg
                viewBox="0 0 500 600"
                className="absolute inset-0 w-full h-full opacity-20 text-gold-500 fill-current"
              >
                <path d="M150,550 L120,500 L80,480 L50,420 L80,350 L120,280 L180,220 L250,150 L320,80 L400,50 L450,120 L420,200 L450,300 L400,400 L350,450 L300,520 Z" />
              </svg>

              {/* Data Points */}
              {points.map((point) => {
                const pos = projectPoint(point.lng, point.lat);
                const size = 8 + Math.min(point.fireCount / 20, 16);

                return (
                  <motion.div
                    key={point.id}
                    className="absolute cursor-pointer z-20"
                    style={{ left: pos.x, top: pos.y }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.5, zIndex: 50 }}
                    onClick={() => setSelectedPoint(point)}
                  >
                    {/* Pulsing Aura */}
                    <motion.div
                      className="absolute -inset-4 bg-gold-500/30 rounded-full"
                      animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* The "Bee" Point */}
                    <div
                      className="w-3 h-3 bg-gold-gradient rounded-full shadow-[0_0_10px_#FFBF00] border border-white/20"
                      style={{ width: size, height: size }}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* HUD Overlay */}
          <div className="absolute top-4 left-4 p-3 bg-black/60 rounded-xl border border-gold-500/30 backdrop-blur-md">
            <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest mb-1">
              Status de la Ruche
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-stone-300 font-mono">
                EN DIRECT - {points.length} ACTIVITÉS
              </span>
            </div>
          </div>

          {/* Point Detail Card */}
          <AnimatePresence>
            {selectedPoint && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-6 inset-x-6 z-50 p-4 leather-card stitched rounded-2xl bg-black/90 border-t border-gold-500/50 shadow-2xl"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-gold-500/30">
                    <img
                      src={selectedPoint.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white line-clamp-1">
                        {selectedPoint.title || "Observation dans la Ruche"}
                      </h4>
                      <button
                        onClick={() => setSelectedPoint(null)}
                        className="text-stone-500 text-xl"
                      >
                        &times;
                      </button>
                    </div>
                    <p className="text-xs text-gold-500/80 mb-2">
                      📍{" "}
                      {selectedPoint.city ||
                        selectedPoint.region ||
                        "Territoire Québec"}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">🔥</span>
                        <span className="text-xs font-bold">
                          {selectedPoint.fireCount}
                        </span>
                      </div>
                      <button className="text-[10px] px-3 py-1 bg-gold-gradient text-black font-bold rounded-full uppercase">
                        Accéder
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend / Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 leather-card rounded-xl border border-gold-500/10 flex flex-col items-center">
            <span className="text-[10px] uppercase text-stone-500 tracking-tighter">
              Engagement Total
            </span>
            <span className="text-xl font-bold text-white tracking-widest">
              {points.reduce((acc, p) => acc + p.fireCount, 0).toLocaleString()}{" "}
              🔥
            </span>
          </div>
          <div className="p-3 leather-card rounded-xl border border-gold-500/10 flex flex-col items-center">
            <span className="text-[10px] uppercase text-stone-500 tracking-tighter">
              Territoire Actif
            </span>
            <span className="text-xl font-bold text-white tracking-widest">
              QC-514/418
            </span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SwarmMap;
