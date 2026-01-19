import React, { useState } from "react";
import { Link } from "react-router-dom";
import { List, FixedSizeList } from "react-window";

// Import design tokens or rely on Tailwind classes
// Using inline styles/classes to demo the Luxury Theme

export default function Sandbox() {
  const [activeTab, setActiveTab] = useState("components");

  return (
    <div className="min-h-screen leather-dark text-white p-8 pb-32 overflow-y-auto">
      {/* Header */}
      <header className="mb-12 border-b border-gold-500/30 pb-6 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 opacity-50" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent mb-2 mt-4 ml-4">
          Zyeuté Design Sandbox
        </h1>
        <p className="text-gold-100/60 ml-4 font-mono text-sm">
          Theme Verification: Premium Leather & Gold (Dark Luxury)
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 ml-4">
        {[
          { id: "components", label: "UI Components" },
          { id: "typography", label: "Typography" },
          { id: "colors", label: "Palette" },
          { id: "feed-test", label: "Virtual Feed Test" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-gold-500 to-gold-600 text-black shadow-[0_0_15px_rgba(255,191,0,0.4)]"
                : "bg-neutral-800 text-neutral-400 hover:text-gold-400 hover:bg-neutral-750"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="ml-4 space-y-12">
        {/* COMPONENTS TAB */}
        {activeTab === "components" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Cards Section */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-gold-200 border-l-4 border-gold-500 pl-3">
                Card Surfaces
              </h2>

              <div className="p-6 leather-card rounded-2xl border border-gold-500/10">
                <h3 className="text-lg font-bold text-white mb-2">
                  Standard Leather Card
                </h3>
                <p className="text-stone-400 text-sm">
                  Used for feed items and standard containers. Subtle organic
                  texture.
                </p>
              </div>

              <div className="p-6 leather-card-elevated rounded-2xl border border-gold-500/20 stitched">
                <h3 className="text-lg font-bold text-gold-100 mb-2">
                  Elevated & Stitched
                </h3>
                <p className="text-stone-300 text-sm">
                  Used for featured content or high-priority modals. Includes
                  gold stitching.
                </p>
              </div>

              <div className="p-6 glass-card rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-2">
                  Glass Overlay
                </h3>
                <p className="text-stone-300 text-sm">
                  Used for transparent UI elements over video.
                </p>
              </div>
            </section>

            {/* Buttons & Inputs */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-gold-200 border-l-4 border-gold-500 pl-3">
                Interactions
              </h2>

              <div className="space-y-4 p-6 bg-neutral-900/50 rounded-2xl border border-neutral-800">
                <div className="flex gap-4 items-center flex-wrap">
                  <button className="btn-gold px-6 py-2 rounded-full">
                    Primary Action
                  </button>
                  <button className="btn-leather px-6 py-2 rounded-full">
                    Secondary / Leather
                  </button>
                  <button className="text-gold-400 hover:text-gold-300 underline font-medium">
                    Text Link
                  </button>
                </div>

                <div className="space-y-3 mt-8">
                  <input
                    type="text"
                    placeholder="Premium Input Field"
                    className="input-premium"
                  />
                  <input
                    type="text"
                    placeholder="Focus State Check"
                    className="input-premium focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TYPOGRAPHY TAB */}
        {activeTab === "typography" && (
          <section className="space-y-8 max-w-3xl">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold text-white">
                Display Heading XL
              </h1>
              <p className="text-neutral-500 font-mono">text-5xl font-bold</p>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-gold-100">
                Heading Large
              </h2>
              <p className="text-neutral-500 font-mono">
                text-4xl text-gold-100
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-white">
                Section Title
              </h3>
              <p className="text-neutral-500 font-mono">
                text-2xl font-semibold
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-stone-300 leading-relaxed">
                Body text large. Calls to action and intros. The quick brown fox
                jumps over the lazy dog. Provides distinct readability against
                the dark leather background.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-base text-stone-400 leading-relaxed">
                Body text standard. Used for most content. Lorem ipsum dolor sit
                amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          </section>
        )}

        {/* COLORS TAB */}
        {activeTab === "colors" && (
          <section className="space-y-8">
            <div>
              <h3 className="text-xl text-white mb-4">Gold Scale (Brand)</h3>
              <div className="flex flex-wrap gap-4">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                  (step) => (
                    <div key={step} className="text-center">
                      <div
                        className={`w-16 h-16 rounded-lg mb-2 shadow-lg bg-gold-${step}`}
                      />
                      <span className="text-xs text-neutral-500">{step}</span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl text-white mb-4">
                Leather Scale (Neutrals)
              </h3>
              <div className="flex flex-wrap gap-4">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                  (step) => (
                    <div key={step} className="text-center">
                      <div
                        className={`w-16 h-16 rounded-lg mb-2 shadow-lg bg-leather-${step}`}
                      />
                      <span className="text-xs text-neutral-500">{step}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

        {/* VIRTUAL FEED TEST TAB */}
        {activeTab === "feed-test" && (
          <section className="h-[600px] w-full max-w-sm mx-auto border-4 border-gold-600 rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(255,191,0,0.2)]">
            <div className="absolute top-4 left-0 right-0 z-10 text-center pointer-events-none">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur">
                Virtual List Simulation
              </span>
            </div>

            {/* React Window Mock */}
            <List
              height={600}
              itemCount={100}
              itemSize={600}
              width="100%"
              className="no-scrollbar snap-y snap-mandatory scroll-smooth"
            >
              {({ index, style }) => (
                <div
                  style={style}
                  className="snap-center h-full w-full relative border-b border-white/10 bg-neutral-900 flex items-center justify-center"
                >
                  <div className="text-center">
                    <h3 className="text-4xl mb-2">video_{index}</h3>
                    <p className="text-gold-500">Virtual Row Rendered</p>
                  </div>
                  {/* Overlay Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                  {/* Mock Interactive Buttons */}
                  <div className="absolute right-4 bottom-20 flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/20 animate-pulse" />
                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/20" />
                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/20" />
                  </div>
                </div>
              )}
            </List>
          </section>
        )}
      </div>
    </div>
  );
}
