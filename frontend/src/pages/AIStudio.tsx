/**
 * AI Studio - Flux Image Generation & Kling Video
 * Premium AI content creation for Zyeuté
 */

import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
import { generateImage } from "../services/api";
import { toast } from "../components/Toast";
import { AIVideoResponseSchema } from "../schemas/ai";

const aspectRatios = [
  { label: "TikTok (9:16)", value: "9:16" }, // TikTok vertical format - first priority
  { label: "Carré", value: "1:1" },
  { label: "Paysage", value: "16:9" },
  { label: "4:3", value: "4:3" },
];

export const AIStudio: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<"image" | "video">("image");
  const [prompt, setPrompt] = React.useState("");
  const [aspectRatio, setAspectRatio] = React.useState("9:16"); // Default to TikTok vertical format
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = React.useState(false);
  const [videoModel, setVideoModel] = React.useState<"kling" | "wan">("wan");
  const [generatedImage, setGeneratedImage] = React.useState<string | null>(
    null,
  );
  const [generatedVideo, setGeneratedVideo] = React.useState<string | null>(
    null,
  );
  const [sourceImage, setSourceImage] = React.useState<string | null>(null);

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
      const result = await generateImage(prompt, aspectRatio);
      if (result) {
        setGeneratedImage(result.imageUrl);
        toast.success("Image générée! 🎨");
      } else {
        toast.error("Échec de la génération");
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
      const response = await fetch("/api/ai/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          imageUrl: sourceImage,
          prompt:
            prompt || "Anime cette image avec un mouvement naturel pour TikTok",
          modelHint: videoModel,
          duration: 5,
        }),
      });

      const data = await response.json();

      // Validate AI response
      const validatedData = AIVideoResponseSchema.safeParse(data);

      if (validatedData.success) {
        setGeneratedVideo(validatedData.data.videoUrl);
        toast.success(
          `Vidéo ${videoModel === "wan" ? "Wan" : "Kling"} générée! 🎬`,
        );
      } else {
        toast.error(data.error || "Échec de la génération vidéo");
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

  return (
    <div className="min-h-screen bg-black">
      <Header title="AI Studio" showBack />

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-zinc-900 p-1 border border-gold-500/20">
          <button
            onClick={() => setActiveTab("image")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === "image"
                ? "bg-gold-gradient text-black"
                : "text-gold-400 hover:bg-zinc-800"
            }`}
            data-testid="tab-image"
          >
            🎨 Image Flux
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === "video"
                ? "bg-gold-gradient text-black"
                : "text-gold-400 hover:bg-zinc-800"
            }`}
            data-testid="tab-video"
          >
            🎬 Vidéo AI
          </button>
        </div>

        {/* Image Generation Tab */}
        {activeTab === "image" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gold-500/20 bg-zinc-900 p-4 space-y-4">
              <label className="block text-sm font-medium text-gold-300">
                Décris ton image
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Un beau coucher de soleil sur le fleuve Saint-Laurent avec la skyline de Montréal..."
                className="w-full min-h-[120px] resize-none rounded-xl border border-gold-500/20 bg-black/50 p-4 text-white placeholder:text-zinc-500 focus:border-gold-500 focus:outline-none"
                data-testid="input-prompt"
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gold-300">
                  Ratio d'aspect
                </label>
                <div className="flex gap-2 flex-wrap">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        aspectRatio === ratio.value
                          ? "bg-gold-500 text-black"
                          : "bg-zinc-800 text-gold-300 hover:bg-zinc-700"
                      }`}
                      data-testid={`button-ratio-${ratio.value}`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-zinc-800/50 border border-gold-500/10 p-3 text-xs text-zinc-400">
                💡 <strong className="text-gold-400">Tip TikTok:</strong> Les
                vidéos 9:16 (vertical) performent mieux sur le feed continu.
                Génère d'abord une image verticale, puis anime-la en vidéo!
              </div>

              <Button
                onClick={handleGenerateImage}
                disabled={!prompt.trim() || isGeneratingImage}
                isLoading={isGeneratingImage}
                className="w-full press-scale"
                data-testid="button-generate-image"
              >
                {isGeneratingImage
                  ? "☄️ Création en cours..."
                  : aspectRatio === "9:16"
                    ? "✨ Générer image TikTok (9:16)"
                    : "✨ Générer une image"}
              </Button>
            </div>

            {/* Comet Loading Animation for Images */}
            {isGeneratingImage && activeTab === "image" && (
              <div className="rounded-xl border border-gold-500/20 bg-zinc-900/80 p-8 video-generating">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="comet-loader">
                    <div className="comet-loader-track" />
                  </div>
                  <p className="text-gold-400 font-medium animate-pulse">
                    ☄️ La comète travaille fort...
                  </p>
                  <p className="text-zinc-500 text-sm text-center">
                    Ton image arrive dans quelques secondes
                  </p>
                </div>
              </div>
            )}

            {generatedImage && (
              <div
                className="space-y-4 generated-reveal"
                data-testid="container-image-result"
              >
                <div className="overflow-hidden rounded-xl border border-gold-500/30 bg-zinc-900 video-hover-glow">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full"
                    data-testid="img-generated"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDownload(generatedImage, "image")}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-download-image"
                  >
                    📥 Télécharger
                  </Button>
                  <Button
                    onClick={() => {
                      setSourceImage(generatedImage);
                      setActiveTab("video");
                    }}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-animate"
                  >
                    🎬 Animate
                  </Button>
                  <Button
                    onClick={() => handleUseForPost(generatedImage)}
                    className="flex-1"
                    data-testid="button-use-image"
                  >
                    📤 Publier
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video Generation Tab */}
        {activeTab === "video" && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="rounded-xl border border-gold-500/20 bg-zinc-900 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gold-300">
                  Modèle Vidéo
                </label>
                <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
                  <button
                    onClick={() => setVideoModel("wan")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      videoModel === "wan"
                        ? "bg-gold-500 text-black shadow-lg"
                        : "text-zinc-500 hover:text-gold-400"
                    }`}
                  >
                    WAN 2.1
                  </button>
                  <button
                    onClick={() => setVideoModel("kling")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      videoModel === "kling"
                        ? "bg-gold-500 text-black shadow-lg"
                        : "text-zinc-500 hover:text-gold-400"
                    }`}
                  >
                    KLING V2
                  </button>
                </div>
              </div>

              <label className="block text-sm font-medium text-gold-300">
                Image source
              </label>

              {sourceImage ? (
                <div className="relative">
                  <img
                    src={sourceImage}
                    alt="Source"
                    className="w-full rounded-xl"
                    data-testid="img-source"
                  />
                  <button
                    onClick={() => setSourceImage(null)}
                    className="absolute top-2 right-2 bg-black/50 rounded-full p-2 hover:bg-black/70"
                    data-testid="button-clear-source"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gold-500/30 rounded-xl p-8 text-center">
                  <p className="text-zinc-400 mb-4">
                    Génère une image d'abord, ou colle un URL d'image
                  </p>
                  <input
                    type="text"
                    placeholder="Colle un URL d'image..."
                    className="w-full rounded-lg border border-gold-500/20 bg-black/50 p-3 text-white placeholder:text-zinc-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSourceImage((e.target as HTMLInputElement).value);
                      }
                    }}
                    data-testid="input-image-url"
                  />
                </div>
              )}

              <label className="block text-sm font-medium text-gold-300">
                Description du mouvement (optionnel)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Mouvement de caméra doux, nuages qui bougent lentement, eau qui ondule..."
                className="w-full min-h-[80px] resize-none rounded-xl border border-gold-500/20 bg-black/50 p-4 text-white placeholder:text-zinc-500 focus:border-gold-500 focus:outline-none"
                data-testid="input-motion-prompt"
              />

              <div className="rounded-lg bg-zinc-800/50 border border-gold-500/10 p-3 text-xs text-zinc-400">
                💡 <strong className="text-gold-400">TikTok Ready:</strong>{" "}
                Vidéos verticales 9:16 optimisées pour le feed continu.
                Génération 5 secondes, format parfait pour TikTok!
              </div>

              <Button
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo}
                isLoading={isGeneratingVideo}
                className="w-full press-scale"
                data-testid="button-generate-video"
              >
                {isGeneratingVideo
                  ? `☄️ Création ${videoModel === "wan" ? "Wan" : "Kling"}...`
                  : `🎬 Générer avec ${videoModel === "wan" ? "Wan Video" : "Kling"}`}
              </Button>
            </div>

            {/* Comet Loading Animation */}
            {isGeneratingVideo && activeTab === "video" && (
              <div className="rounded-xl border border-gold-500/20 bg-zinc-900/80 p-8 video-generating">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="comet-loader">
                    <div className="comet-loader-track" />
                  </div>
                  <p className="text-gold-400 font-medium animate-pulse">
                    ☄️ La comète travaille fort...
                  </p>
                  <p className="text-zinc-500 text-sm text-center">
                    Ça prend environ 30-60 secondes pour créer ta vidéo
                  </p>
                </div>
              </div>
            )}

            {generatedVideo && (
              <div
                className="space-y-4 generated-reveal"
                data-testid="container-video-result"
              >
                <div className="overflow-hidden rounded-xl border border-gold-500/30 bg-zinc-900 video-hover-glow">
                  <video
                    key={generatedVideo} // Force re-render if source changes
                    src={generatedVideo}
                    controls
                    autoPlay
                    loop
                    muted // CRITICAL for production - required for autoplay
                    playsInline // CRITICAL for iOS production
                    className="w-full"
                    data-testid="video-generated"
                  >
                    <source src={generatedVideo} type="video/mp4" />
                    Votre navigateur ne supporte pas la balise vidéo.
                  </video>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDownload(generatedVideo, "video")}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-download-video"
                  >
                    📥 Télécharger
                  </Button>
                  <Button
                    onClick={() => handleUseForPost(generatedVideo)}
                    className="flex-1"
                    data-testid="button-use-video"
                  >
                    📤 Publier
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="rounded-xl border border-gold-500/10 bg-zinc-900/50 p-4">
          <h3 className="mb-2 font-medium text-gold-300">
            {activeTab === "image"
              ? "🎨 Conseils pour les images"
              : "🎬 Conseils pour les vidéos"}
          </h3>
          <ul className="space-y-1 text-sm text-zinc-400">
            {activeTab === "image" ? (
              <>
                <li>
                  • Sois précis·e sur le style, l'éclairage et la composition
                </li>
                <li>• Ajoute des éléments québécois pour une touche locale</li>
                <li>
                  • Essaie "cinématique", "vibrant" ou "moody" pour différentes
                  ambiances
                </li>
              </>
            ) : (
              <>
                <li>
                  • Fonctionne mieux avec des images aux sujets bien définis
                </li>
                <li>
                  • Décris le mouvement que tu veux (panoramique, zoom,
                  mouvement)
                </li>
                <li>• La génération prend environ 30-60 secondes</li>
              </>
            )}
          </ul>
        </div>

        {/* Studio Comète Branding */}
        <footer className="text-center py-6 mt-4">
          <div className="flex items-center justify-center gap-2 text-gold-500">
            <span className="comet-icon">☄️</span>
            <span className="font-semibold tracking-wide bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 bg-clip-text text-transparent">
              Studio Comète
            </span>
          </div>
          <p className="text-xs text-gold-500/60 mt-1">
            Propulsé par l'innovation québécoise
          </p>
        </footer>
      </main>
    </div>
  );
};

export default AIStudio;
