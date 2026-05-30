/**
 * Québec Or symbol (Fleur-de-lis with lion, QUÉBEC OR, maple leaf).
 * Place the asset at frontend/public/quebec-or-symbol.png
 */

import React from "react";
import { cn } from "../../lib/utils";

export interface QuebecOrSymbolProps {
  /** Size preset */
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Optional link (e.g. to about or Quebec info) */
  linkTo?: string;
}

const SIZE_CLASSES = {
  xs: "h-5 w-auto",
  sm: "h-7 w-auto",
  md: "h-10 w-auto",
  lg: "h-14 w-auto",
};

const IMG_SRC = "/quebec-or-symbol.png";

export const QuebecOrSymbol: React.FC<QuebecOrSymbolProps> = ({
  size = "sm",
  className,
  linkTo,
}) => {
  const img = (
    <img
      src={IMG_SRC}
      alt="Québec Or"
      className={cn("object-contain", SIZE_CLASSES[size], className)}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );

  if (linkTo) {
    return (
      <a href={linkTo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-gold-400/50 rounded">
        {img}
      </a>
    );
  }

  return <span className="inline-flex items-center shrink-0">{img}</span>;
};

export default QuebecOrSymbol;
