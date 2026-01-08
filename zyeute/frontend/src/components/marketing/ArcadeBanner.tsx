import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface GameAd {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    link: string;
    cta: string;
    color: string;
}

const ADS: GameAd[] = [
    {
        id: "poutine-royale",
        title: "Zyeuté Arcade",
        subtitle: "Joue à Poutine Royale & gagne des prix 🎮",
        image: "/images/ads/poutine_royale.png",
        link: "/arcade",
        cta: "JOUER",
        color: "from-purple-900/80 to-blue-900/80",
    },
    {
        id: "hive-tap",
        title: "Hive Tap",
        subtitle: "Check-in rapide & domination de quartier 📍",
        image: "/images/ads/hive_tap.png",
        link: "/hive-tap",
        cta: "SCAN",
        color: "from-amber-900/80 to-orange-900/80",
    },
];

export const ArcadeBanner: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Rotate ads every 8 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ADS.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const ad = ADS[currentIndex];

    return (
        <div className="mb-6 relative h-40 rounded-2xl overflow-hidden group border-2 border-gold-500/30 hover:border-gold-500 transition-colors shadow-lg shadow-black/50">
            <AnimatePresence mode="wait">
                <motion.div
                    key={ad.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    <Link to={ad.link} className="block w-full h-full relative">
                        {/* Background Image with Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${ad.color} z-10`} />
                        <img
                            src={ad.image}
                            alt={ad.title}
                            className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700 ease-out"
                        />

                        {/* Content */}
                        <div className="absolute inset-0 z-20 flex items-center justify-between px-6">
                            <div className="max-w-[70%]">
                                <motion.h3
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-2xl font-black text-white italic tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                >
                                    {ad.title}
                                </motion.h3>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-gold-400 font-bold text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-1"
                                >
                                    {ad.subtitle}
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.4, type: "spring" }}
                                className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center text-black font-black text-xs shadow-[0_0_15px_rgba(255,191,0,0.6)] group-hover:scale-110 transition-transform"
                            >
                                {ad.cta}
                            </motion.div>
                        </div>
                    </Link>
                </motion.div>
            </AnimatePresence>

            {/* Progress Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {ADS.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-6 bg-gold-500" : "w-1.5 bg-white/30"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};
