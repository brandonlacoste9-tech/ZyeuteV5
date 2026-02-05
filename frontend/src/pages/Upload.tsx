/**
 * Upload Page - Premium Quebec Heritage Design
 * Luxury content creation with Ti-Guy AI and gold accents
 */

import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import {
  getCurrentUser,
  createPost,
  createRemix,
  getSound,
  type Sound,
} from "../services/api";
import { supabase } from "../lib/supabase";
import { extractHashtags, generateId } from "../lib/utils";
import { QUEBEC_REGIONS } from "../lib/quebecFeatures";
import { toast } from "../components/Toast";
import { logger } from "../lib/logger";
import { CameraView } from "@/components/features/CameraView";
import { SoundPicker } from "@/components/sounds/SoundPicker";
import {
  IoCamera,
  IoImages,
  IoCloudUploadOutline,
  IoColorFilterOutline,
  IoClose,
  IoFlame,
} from "react-icons/io5";

const uploadLogger = logger.withContext("Upload");

const VISUAL_FILTERS = [
  { id: "none", name: "Original", emoji: "✨" },
  { id: "quebecois", name: "Québécois", emoji: "⚜️" },
  { id: "vintage", name: "Vieux-MTL", emoji: "🎞️" },
  { id: "noir", name: "Nordic Noir", emoji: "🌑" },
  { id: "warm", name: "Chaleureux", emoji: "🔥" },
  { id: "cool", name: "Hivernal", emoji: "❄️" },
  { id: "bright", name: "Éclatant", emoji: "☀️" },
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  // Create a blob from a data URI
  const dataURIToBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
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
      const user = await getCurrentUser();
      if (!user) {
        toast.error("Tu dois être connecté!");
        navigate("/login");
        return;
      }

      let mediaUrl = "";
      let thumbnailUrl = "";
      let muxUploadId = "";

      const isVideo = file.type.startsWith("video");

      if (isVideo) {
        // --- VIDEO FLOW (MUX) ---
        // 1. Generate client-side thumbnail (with timeout telemetry)
        const { generateVideoThumbnail } =
          await import("../utils/videoThumbnail");
        const { mediaTelemetry } = await import("../lib/mediaTelemetry");
        const thumbDataUrl = await generateVideoThumbnail(file, {
          onTimeout: () => mediaTelemetry.recordThumbnailTimeout("upload"),
        });
        const thumbBlob = dataURIToBlob(thumbDataUrl);

        // 2. Upload thumbnail to Supabase
        const thumbName = `thumb_${generateId()}.jpg`;
        const thumbPath = `posts/${user.id}/${thumbName}`;
        await supabase.storage.from("media").upload(thumbPath, thumbBlob);
        const {
          data: { publicUrl: tUrl },
        } = supabase.storage.from("media").getPublicUrl(thumbPath);
        thumbnailUrl = tUrl;
        mediaUrl = tUrl; // Use thumbnail as temporary mediaUrl until Mux is ready

        // 3. Get Mux Upload URL
        const { createMuxUpload } = await import("../services/api");
        const muxUpload = await createMuxUpload();
        if (!muxUpload) throw new Error("Failed to create Mux upload");
        muxUploadId = muxUpload.uploadId;

        // 4. Start Mux Upload (Async)
        const UpChunk = await import("@mux/upchunk");
        const upload = UpChunk.createUpload({
          endpoint: muxUpload.uploadUrl,
          file: file,
          chunkSize: 5120, // 5MB chunks
        });

        upload.on("error", (err: any) => {
          uploadLogger.error("Mux Upload Error:", err.detail);
          toast.error("Erreur durant l'upload vidéo");
        });

        upload.on("progress", (progress: any) => {
          // We could show a progress bar here
          console.log(`Upload progress: ${progress.detail}%`);
        });

        upload.on("success", () => {
          uploadLogger.info("Mux Upload Success!");
        });
      } else {
        // --- PHOTO FLOW (SUPABASE) ---
        const fileExt = file.name.split(".").pop();
        const fileName = `${generateId()}.${fileExt}`;
        const filePath = `posts/${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(filePath);
        mediaUrl = publicUrl;
      }

      // 5. Create Post Record (or Remix if remix context)
      let post;

      if (remixPostId && remixType && isVideo) {
        // Create remix
        const remixResult = await createRemix(
          remixPostId,
          remixType,
          mediaUrl,
          caption.trim(),
        );

        if (!remixResult.post) {
          throw new Error(remixResult.error || "Failed to create remix");
        }
        post = remixResult.post;
      } else {
        // Create regular post
        post = await createPost({
          type: isVideo ? "video" : "photo",
          mediaUrl,
          thumbnailUrl,
          muxUploadId,
          caption: caption.trim(),
          hashtags: extractHashtags(caption),
          region: region || undefined,
          visualFilter: visualFilter === "none" ? undefined : visualFilter,
          isEphemeral: isEphemeral,
          soundId: selectedSound?.id,
          soundStartTime: 0, // Default start time
        } as any);
      }

      if (!post) throw new Error("Failed to create post");

      // Mark sound as used if selected
      if (selectedSound?.id) {
        try {
          await fetch(`/api/sounds/${selectedSound.id}/use`, {
            method: "POST",
            credentials: "include",
          });
        } catch (error) {
          console.error("Failed to mark sound as used:", error);
        }
      }

      toast.success(
        isVideo
          ? "Vidéo en traitement! Ti-Guy s'en occupe... 🦫"
          : "Post publié! 🔥",
      );
      navigate("/");
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

              <div className="flex gap-3 overflow-x-auto pb-2 gold-scrollbar">
                {VISUAL_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setVisualFilter(filter.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      visualFilter === filter.id
                        ? "border-gold-500 bg-gold-500/10 shadow-[0_0_15px_rgba(255,191,0,0.2)]"
                        : "border-leather-700 bg-black/40"
                    }`}
                  >
                    <span className="text-2xl">{filter.emoji}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-tighter ${
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

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="flex-1 py-4 text-leather-400 font-bold hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || !file}
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

      {/* Sound Picker Modal */}
      {showSoundPicker && (
        <SoundPicker
          isOpen={showSoundPicker}
          onClose={() => setShowSoundPicker(false)}
          onSelect={(sound) => {
            setSelectedSound(sound);
            setShowSoundPicker(false);
          }}
          selectedSoundId={selectedSound?.id}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Upload;
