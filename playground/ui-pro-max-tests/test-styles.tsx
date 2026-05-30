/**
 * UI Pro Max Style Testing Playground
 * Testing different styles for TikTok features
 */

import React from "react";

// Test Component 1: Glassmorphism Modal (for Remix Modal)
export const GlassmorphismModalTest: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="bg-white/15 backdrop-blur-[15px] rounded-2xl border border-white/20 p-6 w-full max-w-md"
        style={{
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-4">
          Glassmorphism Test
        </h2>
        <p className="text-white/80 mb-6">
          Testing frosted glass effect with backdrop blur
        </p>
        <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all duration-200">
          Test Button
        </button>
      </div>
    </div>
  );
};

// Test Component 2: Dark Mode OLED (for Sound Picker)
export const DarkModeOLEDTest: React.FC = () => {
  return (
    <div className="bg-[#000000] min-h-screen p-6">
      <div className="bg-[#121212] rounded-xl p-6 border border-white/10">
        <h2 className="text-white text-xl font-bold mb-4">
          OLED Dark Mode Test
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#1A1A1A] p-4 rounded-lg border border-white/5 hover:border-[#39FF14]/50 transition-colors cursor-pointer"
            >
              <div className="text-[#39FF14] font-medium">Neon Accent</div>
              <div className="text-white/60 text-sm">OLED optimized</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Test Component 3: Micro-interactions (for Video Controls)
export const MicroInteractionsTest: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Micro-Interactions Test</h2>

      {/* 50-100ms hover */}
      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg transition-all duration-[100ms] hover:bg-blue-600 hover:scale-105 active:scale-95">
        100ms Transition
      </button>

      {/* Loading spinner */}
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />

      {/* Touch target (44x44px minimum) */}
      <button className="min-w-[44px] min-h-[44px] bg-green-500 text-white rounded-lg flex items-center justify-center">
        Touch Target
      </button>
    </div>
  );
};

// Test Component 4: Motion-Driven (for Feed)
export const MotionDrivenTest: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Motion-Driven Test</h2>

      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-200 p-4 rounded-lg transform transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg"
          >
            Scroll Animation Item {i}
          </div>
        ))}
      </div>
    </div>
  );
};
