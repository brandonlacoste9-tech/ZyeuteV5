import { type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type SheetSide = "bottom" | "right";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Slide-up bottom sheet (default) or right-edge drawer. */
  side?: SheetSide;
  /** Applied to the full-screen backdrop layer (use for z-index). */
  className?: string;
  /** Applied to the panel itself (use for sizing: max-width / max-height). */
  panelClassName?: string;
  /** Accessible label for the click-to-dismiss backdrop. */
  closeLabel?: string;
  /** Show the grab handle on bottom sheets. Defaults to true for bottom. */
  showHandle?: boolean;
};

const PANEL_CHROME =
  "relative leather-overlay border-gold-500/30 shadow-[0_-8px_40px_rgba(0,0,0,0.7)]";

/**
 * Voyageur bottom sheet / drawer chrome shared across feed surfaces.
 * Handles the backdrop, click-to-dismiss, leather panel, gold border and
 * enter/exit motion so every sheet feels native to the feed.
 */
export function SheetShell({
  open,
  onClose,
  children,
  side = "bottom",
  className = "",
  panelClassName = "",
  closeLabel = "Fermer",
  showHandle,
}: Props) {
  const reduceMotion = useReducedMotion();
  const isBottom = side === "bottom";
  const handleVisible = showHandle ?? isBottom;

  const panelInitial = reduceMotion
    ? { opacity: 0 }
    : isBottom
      ? { y: "100%" }
      : { x: "100%" };
  const panelAnimate = reduceMotion ? { opacity: 1 } : { x: 0, y: 0 };

  const layoutClass = isBottom
    ? "flex flex-col justify-end"
    : "flex flex-row justify-end";

  const shapeClass = isBottom
    ? "w-full rounded-t-2xl border-t"
    : "h-full w-full md:w-[400px] rounded-t-2xl md:rounded-t-none md:rounded-l-2xl border-t md:border-t-0 md:border-l";

  return (
    <AnimatePresence>
      {open ? (
        <div className={`fixed inset-0 ${layoutClass} ${className}`}>
          <motion.button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default bg-black/80 backdrop-blur-sm"
            aria-label={closeLabel}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className={`${PANEL_CHROME} ${shapeClass} ${panelClassName}`}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelInitial}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: "spring", damping: 32, stiffness: 360 }
            }
          >
            {handleVisible ? (
              <div className="flex justify-center pt-2.5 pb-1">
                <span className="h-1 w-10 rounded-full bg-gold-500/40" />
              </div>
            ) : null}
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
