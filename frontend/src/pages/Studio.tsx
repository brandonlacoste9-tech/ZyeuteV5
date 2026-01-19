/**
 * Ti-Guy Studio - AI Video Editor Page
 */

import React, { useState } from "react";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/Button";
import {
  processVideo,
  generateCaptions,
  smartTrim,
} from "../services/videoService";
import { surgicalUpload } from "../services/api";
import { toast } from "../components/Toast";

export default function Studio() {
  const [isUploading, setIsUploading] = useState(false);
  const [videoResult, setVideoResult] = useState<any>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileToUpload(file);
    setIsUploading(true);
    try {
      // Still show the preview immediately
      const previewUrl = URL.createObjectURL(file);
      setVideoResult({ url: previewUrl, highlights: [] });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSmartAction = async (action: "captions" | "trim") => {
    if (!videoResult) return;
    toast.info("Ti-Guy travaille... 🎬");

    if (action === "captions") {
      const captions = await generateCaptions(videoResult.url);
      toast.success(`Sous-titres générés: "${captions}"`);
    } else {
      await smartTrim(videoResult.url);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-2xl">
            🎬
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Ti-Guy Studio</h1>
            <p className="text-white/60">Montage vidéo intelligent</p>
          </div>
        </div>

        {!videoResult ? (
          <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-white/40 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="text-6xl mb-4">📤</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Téléverse ta vidéo
            </h3>
            <p className="text-white/50">MP4, MOV jusqu&apos;à 50MB</p>
            {isUploading && (
              <p className="text-purple-400 mt-4 animate-pulse">
                Analyse IA en cours...
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preview */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative group">
              <video src={videoResult.url} controls className="w-full h-full" />
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs">
                IA: {videoResult.highlights?.length || 0} moments forts détectés
              </div>
            </div>

            {/* AI Tools */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSmartAction("captions")}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors text-left"
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="font-bold">Sous-titres Auto</div>
                <div className="text-xs text-white/50">Générer en Joual</div>
              </button>

              <button
                onClick={() => handleSmartAction("trim")}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors text-left"
              >
                <div className="text-2xl mb-2">✂️</div>
                <div className="font-bold">Smart Trim</div>
                <div className="text-xs text-white/50">Couper les silences</div>
              </button>
            </div>

            <div className="space-y-4">
              <Button
                onClick={async () => {
                  if (!fileToUpload) return;
                  setIsUploading(true);

                  // Stage 1: Uploading
                  toast.info("1/3: Téléversement vers le nuage... ☁️");

                  try {
                    const result = await surgicalUpload(fileToUpload, "Partagé via Ti-Guy Studio 🍁");

                    if (result.success) {
                      // Stage 2: Optimizing (Simulated for UX feel)
                      toast.info("2/3: Optimisation pour le réseau... ⚡");
                      await new Promise(r => setTimeout(r, 800));

                      // Stage 3: Publishing
                      toast.info("3/3: Publication sur Zyeuté... ⚜️");
                      await new Promise(r => setTimeout(r, 600));

                      toast.success("Vidéo publiée avec succès! +50 Nectar 🍯");

                      setTimeout(() => {
                        window.location.href = "/";
                      }, 1000);
                    } else {
                      toast.error(`Erreur: ${result.error}`);
                      setIsUploading(false);
                    }
                  } catch (err) {
                    toast.error("Échec du téléversement. Réessaie.");
                    setIsUploading(false);
                  }
                }}
                className="w-full py-4 text-lg font-bold bg-gradient-to-r from-red-600 to-orange-600 shadow-lg shadow-orange-900/20"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Traitement...</span>
                  </div>
                ) : (
                  "🚀 Exporter & Publier"
                )}
              </Button>
              <p className="text-center text-xs text-white/40 italic">
                Souveraineté numérique pour le Québec ⚜️
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
