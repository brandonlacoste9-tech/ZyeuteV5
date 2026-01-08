import { useRef } from "react";

interface GestureCallbacks {
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onDoubleTap: () => void;
}

export function useGestures(callbacks: GestureCallbacks) {
  const startPos = useRef({ x: 0, y: 0, time: 0 });
  const lastTap = useRef(0);
  const gestureLocked = useRef<"vertical" | "horizontal" | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    gestureLocked.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;

    // Lock gesture direction once user commits
    if (!gestureLocked.current) {
      if (Math.abs(deltaY) > Math.abs(deltaX) + 10) {
        gestureLocked.current = "vertical";
      } else if (Math.abs(deltaX) > Math.abs(deltaY) + 10) {
        gestureLocked.current = "horizontal";
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    const deltaTime = Date.now() - startPos.current.time;

    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    // Check for double tap
    const now = Date.now();
    if (now - lastTap.current < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      callbacks.onDoubleTap();
      lastTap.current = 0;
      gestureLocked.current = null;
      return;
    }
    lastTap.current = now;

    // Respect gesture lock
    if (gestureLocked.current === "vertical") {
      if (Math.abs(deltaY) > 50 || velocityY > 0.5) {
        if (deltaY < 0) {
          callbacks.onSwipeUp();
        } else {
          callbacks.onSwipeDown();
        }
      }
    } else if (gestureLocked.current === "horizontal") {
      if (Math.abs(deltaX) > 80 || velocityX > 0.5) {
        if (deltaX > 0) {
          callbacks.onSwipeRight();
        } else {
          callbacks.onSwipeLeft();
        }
      }
    } else {
      // Fallback when no lock established
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (Math.abs(deltaY) > 50 || velocityY > 0.5) {
          if (deltaY < 0) {
            callbacks.onSwipeUp();
          } else {
            callbacks.onSwipeDown();
          }
        }
      } else {
        if (Math.abs(deltaX) > 80 || velocityX > 0.5) {
          if (deltaX > 0) {
            callbacks.onSwipeRight();
          } else {
            callbacks.onSwipeLeft();
          }
        }
      }
    }

    gestureLocked.current = null;
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}
