/**
 * DoubleTapHeart — TikTok-style double-tap to like with flying heart animation
 * Shows a big animated heart at the tap location that scales up, floats, and fades out
 */

import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface HeartBurst {
  id: number;
  x: number;
  y: number;
}

interface DoubleTapHeartProps {
  onDoubleTap: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const DoubleTapHeart: React.FC<DoubleTapHeartProps> = ({
  onDoubleTap,
  children,
  className,
  disabled = false,
}) => {
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const lastTapRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartIdRef = useRef(0);

  const spawnHeart = useCallback(
    (x: number, y: number) => {
      const id = heartIdRef.current++;
      setHearts((prev) => [...prev, { id, x, y }]);

      // Remove after animation completes (900ms)
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== id));
      }, 900);
    },
    [],
  );

  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      lastTapRef.current = now;

      // Clear single-tap timer
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }

      // Double tap detected (< 300ms between taps)
      if (timeSinceLastTap < 300) {
        // Get tap position relative to container
        let clientX: number, clientY: number;
        if ("touches" in e) {
          clientX = e.touches[0]?.clientX ?? 0;
          clientY = e.touches[0]?.clientY ?? 0;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        spawnHeart(x, y);
        onDoubleTap();
      }
    },
    [onDoubleTap, spawnHeart, disabled],
  );

  return (
    <div
      className={cn("relative", className)}
      onClick={handleTap}
      onTouchEnd={handleTap}
    >
      {children}

      {/* Heart Burst Animations */}
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: heart.x - 40,
            top: heart.y - 40,
          }}
        >
          {/* Main heart */}
          <div className="doubletap-heart">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill="#FF2D55"
                stroke="#FF2D55"
                strokeWidth="1"
              />
            </svg>
          </div>

          {/* Sparkle particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="doubletap-sparkle"
              style={{
                left: 40,
                top: 40,
                animationDelay: `${i * 0.05}s`,
                ["--angle" as any]: `${i * 60}deg`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default DoubleTapHeart;
