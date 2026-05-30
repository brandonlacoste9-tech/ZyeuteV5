import React, { useState } from "react";
import { REGIONAL_SKINS, SkinConfig } from "../../data/skins";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Placeholder icons (simplified for now, ideally would be SVG components or actual image assets)
const SkinIcon = ({
  skin,
  isActive,
}: {
  skin: SkinConfig;
  isActive: boolean;
}) => (
  <div
    className={cn(
      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer relative group",
      isActive ? "scale-110" : "opacity-50 hover:opacity-80",
    )}
    style={{
      borderColor: isActive ? skin.colors.primary : "rgba(255,255,255,0.2)",
      background: isActive
        ? `radial-gradient(circle, ${skin.colors.glow} 0%, transparent 70%)`
        : "transparent",
      boxShadow: isActive ? `0 0 20px ${skin.colors.glow}` : "none",
    }}
  >
    {/* Inner detail placeholder */}
    <div
      className="w-6 h-6 border-t-2 border-b-2"
      style={{ borderColor: skin.colors.primary, transform: "rotate(45deg)" }}
    />
  </div>
);

export const SkinSelector: React.FC = () => {
  const [activeSkin, setActiveSkin] = useState<SkinConfig>(REGIONAL_SKINS[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      {/* Main Display Card */}
      <div
        className="relative rounded-3xl p-8 md:p-16 text-center border overflow-hidden transition-all duration-700"
        style={{
          borderColor: activeSkin.colors.primary,
          boxShadow: `0 0 40px ${activeSkin.colors.glow}, inset 0 0 100px rgba(0,0,0,0.8)`,
          background:
            "radial-gradient(ellipse at center, rgba(20,20,20, 1) 0%, rgba(5,5,5,1) 100%)",
        }}
      >
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 transition-colors duration-700"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${activeSkin.colors.primary} 0%, transparent 60%)`,
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
          {/* Logo / Icon Main */}
          <div className="transform transition-transform duration-700 hover:scale-105">
            {activeSkin.image ? (
              <div
                className="relative z-10 rounded-full overflow-hidden border-4 shadow-2xl animate-in fade-in duration-1000"
                style={{
                  borderColor: activeSkin.colors.primary,
                  width: "18rem",
                  height: "18rem",
                  boxShadow: `0 0 50px ${activeSkin.colors.glow}`,
                }}
              >
                <img
                  src={activeSkin.image}
                  alt={activeSkin.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent pointer-events-none" />
              </div>
            ) : (
              <div
                className="w-32 h-32 md:w-48 md:h-48 mx-auto relative flex items-center justify-center"
                style={{
                  filter: `drop-shadow(0 0 30px ${activeSkin.colors.glow})`,
                }}
              >
                {/* Abstract Shape */}
                <div
                  className="absolute inset-0 border-4 border-current rounded-full opacity-30 animate-pulse"
                  style={{ color: activeSkin.colors.primary }}
                />
                <div
                  className="w-2/3 h-2/3 border-2 border-current rotate-45"
                  style={{ color: activeSkin.colors.primary }}
                />
                <div
                  className="w-1/2 h-full w-px bg-current absolute"
                  style={{ backgroundColor: activeSkin.colors.primary }}
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1
              className="text-4xl md:text-6xl font-black tracking-wider uppercase"
              style={{
                color: activeSkin.colors.primary,
                textShadow: `0 0 20px ${activeSkin.colors.glow}`,
              }}
            >
              {activeSkin.name}
            </h1>
            <p className="text-xl md:text-2xl font-light text-white/90 tracking-widest uppercase">
              {activeSkin.tagline}
            </p>
          </div>

          {/* Description */}
          <div className="max-w-3xl mx-auto">
            <p
              className="text-lg md:text-xl italic leading-relaxed text-center opacity-90"
              style={{ color: "#E0E0E0" }} // Keep text readable but silver/white
            >
              {activeSkin.description}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-8 px-12 py-4 rounded-full border-2 font-bold text-lg tracking-widest uppercase transition-all duration-300 hover:scale-105 hover:bg-white/10"
            style={{
              borderColor: activeSkin.colors.primary,
              color: activeSkin.colors.text,
              boxShadow: `0 0 15px ${activeSkin.colors.glow}, inset 0 0 5px ${activeSkin.colors.glow}`,
            }}
          >
            Join The Quiet Pulse
          </button>
        </div>
      </div>

      {/* Selector Carousel */}
      <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-8">
        {REGIONAL_SKINS.map((skin) => (
          <div
            key={skin.id}
            onClick={() => setActiveSkin(skin)}
            className="transition-transform duration-300 hover:-translate-y-2"
          >
            <SkinIcon skin={skin} isActive={activeSkin.id === skin.id} />
          </div>
        ))}
      </div>

      {/* Modal - The Quiet Pulse */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-black/95 border border-white/10 text-white sm:max-w-md backdrop-blur-xl">
          <DialogHeader className="space-y-4">
            {/* Modal Logo */}
            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4">
              <div
                className="w-12 h-12 border-2 rotate-45"
                style={{
                  borderColor: activeSkin.colors.primary,
                  boxShadow: `0 0 15px ${activeSkin.colors.glow}`,
                }}
              />
            </div>
            <DialogTitle
              className="text-center text-3xl font-black uppercase tracking-widest"
              style={{
                color: "#E0E0E0",
                textShadow: "0 0 10px rgba(255,255,255,0.3)",
              }}
            >
              Join The Quiet Pulse
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400 text-base">
              Register your node to be notified of the regional awakening for{" "}
              <span style={{ color: activeSkin.colors.primary }}>
                {activeSkin.name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your.node@lineage.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/50 border-white/20 text-white placeholder-white/30 h-12 text-center rounded-lg focus-visible:ring-1 focus-visible:ring-white/50"
              />
            </div>

            <Button
              className="w-full h-12 bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/40 text-white font-serif tracking-[0.2em] transition-all duration-500"
              onClick={() => {
                // Logic to capture email would go here
                console.log("Registered for", activeSkin.id, email);
                setIsModalOpen(false);
              }}
            >
              REGISTER INHERITANCE
            </Button>

            {/* Secondary Link */}
            <div className="text-center">
              <button className="text-xs uppercase tracking-[0.1em] text-white/30 hover:text-white/60 transition-colors">
                Join The Quiet Pulse
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
