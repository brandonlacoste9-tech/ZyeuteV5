import { useState, useCallback } from "react";
import { logger } from "@/lib/logger";

interface VisionResult {
  description: string;
  labels: string[];
}

export function useVideoVision() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeFrame = useCallback(
    async (videoElement: HTMLVideoElement): Promise<VisionResult | null> => {
      if (!videoElement || videoElement.paused || videoElement.ended)
        return null;

      try {
        setIsAnalyzing(true);

        // Capture Frame
        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth / 2; // Downscale for speed
        canvas.height = videoElement.videoHeight / 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL("image/jpeg", 0.6); // Compress
        const base64Data = base64Image.split(",")[1];

        // Send to Local AI (Ollama/Vertex Bridge)
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: "Describe this video frame in 1 short sentence (Quebec French). Focus on the vibe.",
                  },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Vision API Error: ${response.status}`);
        }

        const data = await response.json();
        // Parse Vertex/Gemini/Ollama response structure
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          data.response?.text?.() || // If using bridge Helper
          "Analyse impossible.";

        return {
          description: text,
          labels: ["Ollama", "Vision"],
        };
      } catch (error) {
        logger.error("[useVideoVision] Analysis failed", error);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  return { analyzeFrame, isAnalyzing };
}
