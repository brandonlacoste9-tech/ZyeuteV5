/**
 * Ti-Guy Studio - AI Video Editor & Publisher
 * TikTok-style upload experience with multi-stage progress
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/Button";
import {
  generateCaptions,
  smartTrim,
} from "../services/videoService";
import { surgicalUpload } from "../services/api";
import { toast } from "../components/Toast";

type UploadStage = "idle" | "preview" | "uploading" | "optimizing" | "publishing" | "done" | "error";

const STAGE_INFO: Record<UploadStage, { emoji: string; label: string; progress: number }> = {
  idle: { emoji: "📤", label: "Prêt", progress: 0 },
  preview: { emoji: "👀", label: "Aperçu", progress: 0 },
  uploading: { emoji: "☁️", label: "Téléversement vers le nuage...", progress: 33 },
  optimizing: { emoji: "⚡", label: "Optimisation réseau...", progress: 66 },
  publishing: { emoji: "⚜️", label: "Publication sur Zyeuté...", progress: 90 },
  done: { emoji: "✅", label: "Publié!", progress: 100 },
  error: { emoji: "❌", label: "Échec", progress: 0 },
};

export default function Studio() {
  const [stage, setStage] = useState<UploadStage>("idle");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoSize, setVideoSize] = useState("");

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract thumbnail at 1s mark
  const extractThumbnail = useCallback((file: File) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setThumbnailUrl(URL.createObjectURL(blob));
            }
          },
          "image/jpeg",
          0.85,
        );
      }
      URL.revokeObjectURL(video.src);
    };
  }, []);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle file selection
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Fichier trop gros (max 50MB)");
        return;
      }

      setFileToUpload(file);
      setVideoSize(formatSize(file.size));
      setPreviewUrl(URL.createObjectURL(file));
      setStage("preview");
      setErrorMessage("");
      extractThumbnail(file);
    },
    [extractThumbnail],
  );

  // Handle drag & drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith("video/")) {
        toast.error("Format vidéo requis (MP4, MOV)");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Fichier trop gros (max 50MB)");
        return;
      }
      setFileToUpload(file);
      setVideoSize(formatSize(file.size));
      setPreviewUrl(URL.createObjectURL(file));
      setStage("preview");
      setErrorMessage("");
      extractThumbnail(file);
    },
    [extractThumbnail],
  );

  // Publish flow with stages
  const handlePublish = useCallback(async () => {
    if (!fileToUpload) return;

    try {
      // Stage 1: Upload
      setStage("uploading");
      setUploadProgress(0);

      // Simulate upload progress (real progress would come from XHR)
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 8, 85));
      }, 300);

      const publishCaption = caption.trim() || "Partagé via Ti-Guy Studio 🍁";
      const result = await surgicalUpload(fileToUpload, publishCaption);
      clearInterval(progressInterval);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadProgress(100);

      // Stage 2: Optimizing
      setStage("optimizing");
      await new Promise((r) => setTimeout(r, 800));

      // Stage 3: Publishing
      setStage("publishing");
      await new Promise((r) => setTimeout(r, 600));

      // Done!
      setStage("done");
      toast.success("Vidéo publiée! +50 Nectar 🍯");

      // Navigate to feed after brief celebration
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: any) {
      setStage("error");
      setErrorMessage(err?.message || "Échec du téléversement");
      toast.error("Échec du téléversement. Réessaie.");
    }
  }, [fileToUpload, caption]);

  // Retry after error
  const handleRetry = useCallback(() => {
    setStage("preview");
    setErrorMessage("");
    setUploadProgress(0);
  }, []);

  // Reset to start over
  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setStage("idle");
    setFileToUpload(null);
    setPreviewUrl(null);
    setThumbnailUrl(null);
    setCaption("");
    setUploadProgress(0);
    setErrorMessage("");
    setVideoDuration(0);
    setVideoSize("");
  }, [previewUrl, thumbnailUrl]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
  }, [previewUrl, thumbnailUrl]);

  const isPublishing = stage === "uploading" || stage === "optimizing" || stage === "publishing";
  const stageInfo = STAGE_INFO[stage];

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Studio Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-orange-900/30">
            🎬
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Ti-Guy Studio</h1>
            <p className="text-white/50 text-sm">Montage vidéo intelligent</p>
          </div>
        </div>

        {/* IDLE: Upload area */}
        {stage === "idle" && (
          <div
            className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-[#D4AF37]/50 hover:bg-white/[0.03] transition-all cursor-pointer relative group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📤</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Téléverse ta vidéo
            </h3>
            <p className="text-white/40 text-sm mb-1">Glisse-dépose ou clique ici</p>
            <p className="text-white/30 text-xs">MP4, MOV, WebM — max 50MB</p>
          </div>
        )}

        {/* PREVIEW: Video preview + caption + AI tools */}
        {stage === "preview" && previewUrl && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Video Preview with 9:16 aspect ratio hint */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
              <video
                ref={videoPreviewRef}
                src={previewUrl}
                controls
                playsInline
                className="w-full max-h-[60vh] object-contain"
              />
              {/* Video metadata overlay */}
              <div className="absolute top-3 right-3 flex gap-2">
                {videoDuration > 0 && (
                  <span className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    {formatDuration(videoDuration)}
                  </span>
                )}
                {videoSize && (
                  <span className="bg-black/70 backdrop-blur-sm text-white/70 text-xs px-2 py-1 rounded-full">
                    {videoSize}
                  </span>
                )}
              </div>
              {/* Thumbnail preview */}
              {thumbnailUrl && (
                <div className="absolute bottom-3 left-3">
                  <div className="relative group/thumb">
                    <img
                      src={thumbnailUrl}
                      alt="Aperçu"
                      className="w-12 h-16 object-cover rounded-lg border border-white/20"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-black text-[8px] font-bold px-1 rounded">
                      Cover
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div className="relative">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 300))}
                placeholder="Décris ton contenu... #quebec #zyeute"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
                rows={3}
              />
              <span className="absolute bottom-2 right-3 text-white/30 text-xs">
                {caption.length}/300
              </span>
            </div>

            {/* AI Tools */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  toast.info("Ti-Guy travaille... 📝");
                  generateCaptions(previewUrl).then((captions) =>
                    toast.success(`${captions.length} sous-titres générés!`),
                  );
                }}
                className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
              >
                <div className="text-xl mb-1">📝</div>
                <div className="text-sm font-bold text-white">Sous-titres</div>
                <div className="text-xs text-white/40">Auto-Joual</div>
              </button>

              <button
                onClick={() => {
                  toast.info("Ti-Guy analyse... ✂️");
                  smartTrim(previewUrl).then((highlights) =>
                    toast.success(`${highlights.length} moments forts!`),
                  );
                }}
                className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
              >
                <div className="text-xl mb-1">✂️</div>
                <div className="text-sm font-bold text-white">Smart Trim</div>
                <div className="text-xs text-white/40">Couper silences</div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-5 py-3 bg-white/5 text-white/60 rounded-full hover:bg-white/10 transition-colors text-sm"
              >
                ← Changer
              </button>
              <Button
                onClick={handlePublish}
                className="flex-1 py-3 text-base font-bold bg-gradient-to-r from-red-600 to-orange-600 shadow-lg shadow-orange-900/20 rounded-full"
              >
                🚀 Publier sur Zyeuté
              </Button>
            </div>

            <p className="text-center text-xs text-white/30 italic">
              Souveraineté numérique pour le Québec ⚜️
            </p>
          </div>
        )}

        {/* PUBLISHING: Multi-stage progress */}
        {isPublishing && (
          <div className="text-center py-16 animate-in fade-in duration-300">
            {/* Progress Ring */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="6"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="none"
                  stroke="url(#studioGold)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(stage === "uploading" ? uploadProgress : stageInfo.progress) * 3.01} 301`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="studioGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#FFD700" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-4xl">
                {stageInfo.emoji}
              </div>
            </div>

            <p className="text-white font-bold text-lg mb-1">{stageInfo.label}</p>
            <p className="text-white/40 text-sm">
              {stage === "uploading"
                ? `${uploadProgress}% complété`
                : stage === "optimizing"
                  ? "Presque fini..."
                  : "Dernières touches..."}
            </p>

            {/* Stage indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {(["uploading", "optimizing", "publishing"] as UploadStage[]).map((s, i) => (
                <div
                  key={s}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all ${
                    stage === s
                      ? "bg-[#D4AF37]/20 text-[#D4AF37] font-bold"
                      : STAGE_INFO[s].progress <= stageInfo.progress
                        ? "bg-white/10 text-white/60"
                        : "bg-white/5 text-white/30"
                  }`}
                >
                  <span>{STAGE_INFO[s].emoji}</span>
                  <span>{i + 1}/3</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DONE: Success state */}
        {stage === "done" && (
          <div className="text-center py-16 animate-in fade-in zoom-in duration-300">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Publié!</h2>
            <p className="text-[#D4AF37] font-bold mb-1">+50 Nectar 🍯</p>
            <p className="text-white/40 text-sm">Redirection vers le fil...</p>
          </div>
        )}

        {/* ERROR: Retry state */}
        {stage === "error" && (
          <div className="text-center py-16 animate-in fade-in duration-300">
            <div className="text-6xl mb-4">😤</div>
            <h2 className="text-xl font-bold text-white mb-2">Oups!</h2>
            <p className="text-white/50 text-sm mb-6 max-w-xs mx-auto">
              {errorMessage || "Quelque chose a mal tourné. Ta vidéo est encore là."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleRetry}
                className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-bold rounded-full"
              >
                🔄 Réessayer
              </Button>
              <button
                onClick={handleReset}
                className="px-5 py-3 bg-white/10 text-white/60 rounded-full hover:bg-white/15 transition-colors text-sm"
              >
                Recommencer
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
