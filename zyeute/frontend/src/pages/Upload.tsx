/**
 * Upload Page - Premium Quebec Heritage Design
 * Luxury content creation with Ti-Guy AI and gold accents
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { getCurrentUser, createPost } from "../services/api";
import { supabase } from "../lib/supabase";
import { extractHashtags, generateId } from "../lib/utils";
import { QUEBEC_REGIONS } from "../lib/quebecFeatures";
import { toast } from "../components/Toast";
import { logger } from "../lib/logger";
import { CameraView } from "@/components/features/CameraView";
import {
  IoCamera,
  IoImages,
  IoCloudUploadOutline,
  IoColorFilterOutline,
  IoClose,
  IoFlame,
  IoCheckmarkCircle,
  IoWarning,
} from "react-icons/io5";
import { getJobStatus, getPostById } from "../services/api";
import { BeforeAfterSlider } from "../components/features/BeforeAfterSlider";

const uploadLogger = logger.withContext("Upload");

const VISUAL_FILTERS = [
  {
    id: "none",
    name: "Original",
    emoji: "✨",
    description: "Aucune modification",
    preview: "Original",
  },
  {
    id: "prestige",
    name: "Prestige",
    emoji: "🎬",
    description: "Cinématique hollywoodien",
    preview: "Cinematic look with enhanced colors and contrast",
  },
  {
    id: "nordic",
    name: "Nordic",
    emoji: "🏔️",
    description: "Tons froids nordiques",
    preview: "Cool blue tones with crisp clarity",
  },
  {
    id: "quebecois",
    name: "Québécois",
    emoji: "⚜️",
    description: "Ambiance québécoise",
    preview: "Warm Quebec atmosphere",
  },
  {
    id: "vintage",
    name: "Vieux-MTL",
    emoji: "🎞️",
    description: "Style vintage Montréal",
    preview: "Retro Montreal aesthetic",
  },
  {
    id: "noir",
    name: "Nordic Noir",
    emoji: "🌑",
    description: "Noir nordique intense",
    preview: "Dark moody atmosphere",
  },
  {
    id: "warm",
    name: "Chaleureux",
    emoji: "🔥",
    description: "Tons chauds accueillants",
    preview: "Warm inviting colors",
  },
  {
    id: "cool",
    name: "Hivernal",
    emoji: "❄️",
    description: "Atmosphère hivernale",
    preview: "Winter atmosphere",
  },
  {
    id: "bright",
    name: "Éclatant",
    emoji: "☀️",
    description: "Luminosité maximale",
    preview: "Maximum brightness and vibrancy",
  },
];

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [city, setCity] = React.useState("");
  const [visualFilter, setVisualFilter] = React.useState("none");
  const [isEphemeral, setIsEphemeral] = React.useState(false); // View-Once / Burn Mode
  const [isUploading, setIsUploading] = React.useState(false);
  const [showCamera, setShowCamera] = React.useState(false);
  const [processingJobId, setProcessingJobId] = React.useState<string | null>(
    null,
  );
  const [processingStatus, setProcessingStatus] = React.useState<string | null>(
    null,
  );
  const [processingProgress, setProcessingProgress] = React.useState(0);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiData, setAiData] = React.useState<{
    caption: string;
    hashtags: string[];
    vibe: string;
  } | null>(null);
  const [originalVideoUrl, setOriginalVideoUrl] = React.useState<string | null>(null);
  const [processedVideoUrl, setProcessedVideoUrl] = React.useState<string | null>(null);
  const [currentPostId, setCurrentPostId] = React.useState<string | null>(null);
  const [showComparison, setShowComparison] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Cleanup blob URLs to prevent memory leaks
  React.useEffect(() => {
    return () => {
      // Revoke preview blob URL if it exists
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Poll for video/image processing status with exponential backoff
  React.useEffect(() => {
    if (!processingJobId) return;

    let pollCount = 0;
    let maxPolls = 300; // Max 10 minutes (300 * 2s)
    let pollInterval = 2000; // Start with 2 seconds

    const pollJobStatus = async () => {
      if (pollCount >= maxPolls) {
        uploadLogger.warn("Max polling attempts reached");
        setProcessingStatus("timeout");
        return;
      }

      try {
        const status = await getJobStatus(processingJobId);
        if (status) {
          setProcessingStatus(status.state);
          
          // Calculate progress: use job progress if available, otherwise estimate based on state
          let progress = status.progress || 0;
          if (progress === 0) {
            // Estimate progress based on state
            if (status.state === "waiting") progress = 5;
            else if (status.state === "active") progress = 30 + (pollCount % 60); // Simulate progress
            else if (status.state === "completed") progress = 100;
            else if (status.state === "failed") progress = 0;
          }
          setProcessingProgress(progress);

          if (status.state === "completed") {
            toast.success("Vidéo améliorée avec succès! ✨");
            
            // Fetch processed video URL for comparison
            if (currentPostId) {
              try {
                const updatedPost = await getPostById(currentPostId);
                if (updatedPost?.media_url) {
                  setProcessedVideoUrl(updatedPost.media_url);
                  setShowComparison(true);
                  // Don't navigate immediately - show comparison first
                  return; // Exit early to show comparison
                }
              } catch (error) {
                uploadLogger.error("Failed to fetch processed video:", error);
              }
            }
            
            // Fallback: navigate after delay if comparison not available
            setTimeout(() => navigate("/"), 3000);
          } else if (status.state === "failed") {
            const errorMsg = status.failedReason || "Erreur lors de l'amélioration de la vidéo";
            toast.error(errorMsg);
            setProcessingJobId(null);
            setProcessingStatus("failed");
          }
        }
      } catch (error) {
        uploadLogger.error("Job status polling error:", error);
        // On error, increase poll interval (exponential backoff)
        pollInterval = Math.min(pollInterval * 1.5, 10000); // Max 10s
      }

      pollCount++;
    };

    // Poll immediately, then at intervals
    pollJobStatus();
    const interval = setInterval(pollJobStatus, pollInterval);

    return () => clearInterval(interval);
  }, [processingJobId, navigate]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCameraCapture = (capturedFile: File) => {
    setFile(capturedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(capturedFile);
    setShowCamera(false);
  };

  const handleAIAnalysis = async () => {
    if (!preview || file?.type.startsWith("video")) return;

    setIsAnalyzing(true);
    try {
      // Small delay for UI feel
      await new Promise((r) => setTimeout(r, 800));

      const { analyzeImage } = await import("../services/api");
      const result = await analyzeImage(preview);

      if (result) {
        setAiData({
          caption: result.caption,
          hashtags: result.hashtags,
          vibe: result.vibe,
        });
        setCaption(result.caption);
        toast.success("Ti-Guy a fini son analyse! 🦫✨");
      }
    } catch (error) {
      uploadLogger.error("AI Analysis failed:", error);
      toast.error("Ti-Guy est un peu mêlé, réessaie plus tard!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Upload post
  const handleUpload = async () => {
    if (!file) {
      toast.warning("Ajoute une image ou vidéo!");
      return;
    }

    if (!caption.trim()) {
      toast.warning("Ajoute une légende!");
      return;
    }

    setIsUploading(true);
    toast.info("Upload en cours... 📤");

    try {
      // Get current user using session-based auth
      const user = await getCurrentUser();
      if (!user) {
        toast.error("Tu dois être connecté!");
        navigate("/login");
        return;
      }

      // Upload file to Supabase Storage (videos bucket, raw uploads)
      const fileExt = file.name.split(".").pop();
      const fileName = `${generateId()}.${fileExt}`;
      const filePath = `raw/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("videos").getPublicUrl(filePath);

      // Extract hashtags
      const hashtags = extractHashtags(caption);

      // Create post using API
      const mediaType = file.type.startsWith("video") ? "video" : "photo";
      const result = await createPost({
        type: mediaType,
        mediaUrl: publicUrl,
        caption: caption.trim(),
        hashtags,
        region: region || undefined,
        visualFilter: visualFilter === "none" ? undefined : visualFilter,
        isEphemeral: isEphemeral, // Pass the burn flag
      });

      if (!result.post) throw new Error("Failed to create post");

      // Store post ID for later use
      setCurrentPostId(result.post.id);

      // Handle video processing
      if (mediaType === "video") {
        if (result.jobId) {
          setProcessingJobId(result.jobId);
          setProcessingStatus("queued");
          toast.info("Vidéo en cours d'amélioration... ✨");
        } else {
          toast.success("Vidéo publiée! 🔥");
          navigate("/");
        }
      } else {
        toast.success("Photo publiée! 🔥");
        navigate("/");
      }
    } catch (error) {
      uploadLogger.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  if (showCamera) {
    return (
      <CameraView
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Nouveau Post" showBack={true} showSearch={false} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Media Selection */}
        {!preview ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowCamera(true)}
              className="aspect-square flex flex-col items-center justify-center gap-4 leather-card rounded-2xl border-2 border-dashed border-leather-700 hover:border-gold-500 hover:bg-gold-500/5 transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="w-16 h-16 rounded-full bg-leather-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg border border-leather-600">
                <IoCamera className="text-3xl text-gold-500" />
              </div>
              <span className="text-white font-bold tracking-wide">CAMÉRA</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square flex flex-col items-center justify-center gap-4 leather-card rounded-2xl border-2 border-dashed border-leather-700 hover:border-gold-500 hover:bg-gold-500/5 transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="w-16 h-16 rounded-full bg-leather-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg border border-leather-600">
                <IoImages className="text-3xl text-gold-500" />
              </div>
              <span className="text-white font-bold tracking-wide">
                GALERIE
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Preview Card */}
            <div className="relative aspect-[4/5] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-leather-800 group">
              {file?.type.startsWith("video") ? (
                <video
                  src={preview}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Shimmer Overlay for AI analysis */}
              {isAnalyzing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-transparent via-gold-500/30 to-transparent -translate-x-full animate-shimmer" />
                  <div className="relative z-20 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gold-500/20 border-2 border-gold-500 flex items-center justify-center animate-pulse">
                      <span className="text-4xl">🦫</span>
                    </div>
                    <div className="bg-black/80 px-4 py-2 rounded-full border border-gold-500/50 shadow-2xl">
                      <span className="text-gold-400 font-bold tracking-widest text-sm animate-pulse">
                        Ti-Guy analyse...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <IoClose size={24} />
              </button>

              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <div className="badge-premium inline-flex items-center gap-2">
                  {file?.type.startsWith("video") ? "🎥 VIDÉO" : "📸 PHOTO"}
                </div>
              </div>
            </div>

            {/* Filter Selection */}
            <div className="leather-card rounded-2xl p-6 stitched space-y-4">
              <div className="flex items-center gap-2 text-gold-500 font-bold uppercase tracking-widest text-sm">
                <IoColorFilterOutline size={20} />
                <span>Ambiance & Filtres</span>
              </div>

              {/* Filter Preview */}
              {visualFilter !== "none" && (
                <div className="bg-leather-900/50 rounded-xl p-4 border border-gold-500/20">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {VISUAL_FILTERS.find((f) => f.id === visualFilter)?.emoji}
                    </span>
                    <div>
                      <h4 className="text-gold-400 font-bold text-sm">
                        {
                          VISUAL_FILTERS.find((f) => f.id === visualFilter)
                            ?.name
                        }
                      </h4>
                      <p className="text-leather-300 text-xs">
                        {
                          VISUAL_FILTERS.find((f) => f.id === visualFilter)
                            ?.description
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 overflow-x-auto pb-2 gold-scrollbar">
                {VISUAL_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setVisualFilter(filter.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all min-w-[80px] ${
                      visualFilter === filter.id
                        ? "border-gold-500 bg-gold-500/10 shadow-[0_0_15px_rgba(255,191,0,0.2)]"
                        : "border-leather-700 bg-black/40"
                    }`}
                  >
                    <span className="text-2xl">{filter.emoji}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-tighter text-center leading-tight ${
                        visualFilter === filter.id
                          ? "text-gold-400"
                          : "text-leather-400"
                      }`}
                    >
                      {filter.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Before/After Comparison Hint */}
              {file?.type.startsWith("video") && visualFilter !== "none" && (
                <div className="bg-leather-900/30 rounded-lg p-3 border border-leather-700/50">
                  <p className="text-leather-300 text-xs text-center">
                    ✨ Le filtre sera appliqué automatiquement lors du
                    traitement de votre vidéo
                  </p>
                </div>
              )}
            </div>

            {/* Caption & Location Card */}
            <div className="leather-card rounded-3xl p-6 stitched space-y-6">
              <div className="space-y-2">
                <label className="text-gold-500 font-bold uppercase tracking-widest text-xs ml-1">
                  Légende
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Quoi de neuf au Québec? #Mtl #Hiver ⚜️"
                  className="input-premium h-32 resize-none"
                />
              </div>

              {/* Ti-Guy AI Suggestions */}
              <div className="bg-leather-900/50 rounded-xl p-4 border border-gold-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center">
                    <span className="text-lg">🦫</span>
                  </div>
                  <div>
                    <h3 className="text-gold-400 font-bold text-sm embossed">
                      Ti-Guy AI
                    </h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAIAnalysis}
                    disabled={isAnalyzing || file?.type.startsWith("video")}
                    className="btn-gold py-2 rounded-lg text-xs font-bold shadow-[0_4px_10px_rgba(255,191,0,0.3)] disabled:opacity-50"
                  >
                    {isAnalyzing ? "..." : "🦫 Ti-Guy Magique"}
                  </button>
                  <button
                    onClick={() => {
                      const hashtags = "#Quebec #MTL #Zyeute #Fier";
                      setCaption((prev) =>
                        prev ? `${prev} ${hashtags}` : hashtags,
                      );
                    }}
                    className="btn-leather py-2 rounded-lg text-xs font-bold"
                  >
                    🏷️ Tags Québec
                  </button>
                </div>
                {aiData?.vibe && (
                  <div className="mt-3 bg-gold-500/10 border border-gold-500/20 rounded-lg p-2 flex items-center gap-2">
                    <span className="text-sm">🎭</span>
                    <span className="text-[10px] text-gold-400 font-bold uppercase tracking-widest">
                      Vibe: {aiData.vibe}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-gold-500 font-bold uppercase tracking-widest text-xs ml-1">
                    Région
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="input-premium text-sm"
                  >
                    <option value="">Sélectionne</option>
                    {QUEBEC_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.emoji} {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-gold-500 font-bold uppercase tracking-widest text-xs ml-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: MTL"
                    className="input-premium text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Ephemeral / View-Once Toggle */}
            <div
              className={`leather-card rounded-2xl p-6 stitched transition-all ${isEphemeral ? "border-red-500 bg-red-900/10" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isEphemeral ? "bg-red-500 text-white" : "bg-leather-800 text-leather-400"}`}
                  >
                    <IoFlame size={20} />
                  </div>
                  <div>
                    <h3
                      className={`font-bold uppercase tracking-widest text-sm ${isEphemeral ? "text-red-400" : "text-leather-300"}`}
                    >
                      Mode Éphémère
                    </h3>
                    <p className="text-xs text-leather-400">
                      Cette publication s'autodétruira après 1 vue.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEphemeral(!isEphemeral)}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${isEphemeral ? "bg-red-500" : "bg-leather-800 border border-leather-600"}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${isEphemeral ? "translate-x-6" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>

            {/* Processing Status */}
            {processingJobId && (
              <div className={`leather-card rounded-2xl p-6 stitched transition-all ${
                processingStatus === "completed" ? "border-green-500/30 bg-green-500/5" :
                processingStatus === "failed" ? "border-red-500/30 bg-red-500/5" :
                "border-gold-500/30 bg-gold-500/5"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    processingStatus === "completed" ? "bg-green-500/20" :
                    processingStatus === "failed" ? "bg-red-500/20" :
                    "bg-gold-500/20"
                  }`}>
                    {processingStatus === "completed" ? (
                      <IoCheckmarkCircle className="text-2xl text-green-500 animate-pulse" />
                    ) : processingStatus === "failed" ? (
                      <IoWarning className="text-2xl text-red-500" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${
                      processingStatus === "completed" ? "text-green-400" :
                      processingStatus === "failed" ? "text-red-400" :
                      "text-gold-400"
                    }`}>
                      {processingStatus === "completed"
                        ? "✨ Vidéo améliorée!"
                        : processingStatus === "failed"
                          ? "❌ Erreur d'amélioration"
                          : processingStatus === "timeout"
                            ? "⏱️ Traitement en attente"
                          : "🎬 Amélioration en cours..."}
                    </h3>
                    <p className="text-leather-300 text-sm mt-1">
                      {processingStatus === "completed"
                        ? "Votre vidéo est maintenant prête à être partagée!"
                        : processingStatus === "failed"
                          ? "Une erreur est survenue lors du traitement. Vous pouvez réessayer."
                          : processingStatus === "timeout"
                            ? "Le traitement prend plus de temps que prévu. Vérifiez votre vidéo dans quelques instants."
                          : `Progression: ${Math.min(processingProgress, 99)}%`}
                    </p>
                  </div>
                </div>
                {processingStatus !== "completed" &&
                  processingStatus !== "failed" && (
                    <div className="mt-4 space-y-2">
                      <div className="bg-leather-900/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-300 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,191,0,0.5)]"
                          style={{ width: `${Math.min(processingProgress, 99)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-leather-400">
                        <span>Traitement en cours...</span>
                        <span>{Math.min(processingProgress, 99)}%</span>
                      </div>
                    </div>
                  )}
                {processingStatus === "failed" && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        setProcessingJobId(null);
                        setProcessingStatus(null);
                        setProcessingProgress(0);
                      }}
                      className="flex-1 btn-leather py-2 rounded-lg text-sm font-bold"
                    >
                      Réessayer
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="flex-1 btn-gold py-2 rounded-lg text-sm font-bold"
                    >
                      Continuer
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Video Comparison Slider */}
            {showComparison && originalVideoUrl && processedVideoUrl && (
              <div className="leather-card rounded-2xl p-6 stitched space-y-4 border-gold-500/30">
                <div className="flex items-center gap-2 text-gold-500 font-bold uppercase tracking-widest text-sm">
                  <span>✨ Comparaison Avant/Après</span>
                </div>
                <BeforeAfterSlider
                  originalUrl={originalVideoUrl}
                  processedUrl={processedVideoUrl}
                  filterName={VISUAL_FILTERS.find((f) => f.id === visualFilter)?.name}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowComparison(false);
                      navigate("/");
                    }}
                    className="flex-1 gold-button py-3 rounded-xl font-bold uppercase tracking-wider"
                  >
                    Publier Maintenant
                  </button>
                  <button
                    onClick={() => {
                      setShowComparison(false);
                      setProcessingJobId(null);
                      setProcessedVideoUrl(null);
                    }}
                    className="px-6 py-3 rounded-xl border-2 border-leather-700 text-leather-300 hover:border-leather-600 transition-colors"
                  >
                    Retour
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setProcessingJobId(null);
                  setProcessingStatus(null);
                  setProcessingProgress(0);
                }}
                className="flex-1 py-4 text-leather-400 font-bold hover:text-white transition-colors"
                disabled={
                  !!processingJobId &&
                  processingStatus !== "completed" &&
                  processingStatus !== "failed"
                }
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || !file || !!processingJobId}
                className="flex-[2] btn-gold py-4 rounded-2xl font-black text-lg shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-black border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <IoCloudUploadOutline className="text-2xl group-hover:scale-110 transition-transform" />
                    <span>PUBLIER</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
        />

        {/* Tips Card */}
        <div className="leather-card rounded-2xl p-6 stitched mt-6">
          <h3 className="text-gold-400 font-bold mb-3 embossed flex items-center gap-2">
            <span>💡</span>
            <span>Conseils Zyeuté</span>
          </h3>
          <ul className="space-y-2 text-leather-200 text-sm">
            <li>⚜️ Use #Quebec #MTL for local reach</li>
            <li>🔥 Vertical videos (9:16) perform best</li>
          </ul>
        </div>
      </main>

      {/* Processing Status Overlay */}
      {processingStatus && processingStatus !== "completed" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-leather-900 rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-gold-500/30">
            <div className="text-center space-y-4">
              {/* Spinner */}
              <div className="relative w-20 h-20 mx-auto">
                <svg
                  className="animate-spin h-20 w-20 text-gold-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>

              {/* Status Message */}
              <div>
                <h3 className="text-gold-400 font-bold text-xl mb-2">
                  {processingStatus === "queued" && "✨ En file d'attente..."}
                  {processingStatus === "waiting" && "⏳ En attente..."}
                  {processingStatus === "active" && "🎬 Amélioration en cours..."}
                  {processingStatus === "processing" && "✨ Amélioration en cours..."}
                  {processingStatus === "failed" && "❌ Échec"}
                </h3>
                <p className="text-stone-400 text-sm">
                  {processingStatus === "queued" && "Ta vidéo est en file d'attente"}
                  {processingStatus === "waiting" && "En attente du traitement"}
                  {processingStatus === "active" && "Ti-Guy améliore ta vidéo..."}
                  {processingStatus === "processing" && `Progression: ${processingProgress}%`}
                  {processingStatus === "failed" && "Une erreur est survenue"}
                </p>
              </div>

              {/* Progress Bar */}
              {processingProgress > 0 && processingStatus !== "failed" && (
                <div className="w-full bg-leather-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gold-gradient h-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              )}

              {/* Retry Button for Failed */}
              {processingStatus === "failed" && (
                <button
                  onClick={() => {
                    setProcessingStatus(null);
                    setProcessingJobId(null);
                    toast.info("Tu peux réessayer l'upload");
                  }}
                  className="w-full mt-4 px-6 py-3 bg-gold-gradient text-black font-bold rounded-full hover:opacity-90 transition-opacity"
                >
                  Réessayer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Upload;
