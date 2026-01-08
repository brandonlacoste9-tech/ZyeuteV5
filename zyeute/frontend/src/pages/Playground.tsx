
import React, { useState } from "react";
import ArcadeHub from "./ArcadeHub";
import PoutineLobby from "./PoutineLobby";
import PoutineStackGame from "@/components/features/PoutineStackGame";
import HiveTap from "./HiveTap";
import i18n from "@/i18n";

import { ErrorBoundary } from "@/components/ErrorBoundary";

const Playground = () => {
    const [activeComponent, setActiveComponent] = useState("arcade");

    const renderComponent = () => {
        return (
            <ErrorBoundary>
                {renderContent()}
            </ErrorBoundary>
        );
    };

    const renderContent = () => {
        switch (activeComponent) {
            case "arcade":
                return <ArcadeHub />;
            case "lobby":
                return (
                    <PoutineLobby
                        mockMode={true}
                        onJoin={() => setActiveComponent("game")}
                    />
                );
            case "game":
                return (
                    <div className="h-[600px] w-[350px] border border-white mx-auto relative overflow-hidden rounded-3xl mt-10">
                        {/* Wrapping in a phone-like container for realism */}
                        <PoutineStackGame mockMode={true} />
                    </div>
                );
            case "hivetap":
                return <HiveTap />;
            default:
                return <ArcadeHub />;
        }
    };

    return (
        <div className="min-h-screen bg-stone-900 text-white p-4">
            <header className="mb-8 border-b border-stone-700 pb-4">
                <h1 className="text-3xl font-bold mb-2 text-green-400 font-mono">
                    &lt;DevPlayground /&gt;
                </h1>
                <p className="text-stone-400">
                    Direct component access for inspection. Bypass auth/routing logic.
                </p>
            </header>

            <div className="flex gap-4">
                <aside className="w-64 flex flex-col gap-2">
                    {[
                        { id: "arcade", label: "Arcade Hub" },
                        { id: "lobby", label: "Poutine Lobby" },
                        { id: "game", label: "Poutine Stack (Sim)" },
                        { id: "hivetap", label: "Hive Tap Ritual" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveComponent(item.id)}
                            className={`text-left px-4 py-3 rounded font-mono transition-colors ${activeComponent === item.id
                                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                : "bg-stone-800 hover:bg-stone-700 text-stone-300"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </aside>

                <main className="flex-1 bg-black rounded-xl border border-stone-800 overflow-hidden min-h-[80vh] relative shadow-2xl">
                    {renderComponent()}
                </main>
            </div>

            <div className="fixed bottom-4 right-4 text-xs text-stone-600 font-mono flex flex-col items-end gap-2">
                <div className="flex gap-2">
                    <button onClick={() => i18n.changeLanguage('en')} className="hover:text-green-400">EN</button>
                    <span>|</span>
                    <button onClick={() => i18n.changeLanguage('fr')} className="hover:text-green-400">FR</button>
                </div>
                Debug Build v0.4.2
            </div>
        </div>
    );
};

export default Playground;
