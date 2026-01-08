import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Wifi, MapPin, CheckCircle2, Loader2, ScanLine } from "lucide-react";

const HiveTap: React.FC = () => {
    const [scanning, setScanning] = useState(false);
    const [success, setSuccess] = useState(false);
    const [locationName, setLocationName] = useState("");

    const simulateScan = () => {
        setScanning(true);
        // Simulate network delay and location detection
        setTimeout(() => {
            setScanning(false);
            setSuccess(true);
            setLocationName("La Belle Province - Mont-Royal");

            // Reset after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">

            {/* Scanner Visualizer */}
            <div className="relative w-72 h-72 mb-12 flex items-center justify-center">
                {/* Border Frame */}
                <div className="absolute inset-0 border-2 border-slate-800 rounded-[50px]">
                    <div className="absolute top-0 left-12 right-12 h-2 bg-slate-950 -top-1" />
                    <div className="absolute bottom-0 left-12 right-12 h-2 bg-slate-950 -bottom-1" />
                </div>

                {/* Interior UI */}
                <div className="relative w-64 h-64 bg-slate-900/50 rounded-[40px] border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        {!scanning && !success && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400">
                                    <ScanLine className="w-10 h-10" />
                                </div>
                                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest px-8 text-center leading-relaxed">
                                    Hold device near <br /> Honey Pot beacon
                                </p>
                            </motion.div>
                        )}

                        {scanning && (
                            <motion.div
                                key="scanning"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-6"
                            >
                                <div className="relative">
                                    <Loader2 className="w-24 h-24 text-purple-500 animate-spin" />
                                    <motion.div
                                        animate={{ y: [-40, 40, -40] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                        className="absolute inset-x-0 top-1/2 h-0.5 bg-purple-400 shadow-[0_0_15px_#A855F7]"
                                    />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-purple-400 font-bold tracking-tighter italic">AUTHENTICATING...</span>
                                    <span className="text-[10px] text-slate-500 font-mono">D-SEC ENCRYPTION ACTIVE</span>
                                </div>
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-4 px-6 text-center"
                            >
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                                    <CheckCircle2 className="w-12 h-12 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg leading-tight mb-1">{locationName}</h3>
                                    <div className="flex items-center justify-center gap-1 text-green-500">
                                        <MapPin className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Check-in Verified</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Control Actions */}
            <div className="w-full max-w-sm space-y-4">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={simulateScan}
                    disabled={scanning || success}
                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 transition-opacity"
                >
                    <Wifi className="w-6 h-6 text-white" />
                    <span className="text-white font-black uppercase tracking-tighter text-lg italic">Tap to Claim Pollen</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-5 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center gap-3"
                >
                    <QrCode className="w-6 h-6 text-slate-400" />
                    <span className="text-slate-300 font-bold uppercase tracking-widest text-sm">Open QR Scanner</span>
                </motion.button>
            </div>

            <p className="mt-12 text-slate-600 font-mono text-[10px] uppercase tracking-[0.2em] max-w-xs text-center leading-relaxed">
                Honey Pots grant +50 Piasse Multiplier for Arcade tournaments.
                Limit 1 check-in per 24h.
            </p>

        </div>
    );
};

export default HiveTap;
