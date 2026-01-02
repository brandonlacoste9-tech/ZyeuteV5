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
import { getJobStatus } from "../services/api";

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

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Poll for video processing status
  React.useEffect(() => {
    if (!processingJobId) return;

    const pollJobStatus = async () => {
      try {
        const status = await getJobStatus(processingJobId);
        if (status) {
          setProcessingStatus(status.state);
          setProcessingProgress(status.progress);

          if (status.state === "completed") {
            toast.success("Vidéo améliorée avec succès! ✨");
            navigate("/");
          } else if (status.state === "failed") {
            toast.error("Erreur lors de l'amélioration de la vidéo");
            setProcessingJobId(null);
          }
        }
      } catch (error) {
        uploadLogger.error("Job status polling error:", error);
      }
    };

    // Poll immediately, then every 2 seconds
    pollJobStatus();
    const interval = setInterval(pollJobStatus, 2000);

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

      // Upload file to Supabase Storage (still using Supabase for file storage)
      const fileExt = file.name.split(".").pop();
      const fileName = `${generateId()}.${fileExt}`;
      const filePath = `posts/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath);

      // Extract hashtags
      const hashtags = extractHashtags(caption);

      // Create post using API
      const mediaType = file.type.startsWith("video") ? "video" : "photo";
      const post = await createPost({
        type: mediaType,
        mediaUrl: publicUrl,
        caption: caption.trim(),
        hashtags,
        region: region || undefined,
        visualFilter: visualFilter === "none" ? undefined : visualFilter,
        isEphemeral: isEphemeral, // Pass the burn flag
      });

      if (!post) throw new Error("Failed to create post");

      // Handle video processing
      if (mediaType === "video") {
        if (post.jobId) {
          setProcessingJobId(post.jobId);
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
                    onClick={() => {
                      const suggestions = [
                        "Une belle journée au Québec! ⚜️🇨🇦",
                        "Tiguidou! C'est malade en esti! 🔥",
                        "Fier d'être Québécois! 🍁",
                        "Y fait beau au Québec aujourd'hui! ☀️",
                      ];
                      const randomCaption =
                        suggestions[
                          Math.floor(Math.random() * suggestions.length)
                        ];
                      setCaption((prev) =>
                        prev ? `${prev} ${randomCaption}` : randomCaption,
                      );
                    }}
                    className="btn-leather py-2 rounded-lg text-xs font-bold"
                  >
                    ✨ Légende Magique
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
              <div className="leather-card rounded-2xl p-6 stitched">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center">
                    {processingStatus === "completed" ? (
                      <IoCheckmarkCircle className="text-2xl text-green-500" />
                    ) : processingStatus === "failed" ? (
                      <IoWarning className="text-2xl text-red-500" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gold-400 font-bold text-lg">
                      {processingStatus === "completed"
                        ? "Vidéo améliorée!"
                        : processingStatus === "failed"
                          ? "Erreur d'amélioration"
                          : "Amélioration en cours..."}
                    </h3>
                    <p className="text-leather-300 text-sm">
                      {processingStatus === "completed"
                        ? "Votre vidéo est maintenant prête à être partagée!"
                        : processingStatus === "failed"
                          ? "Une erreur est survenue lors du traitement."
                          : `Progression: ${processingProgress}%`}
                    </p>
                  </div>
                </div>
                {processingStatus !== "completed" &&
                  processingStatus !== "failed" && (
                    <div className="mt-4 bg-leather-900/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-500"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                  )}
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

      <BottomNav />
    </div>
  );
};

export default Upload;
