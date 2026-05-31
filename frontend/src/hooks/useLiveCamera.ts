/**
 * useLiveCamera — Phone camera → canvas filter pipeline → WHIP WebRTC publish
 *
 * Flow:
 *   getUserMedia (rear/front) → draw to hidden <video>
 *   → rAF loop renders to <canvas> with CSS-filter effects
 *   → canvas.captureStream() → RTCPeerConnection → WHIP endpoint (Mux)
 *
 * WHIP: WebRTC-HTTP Ingestion Protocol — single POST to exchange SDP offer/answer.
 */

import { useRef, useState, useCallback, useEffect } from "react";

export type LiveFilter =
  | "none"
  | "beauty"
  | "bright"
  | "vintage"
  | "bw"
  | "blur"
  | "quebec";

export const FILTER_LABELS: Record<LiveFilter, string> = {
  none: "Normal",
  beauty: "Beauté",
  bright: "Lumineux",
  vintage: "Vintage",
  bw: "Noir & Blanc",
  blur: "Doux",
  quebec: "Québec",
};

export const FILTER_CSS: Record<LiveFilter, string> = {
  none: "none",
  beauty: "contrast(1.05) brightness(1.1) saturate(1.1)",
  bright: "brightness(1.25) contrast(0.95) saturate(1.15)",
  vintage: "sepia(0.45) contrast(1.1) brightness(0.95) saturate(0.85)",
  bw: "grayscale(1) contrast(1.15)",
  blur: "brightness(1.05) contrast(0.92) saturate(1.05) blur(0.4px)",
  quebec: "hue-rotate(10deg) saturate(1.3) contrast(1.08) brightness(1.05)",
};

interface UseLiveCameraOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  previewRef: React.RefObject<HTMLVideoElement>;
}

export function useLiveCamera({ canvasRef, previewRef }: UseLiveCameraOptions) {
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const rafRef = useRef<number | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeFilterRef = useRef<LiveFilter>("none");

  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [activeFilter, setActiveFilterState] = useState<LiveFilter>("none");
  const setActiveFilter = useCallback((f: LiveFilter) => {
    activeFilterRef.current = f;
    setActiveFilterState(f);
  }, []);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Render loop: hidden video → canvas with filter (reads activeFilterRef for live updates)
  const startRenderLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const draw = () => {
      const canvas = canvasRef.current;
      const video = hiddenVideoRef.current;
      if (!canvas || !video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
      }
      ctx.filter = FILTER_CSS[activeFilterRef.current] || "none";
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
  }, [canvasRef]);

  // Start camera preview
  const startCamera = useCallback(
    async (facing: "user" | "environment" = "user") => {
      try {
        // Stop existing stream first
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        });

        streamRef.current = stream;

        // Create hidden video element to draw from
        if (!hiddenVideoRef.current) {
          hiddenVideoRef.current = document.createElement("video");
          hiddenVideoRef.current.playsInline = true;
          hiddenVideoRef.current.muted = true;
          hiddenVideoRef.current.autoplay = true;
        }
        hiddenVideoRef.current.srcObject = stream;
        await hiddenVideoRef.current.play();

        // Also wire to preview element for display
        if (previewRef.current) {
          previewRef.current.srcObject = stream;
          previewRef.current.play().catch(() => {});
        }

        setCameraReady(true);
        setError(null);
        setFacingMode(facing);

        // Start render loop → canvas
        startRenderLoop();
      } catch (err: any) {
        const msg =
          err.name === "NotAllowedError"
            ? "Accès à la caméra refusé. Autorise l'accès dans les paramètres."
            : err.name === "NotFoundError"
              ? "Aucune caméra trouvée sur cet appareil."
              : `Erreur caméra: ${err.message}`;
        setError(msg);
        setCameraReady(false);
      }
    },
    [previewRef, startRenderLoop],
  );

  // Flip camera
  const flipCamera = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user";
    startCamera(next);
  }, [facingMode, startCamera]);

  // Toggle mic
  const toggleMute = useCallback(() => {
    const audioTrack = streamRef.current
      ?.getTracks()
      .find((t) => t.kind === "audio");
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  // Publish via WHIP to Mux
  const startWhipStream = useCallback(
    async (whipUrl: string): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not ready");

      // Capture canvas as video stream at 30fps
      const canvasStream = canvas.captureStream(30);

      // Mix in the audio track from camera
      const audioTrack = streamRef.current
        ?.getTracks()
        .find((t) => t.kind === "audio");
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerRef.current = pc;

      // Add tracks to peer connection
      canvasStream.getTracks().forEach((track) => {
        pc.addTrack(track, canvasStream);
      });

      // Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
          return;
        }
        pc.addEventListener("icegatheringstatechange", () => {
          if (pc.iceGatheringState === "complete") resolve();
        });
        // Timeout fallback
        setTimeout(resolve, 3000);
      });

      // WHIP: POST offer SDP to Mux
      const response = await fetch(whipUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: pc.localDescription?.sdp,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `WHIP handshake failed ${response.status}: ${text.slice(0, 200)}`,
        );
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setIsStreaming(true);
      console.log("[WHIP] Stream published successfully");
    },
    [canvasRef],
  );

  // Stop everything
  const stopStream = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    peerRef.current?.close();
    peerRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.srcObject = null;
    }

    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setCameraReady(false);
  }, [previewRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    cameraReady,
    isStreaming,
    isMuted,
    facingMode,
    activeFilter,
    error,
    startCamera,
    flipCamera,
    toggleMute,
    setActiveFilter,
    startWhipStream,
    stopStream,
  };
}
