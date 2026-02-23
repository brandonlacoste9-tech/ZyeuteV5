/**
 * ChatMediaUploader - File, image, and video sharing for TI-GUY chat
 * Drag & drop, paste, or click to upload
 */

import React, { useState, useRef, useCallback } from "react";
import { 
  Image as ImageIcon, 
  File, 
  X, 
  Upload, 
  Loader2,
  Film,
  Music
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMediaUploaderProps {
  onUpload: (files: UploadedFile[]) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export interface UploadedFile {
  id: string;
  file: File;
  type: "image" | "video" | "audio" | "file";
  preview?: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  url?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mp3", "audio/wav", "audio/ogg", "audio/webm"],
  file: ["application/pdf", "text/plain", "application/msword"]
};

export const ChatMediaUploader: React.FC<ChatMediaUploaderProps> = ({
  onUpload,
  onCancel,
  isOpen,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFileType = (file: File): UploadedFile["type"] => {
    if (ALLOWED_TYPES.image.includes(file.type)) return "image";
    if (ALLOWED_TYPES.video.includes(file.type)) return "video";
    if (ALLOWED_TYPES.audio.includes(file.type)) return "audio";
    return "file";
  };

  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        resolve(undefined);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        alert(`Fichier trop grand: ${file.name} (max 50MB)`);
        continue;
      }

      const type = detectFileType(file);
      const preview = await createPreview(file);

      newFiles.push({
        id: Math.random().toString(36).substring(7),
        file,
        type,
        preview,
        progress: 0,
        status: "pending",
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = ""; // Reset input
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    // Simulate upload progress
    for (const file of files) {
      setFiles((prev) =
        prev.map((f) =
          f.id === file.id ? { ...f, status: "uploading" } : f
        )
      );

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setFiles((prev) =
          prev.map((f) =
            f.id === file.id ? { ...f, progress } : f
          )
        );
      }

      // Mark as done with fake URL
      setFiles((prev) =
        prev.map((f) =
          f.id === file.id 
            ? { ...f, status: "done", url: `https://cdn.zyeute.com/${f.id}` } 
            : f
        )
      );
    }

    // Send completed files to parent
    onUpload(files.map(f => ({ ...f, status: "done" })));
    setFiles([]);
  };

  const getFileIcon = (type: UploadedFile["type"]) => {
    switch (type) {
      case "image": return <ImageIcon className="w-5 h-5" />;
      case "video": return <Film className="w-5 h-5" />;
      case "audio": return <Music className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D] rounded-2xl w-full max-w-lg border border-gold-500/20 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gold-500/20 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gold-400 flex items-center gap-2">
              <Upload className="w-6 h-6" />
              Partager un fichier
            </h3>
            <p className="text-stone-500 text-sm mt-1">
              Images, vidéos, audio ou documents
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-stone-400" />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragging
                ? "border-gold-500 bg-gold-500/10"
                : "border-stone-700 hover:border-stone-600 hover:bg-white/5"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex justify-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gold-400" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center">
                <Film className="w-6 h-6 text-gold-400" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center">
                <File className="w-6 h-6 text-gold-400" />
              </div>
            </div>
            
            <p className="text-white font-medium mb-2">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="text-stone-500 text-sm">
              ou cliquez pour sélectionner • Max 50MB
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-stone-400 text-sm font-medium">
                {files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}
              </p>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-black/30 rounded-xl p-3 flex items-center gap-3 border border-gold-500/10"
                  >
                    {/* Preview or Icon */}
                    <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gold-400">{getFileIcon(file.type)}</span>
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {file.file.name}
                      </p>
                      <p className="text-stone-500 text-sm">
                        {formatFileSize(file.file.size)}
                      </p>
                      
                      {/* Progress Bar */}
                      {file.status === "uploading" && (
                        <div className="mt-2 h-1 bg-stone-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold-500 transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 hover:bg-white/5 rounded-full transition-colors"
                      disabled={file.status === "uploading"}
                    >
                      <X className="w-4 h-4 text-stone-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gold-500/20 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-700 text-white font-medium hover:bg-white/5 transition-colors"
          >
            Annuler
          </button>
          
          <button
            onClick={handleUpload}
            disabled={files.length === 0}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
              files.length > 0
                ? "bg-gold-500 text-black hover:bg-gold-400"
                : "bg-stone-700 text-stone-500 cursor-not-allowed"
            )}
          >
            {files.some((f) => f.status === "uploading") ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                Envoyer {files.length > 0 && `(${files.length})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMediaUploader;
