/**
 * StoryCreator - Create and upload 24-hour stories with Premium Design
 */

import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Button";
import { supabase } from "../../lib/supabase";
import { toast } from "../Toast";
import { generateId } from "../../lib/utils";
import { logger } from "../../lib/logger";
import { CameraView } from "@/components/features/CameraView";
import { IoCamera, IoImages, IoClose, IoFlashOutline } from "react-icons/io5";

const storyCreatorLogger = logger.withContext("StoryCreator");

export const StoryCreator: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (
      !selectedFile.type.startsWith("image/") &&
      !selectedFile.type.startsWith("video/")
    ) {
      toast.error("Sélectionne une image ou vidéo!");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
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

  const handleUpload = async () => {
    if (!file) {
      toast.warning("Sélectionne un fichier d'abord!");
      return;
    }

    setIsUploading(true);
    toast.info("Upload de ta story... 📤");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Tu dois être connecté!");
        navigate("/login");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}_${generateId()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("stories").getPublicUrl(filePath);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { error: insertError } = await supabase.from("stories").insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: file.type.startsWith("video/") ? "video" : "photo",
        expires_at: expiresAt.toISOString(),
      });

      if (insertError) throw insertError;

      toast.success("Story publiée! 🎉");
      navigate("/");
    } catch (error: any) {
      storyCreatorLogger.error("Error uploading story:", error);
      toast.error(error.message || "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  if (showCamera) {
    return (
      <CameraView
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
        mode="video"
      />
    );
  }

  return (
    <div className="min-h-screen bg-black leather-overlay flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">
        <div className="leather-card p-6 stitched relative overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white text-xl font-bold embossed flex items-center gap-2">
              <span className="text-gold-500">✨</span>
              <span>NOUVELLE STORY</span>
            </h2>
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-leather-400 hover:text-white transition-colors"
            >
              <IoClose size={24} />
            </button>
          </div>

          {/* Selection Area */}
          {!preview ? (
            <div className="grid grid-cols-2 gap-4 aspect-[9/16] mb-6">
              <button
                onClick={() => setShowCamera(true)}
                className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-leather-700 hover:border-gold-500 hover:bg-gold-500/5 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-leather-800 flex items-center justify-center group-hover:scale-110 transition-transform border border-leather-600 shadow-xl">
                  <IoCamera className="text-3xl text-gold-500" />
                </div>
                <span className="text-white font-bold tracking-widest text-xs">
                  APPAREIL
                </span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-leather-700 hover:border-gold-500 hover:bg-gold-500/5 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-leather-800 flex items-center justify-center group-hover:scale-110 transition-transform border border-leather-600 shadow-xl">
                  <IoImages className="text-3xl text-gold-500" />
                </div>
                <span className="text-white font-bold tracking-widest text-xs">
                  BIBLIOTHÈQUE
                </span>
              </button>
            </div>
          ) : (
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 mb-6 shadow-2xl border-4 border-leather-700">
              {file?.type.startsWith("video/") ? (
                <video
                  src={preview}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}

              <div className="absolute top-4 left-4 badge-premium">
                {file?.type.startsWith("video/") ? "🎥 VIDÉO" : "📸 PHOTO"}
              </div>

              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-red-600 transition-all"
              >
                <IoClose size={24} />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-4 text-leather-400 font-bold hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="flex-[2] btn-gold py-4 rounded-2xl font-black text-lg shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
            >
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-black border-t-white rounded-full animate-spin" />
              ) : (
                <span>PUBLIER STORY</span>
              )}
            </button>
          </div>

          <p className="text-leather-500 text-[10px] text-center mt-6 uppercase tracking-[0.2em]">
            Visible pendant 24 heures seulement
          </p>

          {/* Subtle gold corner */}
          <div
            className="absolute top-0 right-0 w-12 h-12 bg-gold-gradient opacity-10"
            style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
          />
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;
