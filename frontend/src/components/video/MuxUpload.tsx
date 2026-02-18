/**
 * MuxUpload - Drag & drop upload with UpChunk chunked upload
 * Zyeuté V5 - Quebec social media
 */

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import * as UpChunk from "@mux/upchunk";
import { Upload, X, Loader2, CheckCircle, AlertCircle, Film } from "lucide-react";
import { apiCall } from "@/services/api";
import { cn } from "@/lib/utils";

interface MuxUploadProps {
  onUploadComplete: (data: {
    assetId: string;
    playbackId: string;
    uploadId: string;
  }) => void;
  onCancel?: () => void;
}

export function MuxUpload({ onUploadComplete, onCancel }: MuxUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "ready" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const upchunkRef = useRef<ReturnType<typeof UpChunk.createUpload> | null>(null);

  const pollUploadStatus = useCallback(
    async (uploadId: string) => {
      const checkStatus = async () => {
        const { data, error } = await apiCall<{
          success: boolean;
          data: { status: string; assetId?: string; playbackId?: string };
        }>(`/mux/upload-status/${uploadId}`);

        if (error) {
          setTimeout(checkStatus, 3000);
          return;
        }

        const { status, assetId, playbackId } = data?.data || {};

        if (status === "ready" && assetId && playbackId) {
          setUploadStatus("ready");
          onUploadComplete({ assetId, playbackId, uploadId });
        } else if (status === "errored") {
          setUploadStatus("error");
          setErrorMessage("Erreur lors du traitement de la vidéo");
        } else {
          setUploadStatus("processing");
          setTimeout(checkStatus, 2000);
        }
      };

      checkStatus();
    },
    [onUploadComplete],
  );

  const startUpload = useCallback(
    async (file: File) => {
      const { data: createData, error: createError } = await apiCall<{
        success: boolean;
        data: { uploadUrl: string; uploadId: string };
        error?: string;
      }>("/mux/create-upload", {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (createError || !createData?.data) {
        setUploadStatus("error");
        setErrorMessage(
          createData?.error || "Impossible de démarrer l'upload",
        );
        return;
      }

      const { uploadUrl, uploadId } = createData.data;

      try {
        setUploadStatus("uploading");
        setUploadProgress(0);
        setFileName(file.name);

        const upload = UpChunk.createUpload({
          file,
          endpoint: uploadUrl,
          chunkSize: 5120, // 5MB chunks
        });

        upchunkRef.current = upload;

        upload.on("error", () => {
          setUploadStatus("error");
          setErrorMessage("Erreur lors de l'upload");
        });

        upload.on("progress", (progress) => {
          setUploadProgress(progress.detail);
        });

        upload.on("success", () => {
          pollUploadStatus(uploadId);
        });
      } catch (err) {
        setUploadStatus("error");
        setErrorMessage("Impossible de démarrer l'upload");
      }
    },
    [pollUploadStatus],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (!file.type.startsWith("video/")) {
        setErrorMessage("Le fichier doit être une vidéo");
        setUploadStatus("error");
        return;
      }

      if (file.size > 500 * 1024 * 1024) {
        setErrorMessage("La vidéo ne doit pas dépasser 500MB");
        setUploadStatus("error");
        return;
      }

      startUpload(file);
    },
    [startUpload],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".webm", ".mkv"],
    },
    maxFiles: 1,
    disabled: uploadStatus === "uploading" || uploadStatus === "processing",
    noClick: uploadStatus !== "idle",
  });

  const handleCancel = () => {
    if (upchunkRef.current) {
      upchunkRef.current.abort();
    }
    setUploadStatus("idle");
    setUploadProgress(0);
    setFileName("");
    onCancel?.();
  };

  if (uploadStatus === "idle") {
    return (
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 leather-card",
          isDragActive
            ? "border-gold-500 bg-gold-500/10"
            : "border-leather-700 hover:border-leather-600 bg-leather-900/30",
        )}
      >
        <input {...getInputProps()} />
        <Film className="w-12 h-12 text-gold-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-stone-200 mb-2">
          {isDragActive ? "Dépose la vidéo ici" : "Glisse une vidéo ici"}
        </p>
        <p className="text-sm text-leather-400 mb-4">ou</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="px-4 py-2 bg-gold-gradient text-black rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Sélectionner un fichier
        </button>
        <p className="text-xs text-leather-500 mt-4">
          MP4, MOV, AVI, WebM jusqu'à 500MB
        </p>
      </div>
    );
  }

  return (
    <div className="leather-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Film className="w-5 h-5 text-gold-500" />
          <span className="text-sm text-stone-200 truncate max-w-[200px]">
            {fileName}
          </span>
        </div>
        {uploadStatus === "uploading" && (
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-leather-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-leather-400" />
          </button>
        )}
      </div>

      <div className="relative h-2 bg-leather-800 rounded-full overflow-hidden mb-4">
        <div
          className="absolute top-0 left-0 h-full bg-gold-gradient transition-all duration-300"
          style={{ width: `${uploadProgress}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        {uploadStatus === "uploading" && (
          <>
            <Loader2 className="w-4 h-4 text-gold-500 animate-spin" />
            <span className="text-sm text-leather-300">
              Upload en cours... {Math.round(uploadProgress)}%
            </span>
          </>
        )}
        {uploadStatus === "processing" && (
          <>
            <Loader2 className="w-4 h-4 text-gold-500 animate-spin" />
            <span className="text-sm text-leather-300">
              Traitement de la vidéo...
            </span>
          </>
        )}
        {uploadStatus === "ready" && (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-400">Vidéo prête!</span>
          </>
        )}
        {uploadStatus === "error" && (
          <>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-400">{errorMessage}</span>
          </>
        )}
      </div>
    </div>
  );
}
