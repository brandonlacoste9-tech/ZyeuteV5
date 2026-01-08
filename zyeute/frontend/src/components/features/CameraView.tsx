/**
 * CameraView - Unified camera interface for Zyeuté
 * Supports photo and video capture with a premium leather/gold UI
 */

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import {
  IoClose,
  IoCameraReverseOutline,
  IoFlashOutline,
  IoFlashOffOutline,
} from "react-icons/io5";

interface CameraViewProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  mode?: "photo" | "video" | "both";
}

export const CameraView: React.FC<CameraViewProps> = ({
  onCapture,
  onClose,
  mode = "both",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeMode, setActiveMode] = useState<"photo" | "video">(
    mode === "video" ? "video" : "photo",
  );
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [flash, setFlash] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Initialize camera
  const initCamera = async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          aspectRatio: 9 / 16,
        },
        audio: activeMode === "video",
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error("Camera init error:", error);
      toast.error("Accès à la caméra refusé! 🚨");
      onClose();
    }
  };

  useEffect(() => {
    initCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, activeMode]);

  // Take photo
  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          onCapture(file);
        }
      },
      "image/jpeg",
      0.9,
    );
  };

  // Start recording video
  const startRecording = () => {
    if (!stream) return;

    const options = { mimeType: "video/webm;codecs=vp9,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = "video/webm";
    }

    const recorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = recorder;
    setRecordedChunks([]);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/mp4" }); // Simplified type for UI
      const file = new File([blob], `video_${Date.now()}.mp4`, {
        type: "video/mp4",
      });
      onCapture(file);
    };

    recorder.start();
    setIsRecording(true);
  };

  // Stop recording video
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <IoClose size={28} />
        </button>

        <div className="flex gap-4">
          <button
            onClick={() => setFlash(!flash)}
            className="p-2 rounded-full bg-black/40 text-white transition-colors"
          >
            {flash ? (
              <IoFlashOutline size={24} className="text-gold-400" />
            ) : (
              <IoFlashOffOutline size={24} />
            )}
          </button>
          <button
            onClick={toggleFacingMode}
            className="p-2 rounded-full bg-black/40 text-white transition-colors"
          >
            <IoCameraReverseOutline size={24} />
          </button>
        </div>
      </div>

      {/* Camera Preview */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
        />

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600/80 px-4 py-1 rounded-full text-white text-sm font-bold animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
            REC
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-black p-8 pb-12">
        <div className="max-w-md mx-auto flex flex-col items-center gap-8">
          {/* Mode Selector */}
          <div className="flex gap-8">
            {mode !== "video" && (
              <button
                onClick={() => setActiveMode("photo")}
                className={`text-sm font-bold tracking-widest uppercase transition-colors ${activeMode === "photo" ? "text-gold-400" : "text-zinc-500"}`}
              >
                PHOTO
              </button>
            )}
            {mode !== "photo" && (
              <button
                onClick={() => setActiveMode("video")}
                className={`text-sm font-bold tracking-widest uppercase transition-colors ${activeMode === "video" ? "text-gold-400" : "text-zinc-500"}`}
              >
                VIDÉO
              </button>
            )}
          </div>

          {/* Shutter Button */}
          <div className="relative flex items-center justify-center">
            {activeMode === "photo" ? (
              <button
                onClick={takePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-white group-hover:bg-gold-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]" />
              </button>
            ) : (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-95 ${isRecording ? "border-red-500" : "border-white"}`}
              >
                <div
                  className={`transition-all duration-300 ${isRecording ? "w-8 h-8 bg-red-500 rounded-sm" : "w-16 h-16 bg-red-600 rounded-full"} shadow-[0_0_20px_rgba(239,68,68,0.3)]`}
                />
              </button>
            )}

            {/* Gallery Hint */}
            <div className="absolute right-[-80px] opacity-40">
              <div className="w-12 h-12 rounded-lg border-2 border-white/20 bg-zinc-800 flex items-center justify-center">
                <span className="text-xs">🖼️</span>
              </div>
            </div>
          </div>

          <p className="text-zinc-500 text-xs">
            {activeMode === "video"
              ? "Appuie pour filmer"
              : "Appuie pour prendre une photo"}
          </p>
        </div>
      </div>

      {/* Theme Variable Injection for consistent look */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .text-gold-400 { color: var(--primary-color, #FFBF00); }
        .bg-gold-500 { background: var(--primary-color, #FFBF00); }
      `,
        }}
      />
    </div>
  );
};
