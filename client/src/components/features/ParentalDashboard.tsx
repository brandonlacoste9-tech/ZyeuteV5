import React, { useState, useEffect } from "react";
import axios from "axios";
import { Shield, Clock, MapPin, Save, AlertTriangle, Lock, Unlock, Activity, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ParentalStatus {
    fence: {
        status: 'SAFE' | 'OUT_OF_BOUNDS';
    };
    curfew: {
        active: boolean;
    };
}

interface ParentalSettings {
    homeLat: number;
    homeLng: number;
    allowedRadiusMeters: number;
    curfewStart: string;
    curfewEnd: string;
}

const ParentalDashboard: React.FC = () => {
    const [status, setStatus] = useState<ParentalStatus | null>(null);
    const [settings, setSettings] = useState<ParentalSettings>({
        homeLat: 45.5017,
        homeLng: -73.5673,
        allowedRadiusMeters: 1000,
        curfewStart: "20:00",
        curfewEnd: "07:00",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lockdown, setLockdown] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Using Promise.allSettled to handle partial failures gracefully if endpoints aren't fully ready
                const [statusRes, settingsRes] = await Promise.allSettled([
                    axios.get('/api/parental/status'),
                    axios.get('/api/parental/settings')
                ]);

                if (statusRes.status === 'fulfilled') {
                    setStatus(statusRes.value.data);
                } else {
                    // Fallback mock for demo if backend not ready
                    setStatus({ fence: { status: 'SAFE' }, curfew: { active: false } });
                }

                if (settingsRes.status === 'fulfilled') {
                    setSettings(settingsRes.value.data);
                }
            } catch (err) {
                console.error("Failed to load parental data", err);
                setError("System Offline. Check Connection.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            await axios.post('/api/parental/settings', settings);
            // Simulate network delay for "processing" feel
            await new Promise(r => setTimeout(r, 800));
        } catch (err) {
            console.error("Failed to save settings", err);
            setError("Save Failed. Protocol Error.");
        } finally {
            setSaving(false);
        }
    };

    const toggleLockdown = () => {
        setLockdown(!lockdown);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 bg-slate-950 text-yellow-500 font-mono">
                <Activity className="w-8 h-8 animate-spin mr-2" />
                INITIALIZING COMMAND CENTER...
            </div>
        );
    }

    const isSafe = status?.fence.status === 'SAFE';
    const isCurfewActive = status?.curfew.active;

    return (
        <div className="w-full max-w-4xl mx-auto p-4 bg-slate-950 text-slate-200 font-mono min-h-screen">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 border-b border-yellow-500/30 pb-4 flex justify-between items-center"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                        HIVE DEFENSE SYSTEM
                    </h1>
                    <p className="text-xs text-yellow-500/60 mt-1 uppercase tracking-widest">
                        Parental Command Node v3.1
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-500">SYSTEM ONLINE</span>
                </div>
            </motion.div>

            {/* Main Status Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                {/* Geo-Fence Status */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`relative p-6 border-l-4 rounded-r-lg bg-slate-900/50 backdrop-blur-sm shadow-xl overflow-hidden
            ${isSafe ? 'border-green-500' : 'border-red-500'}
          `}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield className="w-24 h-24" />
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <Shield className={`w-6 h-6 ${isSafe ? 'text-green-400' : 'text-red-500 animate-pulse'}`} />
                        <h2 className="text-xl font-bold uppercase">Honey-Fence Status</h2>
                    </div>

                    <div className="text-4xl font-black tracking-tight mb-2">
                        {isSafe ? (
                            <span className="text-green-400">✅ SECURE</span>
                        ) : (
                            <span className="text-red-500 flex items-center gap-2">
                                <AlertTriangle className="animate-bounce" /> BREACHED
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-400 uppercase">
                        Target is {isSafe ? 'within' : 'outside'} authorized radius.
                    </p>
                </motion.div>

                {/* Curfew Status */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`relative p-6 border-l-4 rounded-r-lg bg-slate-900/50 backdrop-blur-sm shadow-xl overflow-hidden
            ${!isCurfewActive ? 'border-blue-500' : 'border-orange-500'}
          `}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Clock className="w-24 h-24" />
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <Clock className={`w-6 h-6 ${!isCurfewActive ? 'text-blue-400' : 'text-orange-500'}`} />
                        <h2 className="text-xl font-bold uppercase">Temporal Lock</h2>
                    </div>

                    <div className="text-4xl font-black tracking-tight mb-2">
                        {isCurfewActive ? (
                            <span className="text-orange-500">🌙 ACTIVE</span>
                        ) : (
                            <span className="text-blue-400">☀️ INACTIVE</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-400 uppercase">
                        Current time zone classification: {isCurfewActive ? 'RESTRICTED' : 'STANDARD'}
                    </p>
                </motion.div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Radius & Location */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        className="p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-lg relative"
                        whileHover={{ borderColor: "#EAB308" }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-yellow-500">
                                <Radio className="w-5 h-5" />
                                <h3 className="font-bold uppercase tracking-wider">Perimeter Control</h3>
                            </div>
                            <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                                METERS
                            </span>
                        </div>

                        <div className="mb-8">
                            <div className="flex justify-between text-sm mb-2 text-slate-400">
                                <span>Radius</span>
                                <span className="text-yellow-400 font-bold">{settings.allowedRadiusMeters}m</span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="5000"
                                step="100"
                                value={settings.allowedRadiusMeters}
                                onChange={(e) => setSettings({ ...settings, allowedRadiusMeters: parseInt(e.target.value) })}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                            <div className="flex justify-between text-xs text-slate-600 mt-1">
                                <span>100m</span>
                                <span>5000m</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-slate-500 mb-1">Anchor Latitude</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={settings.homeLat}
                                        onChange={(e) => setSettings({ ...settings, homeLat: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 pl-9 text-slate-200 focus:border-yellow-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-500 mb-1">Anchor Longitude</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={settings.homeLng}
                                        onChange={(e) => setSettings({ ...settings, homeLng: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 pl-9 text-slate-200 focus:border-yellow-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-lg"
                        whileHover={{ borderColor: "#EAB308" }}
                    >
                        <div className="flex items-center gap-2 text-yellow-500 mb-6">
                            <Clock className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-wider">Temporal Restrictions</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-slate-500 mb-1">Curfew Start</label>
                                <input
                                    type="time"
                                    value={settings.curfewStart}
                                    onChange={(e) => setSettings({ ...settings, curfewStart: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 focus:border-yellow-500 focus:outline-none transition-colors font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-500 mb-1">Curfew End</label>
                                <input
                                    type="time"
                                    value={settings.curfewEnd}
                                    onChange={(e) => setSettings({ ...settings, curfewEnd: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 focus:border-yellow-500 focus:outline-none transition-colors font-mono"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Controls */}
                <div className="space-y-6">
                    <motion.div
                        className="p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-lg h-full flex flex-col justify-between"
                    >
                        <div>
                            <h3 className="font-bold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Override Control
                            </h3>
                            <p className="text-xs text-slate-500 mb-6">
                                Immediately restrict all movement and enable maximum security protocols.
                            </p>

                            <button
                                onClick={toggleLockdown}
                                className={`w-full py-8 rounded-xl font-bold text-xl tracking-widest transition-all duration-300 flex flex-col items-center justify-center gap-2 mb-6 border-2
                  ${lockdown
                                        ? 'bg-red-950/50 border-red-500 text-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'
                                    }
                `}
                            >
                                {lockdown ? (
                                    <>
                                        <Lock className="w-8 h-8" />
                                        LOCKDOWN ACTIVE
                                    </>
                                ) : (
                                    <>
                                        <Unlock className="w-8 h-8" />
                                        ENABLE LOCKDOWN
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="pt-6 border-t border-slate-800">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-5 h-5" />
                                {saving ? "UPLOADING CONFIG..." : "SAVE CONFIGURATION"}
                            </button>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-xs font-mono text-center"
                            >
                                ERROR: {error}
                            </motion.div>
                        )}

                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ParentalDashboard;
