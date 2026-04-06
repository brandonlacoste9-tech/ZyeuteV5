/**
 * AI Studio - Flux Image Generation & Kling Video
 * Premium AI content creation for Zyeuté
 */

import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
import {
  aiStudioGenerateImage,
  aiStudioGenerateVideo,
} from "../services/api";
import { toast } from "../components/Toast";
import { supabase } from "../lib/supabase";

const aspectRatios = [
  { label: "TikTok (9:16)", value: "9:16" }, // TikTok vertical format - first priority
  { label: "Carré", value: "1:1" },
  { label: "Paysage", value: "16:9" },
  { label: "4:3", value: "4:3" },
];

export const AIStudio: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "image" | "video" | "transcribe"
  >("image");

  // Auth check on mount
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Tu dois être connecté pour utiliser l'IA Studio!");
        navigate("/login");
      } else {
        setIsLoggedIn(true);
      }
    });
  }, [navigate]);
  const [prompt, setPrompt] = React.useState("");
  const [aspectRatio, setAspectRatio] = React.useState("9:16"); // Default to TikTok vertical format
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = React.useState(false);
  const [videoModel, setVideoModel] = React.useState<
    "kling" | "wan" | "ltx2" | "pollo"
  >("wan");
  const [generatedImage, setGeneratedImage] = React.useState<string | null>(
    null,
  );
  const [generatedVideo, setGeneratedVideo] = React.useState<string | null>(
    null,
  );
  const [sourceImage, setSourceImage] = React.useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = React.useState<File | null>(null);
  const [transcribedText, setTranscribedText] = React.useState<string>("");
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  React.useEffect(() => {
    const imgUrl = searchParams.get("imageUrl");
    if (imgUrl) {
      setSourceImage(imgUrl);
      setActiveTab("video");
    }
  }, [searchParams]);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.warning("Entre une description d'abord!");
      return;
    }

    setIsGeneratingImage(true);
    setGeneratedImage(null);

    try {
      const result = await aiStudioGenerateImage(prompt, aspectRatio);
      if (result.ok) {
        setGeneratedImage(result.imageUrl);
        toast.success("Image générée! 🎨");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!sourceImage && !prompt.trim()) {
      toast.warning("L'IA nécessite une image ou une description!");
      return;
    }

    setIsGeneratingVideo(true);
    setGeneratedVideo(null);

    try {
      const result = await aiStudioGenerateVideo({
        prompt:
          prompt ||
          "Anime cette image avec un mouvement naturel pour TikTok",
        imageUrl: sourceImage,
        modelHint: videoModel,
        duration: 5,
      });

      if (result.ok) {
        setGeneratedVideo(result.videoUrl);
        const modelNames: Record<string, string> = {
          wan: "Wan 2.2",
          kling: "Kling V2",
          ltx2: "LTX-2",
          pollo: "Pollo AI",
        };
        toast.success(`Vidéo ${modelNames[videoModel]} générée! 🎬`);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDownload = async (url: string, type: "image" | "video") => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `zyeute-ai-${Date.now()}.${type === "video" ? "mp4" : "png"}`;
      document.body.appendChild(a);
      a.click();
      // Use a safe removeChild with existence check
      if (a.parentNode === document.body) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Téléchargé! 📥");
    } catch {
      toast.error("Échec du téléchargement");
    }
  };

  const handleUseForPost = (url: string) => {
    navigate(`/upload?mediaUrl=${encodeURIComponent(url)}`);
  };

  const handleTranscribeVideo = async () => {
    if (!uploadedVideo) {
      toast.warning("Sélectionne une vidéo d'abord!");
      return;
    }

    setIsTranscribing(true);
    setTranscribedText("");

    try {
      const formData = new FormData();
      formData.append("video", uploadedVideo);

      const response = await fetch("/api/ai/transcribe-video", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (data.transcript) {
        setTranscribedText(data.transcript);
        toast.success("Transcription terminée! 🎙️");
      } else {
        toast.error(data.error || "Échec de la transcription");
      }
    } catch (err) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col items-center justify-center p-4">
      <Header
        title="Zyeuté Studio Pro"
        showBack
        className="absolute top-0 left-0 right-0 z-50 bg-transparent border-none text-white"
      />

      {/* Main Canvas / Preview Area */}
      <div className="w-full max-w-5xl aspect-[16/10] sm:aspect-video rounded-3xl overflow-hidden bg-zinc-900/40 border border-white/5 relative shadow-[0_0_80px_rgba(0,0,0,0.8)] group">
        {!generatedImage &&
        !generatedVideo &&
        !sourceImage &&
        !isGeneratingImage &&
        !isGeneratingVideo ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-center p-8 bg-gradient-to-b from-zinc-900/20 to-black">
            <div className="w-24 h-24 rounded-full bg-gold-gradient/10 flex items-center justify-center animate-pulse border border-gold-500/20 shadow-[0_0_30px_rgba(255,191,0,0.1)]">
              <span className="text-5xl">☄️</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase italic underline-offset-8 decoration-gold-500/50">
              Studio Créatif
            </h2>
            <p className="text-zinc-500 max-w-sm text-sm font-medium">
              L'IA au service de l'influence québécoise. <br />
              Commence par une idée.
            </p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {isGeneratingImage || isGeneratingVideo ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="comet-loader">
                  <div className="comet-loader-track" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-gold-400 font-black uppercase tracking-[0.2em] text-xs">
                    Traitement Pro {videoModel.toUpperCase()}
                  </p>
                  <p className="text-zinc-600 text-[10px] animate-pulse">
                    L'algorithme façonne votre réalité...
                  </p>
                </div>
              </div>
            ) : generatedVideo ? (
              <video
                src={generatedVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={generatedImage || sourceImage || ""}
                alt="Studio Content"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        )}

        {/* Action Overlays for Generated Content */}
        {(generatedImage || generatedVideo) &&
          !isGeneratingImage &&
          !isGeneratingVideo && (
            <div className="absolute top-8 right-8 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
              <button
                onClick={() =>
                  handleDownload(
                    (generatedVideo || generatedImage)!,
                    generatedVideo ? "video" : "image",
                  )
                }
                className="p-4 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-gold-500 hover:text-black transition-all shadow-2xl"
                title="Sauvegarder"
              >
                📥
              </button>
              <button
                onClick={() =>
                  handleUseForPost((generatedVideo || generatedImage)!)
                }
                className="p-4 bg-gold-500 rounded-full text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,191,0,0.5)] border-2 border-white/20"
                title="Publier sur Zyeuté"
              >
                📤
              </button>
            </div>
          )}
      </div>

      {/* THE PILL BAR (Floating Control Bar) */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-50">
        <div className="bg-zinc-950/80 backdrop-blur-3xl rounded-[2.5rem] p-2.5 border border-white/10 flex items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] lg:gap-4 ring-1 ring-white/5">
          {/* Source Toggle / Media Preview Button */}
          <div className="flex items-center pl-2">
            <button
              onClick={() => {
                if (sourceImage) {
                  setSourceImage(null);
                } else if (generatedImage) {
                  setSourceImage(generatedImage);
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 relative group/source ${
                sourceImage
                  ? "border-gold-500 ring-2 ring-gold-500/20"
                  : "border-white/10 hover:border-white/30 bg-white/5"
              } overflow-hidden`}
            >
              {sourceImage ? (
                <>
                  <img
                    src={sourceImage}
                    className="w-full h-full object-cover"
                    alt="source"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/source:opacity-100 flex items-center justify-center text-[10px] text-white font-bold">
                    CLEAR
                  </div>
                </>
              ) : (
                <span className="text-xl opacity-40 group-hover:opacity-100 transition-opacity">
                  🖼️
                </span>
              )}
            </button>

            <div className="h-8 w-px bg-white/10 mx-3 opacity-50" />

            {/* Model Selection Tabs (Mini) */}
            <div className="hidden md:flex gap-1.5 bg-black/60 p-1 rounded-full border border-white/5">
              {(["wan", "ltx2", "kling", "pollo"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setVideoModel(m);
                    setActiveTab("video");
                  }}
                  className={`px-3 py-1.5 text-[9px] font-black rounded-full transition-all uppercase tracking-tighter ${
                    videoModel === m && activeTab === "video"
                      ? "bg-gold-500 text-black shadow-[0_0_15px_rgba(255,191,0,0.3)]"
                      : "text-zinc-600 hover:text-white"
                  }`}
                >
                  {m === "wan"
                    ? "WAN"
                    : m === "ltx2"
                      ? "LTX"
                      : m === "kling"
                        ? "KLN"
                        : "PLO"}
                </button>
              ))}
            </div>
          </div>

          {/* Magic Wand Icon */}
          <div className="flex-shrink-0 animate-pulse hidden sm:block">
            <span className="text-xl filter drop-shadow-[0_0_5px_rgba(255,191,0,0.5)]">
              ✨
            </span>
          </div>

          {/* Main Input Textarea Integration */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === "video"
                  ? "Décrire l'action et l'ambiance..."
                  : "Entrer un prompt créatif..."
              }
              className="w-full bg-transparent border-none text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-0 py-2.5 font-medium"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (activeTab === "video") {
                    handleGenerateVideo();
                  } else {
                    handleGenerateImage();
                  }
                }
              }}
            />
          </div>

          {/* Generation Trigger (Action Pill) */}
          <div className="flex items-center gap-3 pr-2 border-l border-white/10 pl-3">
            <button
              onClick={
                activeTab === "video"
                  ? handleGenerateVideo
                  : handleGenerateImage
              }
              disabled={
                isGeneratingImage || isGeneratingVideo || !prompt.trim()
              }
              className={`h-12 px-8 rounded-full font-black text-[11px] tracking-[0.1em] flex items-center gap-3 transition-all ${
                !prompt.trim()
                  ? "bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5"
                  : "bg-gold-gradient text-black hover:scale-[1.03] active:scale-95 shadow-[0_0_30px_rgba(255,191,0,0.4)] ring-2 ring-white/20"
              }`}
            >
              {isGeneratingImage || isGeneratingVideo ? (
                <div className="w-5 h-5 border-[3px] border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">GÉNÉRER</span>
                  <span className="text-lg">
                    {activeTab === "video" ? "🎬" : "📸"}
                  </span>
                </>
              )}
            </button>

            {/* Tokens / Unlimited (matching user image '+ 0') */}
            <div className="h-10 px-4 items-center gap-2 rounded-full bg-black/40 border border-white/10 flex text-[11px] font-black text-gold-500 shadow-inner">
              <span className="text-white/30 text-xs">✦</span>
              <span className="tracking-widest">PRO</span>
            </div>
          </div>
        </div>

        {/* Subtle toggle for Image/Video modes below the bar */}
        <div className="mt-8 flex justify-center gap-12 text-[10px] font-black tracking-[0.4em] text-zinc-500 uppercase transition-all">
          <button
            onClick={() => setActiveTab("image")}
            className={`transition-all hover:tracking-[0.6em] ${activeTab === "image" ? "text-gold-500 drop-shadow-[0_0_8px_rgba(255,191,0,0.4)]" : "hover:text-zinc-300"}`}
          >
            IMAGE
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`transition-all hover:tracking-[0.6em] ${activeTab === "video" ? "text-gold-500 drop-shadow-[0_0_8px_rgba(255,191,0,0.4)]" : "hover:text-zinc-300"}`}
          >
            VIDÉO
          </button>
          <button
            onClick={() => setActiveTab("transcribe")}
            className={`transition-all hover:tracking-[0.6em] ${activeTab === "transcribe" ? "text-gold-500 drop-shadow-[0_0_8px_rgba(255,191,0,0.4)]" : "hover:text-zinc-300"}`}
          >
            TRANSCRIBE
          </button>
        </div>
      </div>

      {/* Background Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/5 rounded-full blur-[160px] pointer-events-none -z-10" />
    </div>
  );
};

export default AIStudio;
