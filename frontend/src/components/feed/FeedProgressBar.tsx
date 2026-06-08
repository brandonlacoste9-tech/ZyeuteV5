/**
 * FeedProgressBar - Isolated TikTok-style playback progress bar.
 *
 * The active video fires `timeupdate` several times per second. Driving that
 * through the parent feed's React state forced the entire feed tree (every
 * slide) to re-render multiple times per second, which was a major source of
 * scroll/playback jank. This component owns its own state and exposes an
 * imperative `setProgress` handle so the hot timeupdate path never touches the
 * parent's render cycle.
 */

import { forwardRef, useImperativeHandle, useState } from "react";

export interface FeedProgressBarHandle {
  setProgress: (fraction: number) => void;
}

export const FeedProgressBar = forwardRef<FeedProgressBarHandle>(
  function FeedProgressBar(_props, ref) {
    const [fraction, setFraction] = useState(0);

    useImperativeHandle(
      ref,
      () => ({
        setProgress: (next: number) => {
          if (!Number.isFinite(next)) return;
          const clamped = next < 0 ? 0 : next > 1 ? 1 : next;
          // Avoid sub-pixel churn: only re-render when the bar moves ≥0.3%.
          setFraction((prev) =>
            Math.abs(prev - clamped) >= 0.003 || clamped === 0 || clamped === 1
              ? clamped
              : prev,
          );
        },
      }),
      [],
    );

    return (
      <div className="absolute bottom-0 left-0 right-0 z-30 h-[3px] bg-white/10">
        <div
          className="h-full rounded-r-full transition-[width] duration-200 ease-linear"
          style={{
            width: `${fraction * 100}%`,
            background:
              "linear-gradient(90deg, var(--color-gold-600), var(--color-gold-400))",
            boxShadow: "0 0 6px rgba(var(--accent-rgb), 0.5)",
          }}
        />
      </div>
    );
  },
);
